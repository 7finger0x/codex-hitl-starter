import type { FastifyInstance } from "fastify";

import { StableError, errorCode } from "../../../../packages/core/src/errors.js";
import type { Health } from "../../../../packages/core/src/generated/foundation-contracts.js";
import foundationApi from "../../../../specs/002-platform-foundation/contracts/foundation-api.openapi.json" with { type: "json" };
import {
  HealthRegistry,
  type DependencyHealthStatus,
} from "../../../../packages/observability/src/health.js";

export interface HealthRouteOptions {
  readonly health: HealthRegistry;
  readonly service: string;
  readonly version: string;
}

type WireHealthStatus = Health["status"];

function wireStatus(status: DependencyHealthStatus): WireHealthStatus {
  return status === "healthy" ? "ok" : status === "degraded" ? "degraded" : "unavailable";
}

export function registerHealthRoutes(app: FastifyInstance, options: HealthRouteOptions): void {
  const healthSchema = foundationApi.components.schemas.Health;
  const errorSchema = foundationApi.components.schemas.ErrorResponse;

  app.get(
    "/health/live",
    {
      config: { publicRoute: true },
      schema: { response: { 200: healthSchema } },
    },
    async (): Promise<Health> => {
      const snapshot = options.health.liveness();
      return {
        status: "ok",
        service: options.service,
        version: options.version,
        time: snapshot.checked_at,
        checks: { process: "ok" },
      };
    },
  );

  app.get(
    "/health/ready",
    {
      config: { publicRoute: true },
      schema: { response: { 200: healthSchema, 503: errorSchema } },
    },
    async (): Promise<Health> => {
      const snapshot = await options.health.readiness();
      if (!snapshot.ready) {
        throw new StableError({
          code: errorCode("SERVICE_UNAVAILABLE"),
          message: "The service is not ready.",
          httpStatus: 503,
          retryable: true,
          retryGuidance: "Retry after the required service dependencies recover.",
        });
      }
      return {
        status: wireStatus(snapshot.status),
        service: options.service,
        version: options.version,
        time: snapshot.checked_at,
        checks: Object.fromEntries(
          snapshot.dependencies.map((dependency) => [
            dependency.name,
            wireStatus(dependency.status),
          ]),
        ),
      };
    },
  );
}
