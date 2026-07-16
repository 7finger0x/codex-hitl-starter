import assert from "node:assert/strict";
import { test } from "node:test";

import { canonicalJson, canonicalSha256 } from "./canonical-json.js";
import { CORRELATION_ID_HEADER, parseCorrelationId, resolveCorrelationId } from "./correlation.js";
import { StableError, asStableError, errorCode, stableErrorResponse } from "./errors.js";
import {
  createUuidV7Generator,
  isUuidV7,
  nextResourceVersion,
  parseResourceVersion,
  parseUuidV7,
  uuidV7Timestamp,
} from "./ids.js";
import { formatUtcInstant, nowUtc, parseUtcInstant, utcEpochMilliseconds } from "./time.js";

const ZERO_ENTROPY = (length: number): Uint8Array => new Uint8Array(length);

test("UUIDv7 IDs remain opaque, valid, unique, ordered, and timestamped", () => {
  let now = 1_735_689_600_123;
  const generate = createUuidV7Generator({
    clock: () => now,
    randomBytes: ZERO_ENTROPY,
  });

  const ids = Array.from({ length: 5_000 }, () => generate());
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), ids);

  for (const id of ids) {
    assert.equal(isUuidV7(id), true);
    assert.equal(parseUuidV7(id), id);
    assert.equal(id[14], "7");
    assert.match(id[19] ?? "", /[89ab]/);
    assert.equal(uuidV7Timestamp(id), now);
    assert.doesNotMatch(id, /^[a-z]+_/);
  }

  now -= 10_000;
  const afterClockRollback = generate();
  assert.ok(afterClockRollback > ids.at(-1)!);
  assert.equal(uuidV7Timestamp(afterClockRollback), 1_735_689_600_123);
});

test("UUIDv7 validation rejects other UUID versions and malformed values", () => {
  const invalid = [
    "550e8400-e29b-41d4-a716-446655440000",
    "018cc251-f400-7000-0016-000000000000",
    "018cc251-f400-7000-c016-000000000000",
    "018cc251-f400-7000-8016-00000000000g",
    "not-a-uuid",
  ];

  for (const value of invalid) {
    assert.equal(isUuidV7(value), false);
    assert.throws(() => parseUuidV7(value), /UUIDv7/);
  }
});

test("resource versions are positive safe integers and advance without wrapping", () => {
  for (let value = 1; value <= 10_000; value += 137) {
    const version = parseResourceVersion(value);
    assert.equal(nextResourceVersion(version), value + 1);
  }

  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => parseResourceVersion(invalid), /resource version/i);
  }

  const maximum = parseResourceVersion(Number.MAX_SAFE_INTEGER);
  assert.throws(() => nextResourceVersion(maximum), /maximum/i);
});

test("canonical JSON sorts object keys recursively and preserves array order", () => {
  const left = {
    z: [{ beta: 2, alpha: 1 }, true, null],
    a: "value",
    nested: { y: 2, x: 1 },
  };
  const right = {
    nested: { x: 1, y: 2 },
    a: "value",
    z: [{ alpha: 1, beta: 2 }, true, null],
  };

  const expected = '{"a":"value","nested":{"x":1,"y":2},"z":[{"alpha":1,"beta":2},true,null]}';
  assert.equal(canonicalJson(left), expected);
  assert.equal(canonicalJson(right), expected);
  assert.equal(canonicalSha256(left), canonicalSha256(right));
  assert.equal(
    canonicalSha256({ hello: "world" }),
    "93a23971a914e5eacbf0a8d25154cda309c3c1c72fbb9914d47c60f3cb681588",
  );
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
});

test("canonical JSON fails closed for ambiguous or executable values", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  const sparse: unknown[] = [];
  sparse[1] = "value";
  const withToJson = {
    value: 1,
    toJSON: () => ({ value: 2 }),
  };

  for (const invalid of [
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1n,
    Symbol("value"),
    () => "value",
    { value: undefined },
    sparse,
    circular,
    withToJson,
    new Date(),
  ]) {
    assert.throws(() => canonicalJson(invalid), /canonical JSON/i);
  }
});

test("UTC instants are strict, millisecond-precise, and round-trip", () => {
  for (let epoch = 0; epoch <= 4_102_444_800_000; epoch += 10_973_521_337) {
    const instant = formatUtcInstant(new Date(epoch));
    assert.equal(utcEpochMilliseconds(instant), epoch);
    assert.equal(parseUtcInstant(instant), instant);
    assert.match(instant, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }

  assert.equal(
    nowUtc(() => 1_735_689_600_123),
    "2025-01-01T00:00:00.123Z",
  );

  for (const invalid of [
    "2025-01-01T00:00:00Z",
    "2025-01-01T00:00:00.123+00:00",
    "2025-02-29T00:00:00.000Z",
    "2025-13-01T00:00:00.000Z",
    "not-a-time",
  ]) {
    assert.throws(() => parseUtcInstant(invalid), /UTC instant/);
  }
});

test("correlation boundaries retain one valid UUIDv7 or mint a new one", () => {
  const generate = createUuidV7Generator({
    clock: () => 1_735_689_600_123,
    randomBytes: ZERO_ENTROPY,
  });
  const existing = generate();

  assert.equal(CORRELATION_ID_HEADER, "x-correlation-id");
  assert.equal(parseCorrelationId(existing), existing);
  const generated = resolveCorrelationId(undefined, generate);
  assert.equal(isUuidV7(generated.correlationId), true);
  assert.equal(generated.generated, true);
  assert.notEqual(generated.correlationId, existing);
  assert.deepEqual(resolveCorrelationId(existing, generate), {
    correlationId: existing,
    generated: false,
  });

  for (const invalid of ["", " ", `${existing},${existing}`, [existing], 42]) {
    assert.throws(() => resolveCorrelationId(invalid, generate), /correlation/i);
  }
});

test("stable errors emit only canonical, allowlisted response fields", () => {
  const generateUuid = createUuidV7Generator({
    clock: () => 1_735_689_600_123,
    randomBytes: ZERO_ENTROPY,
  });
  const correlationId = parseCorrelationId(generateUuid());
  const platformError = new StableError({
    code: errorCode("RESOURCE_VERSION_MISMATCH"),
    message: "The resource has changed.",
    httpStatus: 412,
    retryable: false,
    retryGuidance: "Refresh the resource and retry with its current version.",
    details: {
      field: "If-Match",
      reasonCode: errorCode("STALE_RESOURCE_VERSION"),
    },
  });

  assert.deepEqual(stableErrorResponse(platformError, correlationId), {
    error: {
      code: "RESOURCE_VERSION_MISMATCH",
      message: "The resource has changed.",
      correlation_id: correlationId,
      retryable: false,
      retry_guidance: "Refresh the resource and retry with its current version.",
      details: {
        field: "If-Match",
        reason_code: "STALE_RESOURCE_VERSION",
      },
    },
  });
  assert.equal("stack" in stableErrorResponse(platformError, correlationId), false);
  assert.equal(asStableError(new Error("provider leaked a credential")).code, "INTERNAL_ERROR");
  assert.doesNotMatch(
    asStableError(new Error("provider leaked a credential")).message,
    /credential/,
  );
});

test("stable error inputs reject unstable codes and unsafe response metadata", () => {
  for (const invalid of ["lower_case", "A", "HAS-DASH", "_PREFIXED"]) {
    assert.throws(() => errorCode(invalid), /error code/i);
  }

  assert.throws(
    () =>
      new StableError({
        code: errorCode("BAD_REQUEST"),
        message: "Bad request.",
        httpStatus: 200,
        retryable: false,
        retryGuidance: "Correct the request.",
      }),
    /HTTP status/i,
  );
  assert.throws(
    () =>
      new StableError({
        code: errorCode("RATE_LIMITED"),
        message: "Retry later.",
        httpStatus: 429,
        retryable: true,
        retryGuidance: "Retry after the stated interval.",
        details: { retryAfterSeconds: 0 },
      }),
    /retry-after/i,
  );
});
