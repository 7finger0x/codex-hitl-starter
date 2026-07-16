import { once } from "node:events";
import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";

import { nowUtc } from "../../../packages/core/src/time.js";
import {
  WorkerRuntime,
  type LeasedJob,
  type WorkerHealth,
  type WorkerLeaseAdapter,
} from "./worker.js";

export interface WorkerHealthServerOptions {
  readonly clock?: () => number;
}

export function createWorkerHealthServer(
  worker: Pick<WorkerRuntime, "health">,
  options: WorkerHealthServerOptions = {},
): Server {
  const clock = options.clock ?? Date.now;
  return createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/health/live") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "NOT_FOUND" }));
      return;
    }
    const health: WorkerHealth = worker.health();
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json",
    });
    response.end(
      JSON.stringify({
        status: "ok",
        service: "foundation-workers",
        version: "0.0.0",
        time: nowUtc(clock),
        checks: {
          process: "ok",
          ...(health.accepting ? {} : { draining: "degraded" }),
        },
      }),
    );
  });
}

class IdleLeaseAdapter implements WorkerLeaseAdapter {
  async lease(): Promise<LeasedJob | null> {
    return null;
  }
  async heartbeat(): Promise<void> {}
  async complete(): Promise<void> {}
  async retry(): Promise<void> {}
  async fail(): Promise<void> {}
  async release(): Promise<void> {}
}

async function main(): Promise<void> {
  const controller = new AbortController();
  const worker = new WorkerRuntime({
    adapter: new IdleLeaseAdapter(),
    handler: async () => ({ reference: "idle" }),
  });
  const server = createWorkerHealthServer(worker);
  const shutdown = () => controller.abort();
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  server.listen(9464, "0.0.0.0");
  await once(server, "listening");
  try {
    await worker.run(controller.signal);
  } finally {
    server.close();
    await once(server, "close");
    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  void main().catch(() => {
    process.exitCode = 1;
  });
}
