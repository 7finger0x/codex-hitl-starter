import type { ErrorResponse } from "./generated/foundation-contracts.js";
import type { CorrelationId } from "./correlation.js";

declare const errorCodeBrand: unique symbol;

export type ErrorCode = string & {
  readonly [errorCodeBrand]: "ErrorCode";
};

export interface StableErrorDetails {
  readonly field?: string;
  readonly reasonCode?: ErrorCode;
  readonly retryAfterSeconds?: number;
}

export interface StableErrorOptions {
  readonly code: ErrorCode;
  readonly message: string;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly retryGuidance: string;
  readonly details?: StableErrorDetails;
}

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;
const MAX_SAFE_TEXT_LENGTH = 1_024;

function safeText(value: string, label: string, maximum = MAX_SAFE_TEXT_LENGTH): string {
  if (typeof value !== "string" || value.length < 1 || value.length > maximum) {
    throw new TypeError(`${label} must contain between 1 and ${maximum} characters`);
  }
  return value;
}

export function errorCode(value: unknown): ErrorCode {
  if (typeof value !== "string" || !ERROR_CODE_PATTERN.test(value)) {
    throw new TypeError("Stable error code must be 2-64 uppercase letters, digits, or underscores");
  }
  return value as ErrorCode;
}

function validateDetails(details: StableErrorDetails): Readonly<StableErrorDetails> {
  const field =
    details.field === undefined ? undefined : safeText(details.field, "Error detail field", 255);
  const reasonCode = details.reasonCode === undefined ? undefined : errorCode(details.reasonCode);
  if (details.retryAfterSeconds !== undefined) {
    if (
      !Number.isInteger(details.retryAfterSeconds) ||
      details.retryAfterSeconds < 1 ||
      details.retryAfterSeconds > 86_400
    ) {
      throw new TypeError("Error retry-after seconds must be an integer from 1 through 86400");
    }
  }
  return Object.freeze({
    ...(field === undefined ? {} : { field }),
    ...(reasonCode === undefined ? {} : { reasonCode }),
    ...(details.retryAfterSeconds === undefined
      ? {}
      : { retryAfterSeconds: details.retryAfterSeconds }),
  });
}

export class StableError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly retryGuidance: string;
  readonly details?: Readonly<StableErrorDetails>;

  constructor(options: StableErrorOptions) {
    const message = safeText(options.message, "Stable error message");
    super(message);
    this.name = "StableError";
    this.code = errorCode(options.code);
    if (
      !Number.isInteger(options.httpStatus) ||
      options.httpStatus < 400 ||
      options.httpStatus > 599
    ) {
      throw new TypeError("Stable error HTTP status must be an integer from 400 through 599");
    }
    this.httpStatus = options.httpStatus;
    if (typeof options.retryable !== "boolean") {
      throw new TypeError("Stable error retryable flag must be boolean");
    }
    this.retryable = options.retryable;
    this.retryGuidance = safeText(options.retryGuidance, "Stable error retry guidance");
    if (options.details !== undefined) {
      this.details = validateDetails(options.details);
    }
  }
}

const internalErrorOptions: StableErrorOptions = {
  code: errorCode("INTERNAL_ERROR"),
  message: "The request could not be completed.",
  httpStatus: 500,
  retryable: false,
  retryGuidance: "Contact support with the correlation identifier.",
};

/** Converts unknown failures without reflecting their messages, stacks, or causes. */
export function asStableError(value: unknown): StableError {
  return value instanceof StableError ? value : new StableError(internalErrorOptions);
}

export function stableErrorResponse(
  failure: StableError,
  correlationId: CorrelationId,
): ErrorResponse {
  const base = {
    code: failure.code,
    message: failure.message,
    correlation_id: correlationId,
    retryable: failure.retryable,
    retry_guidance: failure.retryGuidance,
  };

  if (failure.details === undefined) {
    return { error: base };
  }

  const details: NonNullable<ErrorResponse["error"]["details"]> = {
    ...(failure.details.field === undefined ? {} : { field: failure.details.field }),
    ...(failure.details.reasonCode === undefined
      ? {}
      : { reason_code: failure.details.reasonCode }),
    ...(failure.details.retryAfterSeconds === undefined
      ? {}
      : { retry_after_seconds: failure.details.retryAfterSeconds }),
  };

  return { error: { ...base, details } };
}
