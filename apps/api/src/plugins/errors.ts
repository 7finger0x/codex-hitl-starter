import type { FastifyError, FastifyInstance } from "fastify";

import { createCorrelationId } from "../../../../packages/core/src/correlation.js";
import {
  StableError,
  asStableError,
  errorCode,
  stableErrorResponse,
} from "../../../../packages/core/src/errors.js";

function validationFailure(error: unknown): StableError {
  if (
    typeof error !== "object" ||
    error === null ||
    !("validation" in error) ||
    (error as FastifyError).validation === undefined
  ) {
    return asStableError(error);
  }
  return new StableError({
    code: errorCode("REQUEST_VALIDATION_FAILED"),
    message: "The request does not match the approved schema.",
    httpStatus: 400,
    retryable: false,
    retryGuidance: "Correct the request using the published contract and retry.",
  });
}

export function installErrorMapping(app: FastifyInstance): void {
  app.setErrorHandler(async (error, request, reply) => {
    const correlationId = request.correlationId ?? createCorrelationId();
    const failure = error instanceof StableError ? error : validationFailure(error);
    reply.header("X-Correlation-Id", correlationId);
    await reply.status(failure.httpStatus).send(stableErrorResponse(failure, correlationId));
  });
}
