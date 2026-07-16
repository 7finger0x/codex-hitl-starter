import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";
import { test } from "node:test";

import { createWorkerHealthServer } from "./main.js";
import {
  WorkerRuntime,
  type LeasedJob,
  type WorkerLeaseAdapter,
  type WorkerResult,
} from "./worker.js";

const TENANT_ID = "01941f29-7c7b-7000-8000-000000000010";
const ENVIRONMENT_ID = "01941f29-7c7b-7000-8000-000000000011";
const JOB_ID = "01941f29-7c7b-7000-8000-000000000012";
const TRACEPARENT = "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01";

class MemoryAdapter implements WorkerLeaseAdapter {
  readonly events: string[] = [];
  readonly retries: Array<{ delayMs: number; code: string }> = [];
  readonly failures: string[] = [];
  jobs: LeasedJob[];

  constructor(...jobs: LeasedJob[]) {
    this.jobs = [...jobs];
  }

  async lease(): Promise<LeasedJob | null> {
    this.events.push("lease");
    return this.jobs.shift() ?? null;
  }

  async heartbeat(job: LeasedJob): Promise<void> {
    this.events.push(`heartbeat:${job.id}`);
  }

  async complete(job: LeasedJob, result: WorkerResult): Promise<void> {
    this.events.push(`complete:${job.id}:${result.reference}`);
  }

  async retry(_job: LeasedJob, code: string, delayMs: number): Promise<void> {
    this.retries.push({ delayMs, code });
  }

  async fail(_job: LeasedJob, code: string): Promise<void> {
    this.failures.push(code);
  }

  async release(job: LeasedJob, code: string): Promise<void> {
    this.events.push(`release:${job.id}:${code}`);
  }
}

function job(overrides: Partial<LeasedJob> = {}): LeasedJob {
  return {
    id: JOB_ID,
    tenantId: TENANT_ID,
    environmentId: ENVIRONMENT_ID,
    attempt: 1,
    maxAttempts: 4,
    traceContext: { traceparent: TRACEPARENT },
    payload: { synthetic: true },
    ...overrides,
  };
}

test("valid jobs propagate tenant and W3C trace context through heartbeat and completion", async () => {
  const adapter = new MemoryAdapter(job());
  const observed: unknown[] = [];
  const worker = new WorkerRuntime({
    adapter,
    handler: async (context) => {
      observed.push(context);
      return { reference: "result-1" };
    },
  });

  assert.equal(await worker.runOnce(new AbortController().signal), "completed");
  assert.equal(adapter.events[0], "lease");
  assert.equal(adapter.events[1], `heartbeat:${JOB_ID}`);
  assert.equal(adapter.events[2], `complete:${JOB_ID}:result-1`);
  assert.equal(observed.length, 1);
  const context = observed[0] as {
    tenantId: string;
    environmentId: string;
    traceParent: string;
  };
  assert.equal(context.tenantId, TENANT_ID);
  assert.equal(context.environmentId, ENVIRONMENT_ID);
  assert.equal(context.traceParent, TRACEPARENT);
});

test("malformed tenant or trace context fails before handler execution", async () => {
  for (const invalid of [
    job({ tenantId: "wrong-tenant" }),
    job({ traceContext: { traceparent: "bad-trace" } }),
  ]) {
    const adapter = new MemoryAdapter(invalid);
    let handlerCalls = 0;
    const worker = new WorkerRuntime({
      adapter,
      handler: async () => {
        handlerCalls += 1;
        return { reference: "impossible" };
      },
    });
    assert.equal(await worker.runOnce(new AbortController().signal), "failed");
    assert.equal(handlerCalls, 0);
    assert.deepEqual(adapter.failures, ["INVALID_JOB_CONTEXT"]);
  }
});

test("retry delay is deterministic and terminal failure is bounded", async () => {
  const retrying = new MemoryAdapter(job({ attempt: 2, maxAttempts: 4 }));
  const retryWorker = new WorkerRuntime({
    adapter: retrying,
    retryBaseDelayMs: 100,
    retryMaximumDelayMs: 1_000,
    handler: async () => {
      throw new Error("credential=must-not-be-retained");
    },
  });
  assert.equal(await retryWorker.runOnce(new AbortController().signal), "retried");
  assert.deepEqual(retrying.retries, [{ delayMs: 200, code: "JOB_HANDLER_FAILED" }]);

  const exhausted = new MemoryAdapter(job({ attempt: 4, maxAttempts: 4 }));
  const exhaustedWorker = new WorkerRuntime({
    adapter: exhausted,
    handler: async () => {
      throw new Error("raw failure");
    },
  });
  assert.equal(await exhaustedWorker.runOnce(new AbortController().signal), "failed");
  assert.deepEqual(exhausted.failures, ["JOB_ATTEMPTS_EXHAUSTED"]);
});

test("heartbeat failure uses the bounded retry policy without running the handler", async () => {
  const adapter = new (class extends MemoryAdapter {
    override async heartbeat(): Promise<void> {
      throw new Error("heartbeat transport secret must not escape");
    }
  })(job({ attempt: 2, maxAttempts: 4 }));
  let handlerCalls = 0;
  const worker = new WorkerRuntime({
    adapter,
    retryBaseDelayMs: 100,
    retryMaximumDelayMs: 1_000,
    handler: async () => {
      handlerCalls += 1;
      return { reference: "impossible" };
    },
  });

  assert.equal(await worker.runOnce(new AbortController().signal), "retried");
  assert.equal(handlerCalls, 0);
  assert.deepEqual(adapter.retries, [{ delayMs: 200, code: "JOB_HEARTBEAT_FAILED" }]);
});

test("shutdown aborts active work, releases its lease, and takes no new lease", async () => {
  const controller = new AbortController();
  const adapter = new MemoryAdapter(job(), job({ id: "01941f29-7c7b-7000-8000-000000000013" }));
  const worker = new WorkerRuntime({
    adapter,
    handler: async ({ signal }) => {
      controller.abort();
      assert.equal(signal.aborted, true);
      return { reference: "not-completed" };
    },
  });

  await worker.run(controller.signal);
  assert.equal(adapter.events.filter((event) => event === "lease").length, 1);
  assert.ok(adapter.events.includes(`release:${JOB_ID}:WORKER_SHUTDOWN`));
  assert.equal(worker.health().accepting, false);
  assert.equal(worker.health().activeJobs, 0);
});

test("worker health listener exposes bounded liveness without secrets", async () => {
  const worker = new WorkerRuntime({
    adapter: new MemoryAdapter(),
    handler: async () => ({ reference: "unused" }),
  });
  const server = createWorkerHealthServer(worker, { clock: () => 1_735_689_600_123 });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.notEqual(address, null);
    assert.equal(typeof address, "object");
    const port = (address as { port: number }).port;
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const outgoing = request(
        { host: "127.0.0.1", port, path: "/health/live", method: "GET" },
        (incoming) => {
          let body = "";
          incoming.setEncoding("utf8");
          incoming.on("data", (chunk: string) => (body += chunk));
          incoming.on("end", () => resolve({ status: incoming.statusCode ?? 0, body }));
        },
      );
      outgoing.once("error", reject);
      outgoing.end();
    });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body), {
      status: "ok",
      service: "foundation-workers",
      version: "0.0.0",
      time: "2025-01-01T00:00:00.123Z",
      checks: { process: "ok" },
    });
    assert.doesNotMatch(response.body, /password|token|environment/i);
  } finally {
    server.close();
    await once(server, "close");
  }
});
