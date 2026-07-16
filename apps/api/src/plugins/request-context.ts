import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  CORRELATION_ID_HEADER,
  createCorrelationId,
  resolveCorrelationId,
  type CorrelationId,
} from "../../../../packages/core/src/correlation.js";
import { StableError, errorCode } from "../../../../packages/core/src/errors.js";

declare module "fastify" {
  interface FastifyContextConfig {
    readonly publicRoute?: boolean;
    readonly idempotent?: boolean;
    readonly requiresIfMatch?: boolean;
  }

  interface FastifyRequest {
    correlationId: CorrelationId;
    idempotencyKey?: string;
    expectedVersion?: number;
  }
}

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._~:-]{16,255}$/;
const WEAK_ETAG_PATTERN = /^W\/"([1-9][0-9]*)"$/;

function invalidRequest(code: string, message: string, field: string): StableError {
  return new StableError({
    code: errorCode(code),
    message,
    httpStatus: 400,
    retryable: false,
    retryGuidance: `Correct the ${field} header and retry the request.`,
    details: { field },
  });
}

function oneHeader(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value === undefined ? undefined : "";
}

export function requestCorrelationId(request: FastifyRequest): CorrelationId {
  return request.correlationId ?? createCorrelationId();
}

export function installRequestContext(app: FastifyInstance): void {
  app.decorateRequest("correlationId", createCorrelationId());
  app.decorateRequest("idempotencyKey", undefined);
  app.decorateRequest("expectedVersion", undefined);

  app.addHook("onRequest", async (request, reply) => {
    try {
      const resolved = resolveCorrelationId(request.headers[CORRELATION_ID_HEADER]);
      request.correlationId = resolved.correlationId;
      reply.header("X-Correlation-Id", resolved.correlationId);
    } catch {
      request.correlationId = createCorrelationId();
      reply.header("X-Correlation-Id", request.correlationId);
      throw invalidRequest(
        "INVALID_CORRELATION_ID",
        "The correlation identifier is malformed.",
        "X-Correlation-Id",
      );
    }
  });

  app.addHook("preValidation", async (request) => {
    const config = request.routeOptions.config;
    if (config.idempotent === true) {
      const key = oneHeader(request.headers["idempotency-key"]);
      if (key === undefined) {
        throw invalidRequest(
          "IDEMPOTENCY_KEY_REQUIRED",
          "An idempotency key is required for this request.",
          "Idempotency-Key",
        );
      }
      if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
        throw invalidRequest(
          "INVALID_IDEMPOTENCY_KEY",
          "The idempotency key is malformed.",
          "Idempotency-Key",
        );
      }
      request.idempotencyKey = key;
    }

    if (config.requiresIfMatch === true) {
      const value = oneHeader(request.headers["if-match"]);
      const match = value === undefined ? null : WEAK_ETAG_PATTERN.exec(value);
      if (match === null) {
        throw invalidRequest(
          "INVALID_IF_MATCH",
          "A canonical weak resource version is required.",
          "If-Match",
        );
      }
      request.expectedVersion = Number.parseInt(match[1]!, 10);
    }
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    if (reply.hasHeader("etag") || typeof payload !== "string") return payload;
    try {
      const body = JSON.parse(payload) as { readonly version?: unknown };
      if (Number.isSafeInteger(body.version) && (body.version as number) > 0) {
        reply.header("ETag", `W/"${String(body.version)}"`);
      }
    } catch {
      // Non-JSON output is not versioned. Response schemas still validate route output.
    }
    return payload;
  });
}
