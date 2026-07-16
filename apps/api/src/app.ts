import { pathToFileURL } from "node:url";

import Fastify, { type FastifyInstance } from "fastify";

import { HealthRegistry } from "../../../packages/observability/src/health.js";
import { installAuthentication, type AuthenticateToken } from "./plugins/authentication.js";
import { installErrorMapping } from "./plugins/errors.js";
import { installRequestContext } from "./plugins/request-context.js";
import { registerHealthRoutes } from "./routes/health.js";

export type { AuthenticatedPrincipal } from "./plugins/authentication.js";

export interface BuildAppOptions {
  readonly health?: HealthRegistry;
  readonly clock?: () => number;
  readonly authenticateToken?: AuthenticateToken;
  readonly configure?: (app: FastifyInstance) => void;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false, ajv: { customOptions: { allErrors: false } } });
  const health =
    options.health ??
    new HealthRegistry(options.clock === undefined ? {} : { clock: options.clock });

  installRequestContext(app);
  installAuthentication(app, options.authenticateToken);
  installErrorMapping(app);
  registerHealthRoutes(app, { health, service: "foundation-api", version: "0.0.0" });
  options.configure?.(app);
  return app;
}

async function main(): Promise<void> {
  const app = buildApp();
  await app.listen({ host: "0.0.0.0", port: 3001 });
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  void main().catch(() => {
    process.exitCode = 1;
  });
}
