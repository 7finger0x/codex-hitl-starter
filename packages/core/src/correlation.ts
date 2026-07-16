import { createUuidV7, parseUuidV7, type UuidV7 } from "./ids.js";

export const CORRELATION_ID_HEADER = "x-correlation-id" as const;
export type CorrelationId = UuidV7<"CorrelationId">;

export interface ResolvedCorrelationId {
  readonly correlationId: CorrelationId;
  readonly generated: boolean;
}

export function createCorrelationId(): CorrelationId {
  return createUuidV7<"CorrelationId">();
}

export function parseCorrelationId(value: unknown): CorrelationId {
  try {
    return parseUuidV7<"CorrelationId">(value);
  } catch {
    throw new TypeError("Expected exactly one canonical UUIDv7 correlation identifier");
  }
}

/**
 * Accepts one inbound header value. Missing values mint a new identifier;
 * arrays, combined headers, whitespace variants, and malformed values fail.
 */
export function resolveCorrelationId(
  headerValue: unknown,
  generate: () => CorrelationId = createCorrelationId,
): ResolvedCorrelationId {
  if (headerValue === undefined) {
    return {
      correlationId: parseCorrelationId(generate()),
      generated: true,
    };
  }

  return {
    correlationId: parseCorrelationId(headerValue),
    generated: false,
  };
}
