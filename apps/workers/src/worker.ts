import { setTimeout as delay } from "node:timers/promises";

import { formatTraceParent, parseTraceParent } from "../../../packages/observability/src/index.js";
import { parseUuidV7 } from "../../../packages/core/src/ids.js";

export interface JobTraceContext {
  readonly traceparent: string;
  readonly tracestate?: string | null;
}

export interface LeasedJob {
  readonly id: string;
  readonly tenantId: string;
  readonly environmentId: string;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly traceContext: JobTraceContext;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface WorkerResult {
  readonly reference: string;
}

export interface WorkerJobContext {
  readonly jobId: string;
  readonly tenantId: string;
  readonly environmentId: string;
  readonly attempt: number;
  readonly traceParent: string;
  readonly traceState?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly signal: AbortSignal;
}

export interface WorkerLeaseAdapter {
  lease(signal: AbortSignal): Promise<LeasedJob | null>;
  heartbeat(job: LeasedJob, signal: AbortSignal): Promise<void>;
  complete(job: LeasedJob, result: WorkerResult): Promise<void>;
  retry(job: LeasedJob, reasonCode: string, delayMs: number): Promise<void>;
  fail(job: LeasedJob, reasonCode: string): Promise<void>;
  release(job: LeasedJob, reasonCode: string): Promise<void>;
}

export type WorkerRunResult = "idle" | "completed" | "retried" | "failed" | "released";

export interface WorkerRuntimeOptions {
  readonly adapter: WorkerLeaseAdapter;
  readonly handler: (context: WorkerJobContext) => WorkerResult | Promise<WorkerResult>;
  readonly heartbeatIntervalMs?: number;
  readonly idleDelayMs?: number;
  readonly retryBaseDelayMs?: number;
  readonly retryMaximumDelayMs?: number;
  readonly maximumAttempts?: number;
}

export interface WorkerHealth {
  readonly accepting: boolean;
  readonly activeJobs: number;
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  const selected = value ?? fallback;
  if (!Number.isInteger(selected) || selected < minimum || selected > maximum) {
    throw new TypeError(`${label} must be an integer from ${minimum} through ${maximum}`);
  }
  return selected;
}

function jobContext(job: LeasedJob, signal: AbortSignal): WorkerJobContext {
  try {
    const jobId = parseUuidV7(job.id);
    const tenantId = parseUuidV7(job.tenantId);
    const environmentId = parseUuidV7(job.environmentId);
    const parsedTrace = parseTraceParent(job.traceContext.traceparent);
    if (
      !Number.isInteger(job.attempt) ||
      job.attempt < 1 ||
      !Number.isInteger(job.maxAttempts) ||
      job.maxAttempts < 1 ||
      job.attempt > job.maxAttempts ||
      typeof job.payload !== "object" ||
      job.payload === null ||
      Array.isArray(job.payload) ||
      (job.traceContext.tracestate !== undefined &&
        job.traceContext.tracestate !== null &&
        (typeof job.traceContext.tracestate !== "string" ||
          job.traceContext.tracestate.length > 512))
    ) {
      throw new TypeError("invalid job context");
    }
    return Object.freeze({
      jobId,
      tenantId,
      environmentId,
      attempt: job.attempt,
      traceParent: formatTraceParent(parsedTrace),
      ...(typeof job.traceContext.tracestate === "string"
        ? { traceState: job.traceContext.tracestate }
        : {}),
      payload: Object.freeze({ ...job.payload }),
      signal,
    });
  } catch {
    throw new TypeError("Job tenant, environment, lease, or trace context is malformed");
  }
}

export class WorkerRuntime {
  readonly #adapter: WorkerLeaseAdapter;
  readonly #handler: WorkerRuntimeOptions["handler"];
  readonly #heartbeatIntervalMs: number;
  readonly #idleDelayMs: number;
  readonly #retryBaseDelayMs: number;
  readonly #retryMaximumDelayMs: number;
  readonly #maximumAttempts: number;
  #accepting = true;
  #activeJobs = 0;

  constructor(options: WorkerRuntimeOptions) {
    if (typeof options.handler !== "function") throw new TypeError("Worker handler is required");
    this.#adapter = options.adapter;
    this.#handler = options.handler;
    this.#heartbeatIntervalMs = boundedInteger(
      options.heartbeatIntervalMs,
      5_000,
      100,
      60_000,
      "Heartbeat interval",
    );
    this.#idleDelayMs = boundedInteger(options.idleDelayMs, 250, 1, 10_000, "Idle delay");
    this.#retryBaseDelayMs = boundedInteger(
      options.retryBaseDelayMs,
      1_000,
      1,
      60_000,
      "Retry base delay",
    );
    this.#retryMaximumDelayMs = boundedInteger(
      options.retryMaximumDelayMs,
      60_000,
      this.#retryBaseDelayMs,
      900_000,
      "Retry maximum delay",
    );
    this.#maximumAttempts = boundedInteger(options.maximumAttempts, 10, 1, 100, "Maximum attempts");
  }

  health(): WorkerHealth {
    return { accepting: this.#accepting, activeJobs: this.#activeJobs };
  }

  async run(signal: AbortSignal): Promise<void> {
    this.#accepting = !signal.aborted;
    try {
      while (!signal.aborted) {
        const result = await this.runOnce(signal);
        if (result === "idle" && !signal.aborted) {
          try {
            await delay(this.#idleDelayMs, undefined, { signal });
          } catch {
            if (!signal.aborted) throw new Error("Worker idle delay failed");
          }
        }
      }
    } finally {
      this.#accepting = false;
    }
  }

  async runOnce(signal: AbortSignal): Promise<WorkerRunResult> {
    if (signal.aborted) return "idle";
    const job = await this.#adapter.lease(signal);
    if (job === null) return "idle";

    const jobController = new AbortController();
    const forwardAbort = () => jobController.abort();
    signal.addEventListener("abort", forwardAbort, { once: true });
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let heartbeatFailure = false;
    let heartbeatInFlight = false;
    this.#activeJobs += 1;

    const retryOrFail = async (reasonCode: string): Promise<"retried" | "failed"> => {
      const maximumAttempts = Math.min(job.maxAttempts, this.#maximumAttempts);
      if (job.attempt >= maximumAttempts) {
        await this.#adapter.fail(job, "JOB_ATTEMPTS_EXHAUSTED");
        return "failed";
      }
      const retryDelay = Math.min(
        this.#retryMaximumDelayMs,
        this.#retryBaseDelayMs * 2 ** (job.attempt - 1),
      );
      await this.#adapter.retry(job, reasonCode, retryDelay);
      return "retried";
    };

    try {
      let context: WorkerJobContext;
      try {
        context = jobContext(job, jobController.signal);
      } catch {
        await this.#adapter.fail(job, "INVALID_JOB_CONTEXT");
        return "failed";
      }

      try {
        await this.#adapter.heartbeat(job, jobController.signal);
      } catch {
        if (signal.aborted) {
          await this.#adapter.release(job, "WORKER_SHUTDOWN");
          return "released";
        }
        return retryOrFail("JOB_HEARTBEAT_FAILED");
      }
      heartbeatTimer = setInterval(() => {
        if (heartbeatInFlight || jobController.signal.aborted) return;
        heartbeatInFlight = true;
        void this.#adapter
          .heartbeat(job, jobController.signal)
          .catch(() => {
            heartbeatFailure = true;
            jobController.abort();
          })
          .finally(() => {
            heartbeatInFlight = false;
          });
      }, this.#heartbeatIntervalMs);

      try {
        const result = await this.#handler(context);
        if (signal.aborted) {
          await this.#adapter.release(job, "WORKER_SHUTDOWN");
          return "released";
        }
        if (heartbeatFailure) throw new Error("heartbeat failed");
        if (
          typeof result.reference !== "string" ||
          result.reference.length < 1 ||
          result.reference.length > 512
        ) {
          throw new TypeError("Worker result reference is malformed");
        }
        await this.#adapter.complete(job, Object.freeze({ reference: result.reference }));
        return "completed";
      } catch {
        if (signal.aborted) {
          await this.#adapter.release(job, "WORKER_SHUTDOWN");
          return "released";
        }
        return retryOrFail(heartbeatFailure ? "JOB_HEARTBEAT_FAILED" : "JOB_HANDLER_FAILED");
      }
    } finally {
      if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
      signal.removeEventListener("abort", forwardAbort);
      this.#activeJobs -= 1;
    }
  }
}
