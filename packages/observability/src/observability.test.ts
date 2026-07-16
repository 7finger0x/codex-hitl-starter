import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createMetricRecorder,
  createTechnicalLogger,
  createTraceRecorder,
  parseTraceParent,
} from "./index.js";
import { REDACTED, redactRecord, redactValue } from "./redaction.js";
import { HealthRegistry } from "./health.js";

const FIXED_EPOCH = 1_735_689_600_123;

test("redaction removes credential fields and credential-shaped values recursively", () => {
  const input = {
    safe: "visible",
    authorization: "Bearer top-secret",
    nested: {
      clientSecret: "secret-value",
      note: "Bearer embedded-token",
      count: 3,
    },
    values: ["visible", "secret-ref://provider/key", { api_key: "key" }],
  };

  assert.deepEqual(redactRecord(input), {
    authorization: REDACTED,
    nested: {
      clientSecret: REDACTED,
      count: 3,
      note: REDACTED,
    },
    safe: "visible",
    values: ["visible", REDACTED, { api_key: REDACTED }],
  });
  assert.equal(input.authorization, "Bearer top-secret");
});

test("redaction never invokes accessors or serializes exceptions and cycles", () => {
  let getterInvocations = 0;
  const withGetter = Object.defineProperty({}, "password", {
    enumerable: true,
    get: () => {
      getterInvocations += 1;
      return "should-not-run";
    },
  });
  const circular: Record<string, unknown> = { safe: true };
  circular.self = circular;

  assert.deepEqual(redactValue(withGetter), { password: REDACTED });
  const arrayWithGetter: unknown[] = [];
  Object.defineProperty(arrayWithGetter, "0", {
    enumerable: true,
    get: () => {
      getterInvocations += 1;
      return "should-not-run";
    },
  });
  arrayWithGetter.length = 1;
  assert.deepEqual(redactValue(arrayWithGetter), [REDACTED]);
  assert.equal(getterInvocations, 0);
  assert.deepEqual(redactValue(circular), { safe: true, self: "[CIRCULAR]" });
  assert.equal(redactValue(new Error("token=secret")), REDACTED);
});

test("technical logger emits required structured fields and keeps audit payloads separate", () => {
  const lines: string[] = [];
  const logger = createTechnicalLogger({
    service: "foundation-api",
    version: "1.2.3",
    deploymentEnvironment: "development",
    clock: () => FIXED_EPOCH,
    sink: (line) => lines.push(line),
  });

  assert.equal(
    logger.log("error", "request.failed", {
      correlation_id: "01941f29-7c7b-7000-8000-000000000000",
      trace_id: "0123456789abcdef0123456789abcdef",
      error_code: "UPSTREAM_UNAVAILABLE",
      password: "not-for-logs",
    }),
    true,
  );
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]!), {
    timestamp: "2025-01-01T00:00:00.123Z",
    signal: "technical_log",
    level: "error",
    event: "request.failed",
    service: "foundation-api",
    service_version: "1.2.3",
    deployment_environment: "development",
    correlation_id: "01941f29-7c7b-7000-8000-000000000000",
    trace_id: "0123456789abcdef0123456789abcdef",
    error_code: "UPSTREAM_UNAVAILABLE",
    password: REDACTED,
  });

  assert.throws(
    () => logger.log("info", "mutation.completed", { audit_event: { actor: "user" } }),
    /audit/i,
  );
  assert.throws(
    () =>
      logger.log("info", "mutation.completed", {
        nested: { audit_record: { actor: "user" } },
      }),
    /audit/i,
  );
  assert.throws(
    () => logger.log("info", "request.completed", { timestamp: "spoofed" }),
    /reserved/i,
  );
});

test("telemetry sinks fail open after input validation", () => {
  const logger = createTechnicalLogger({
    service: "foundation-api",
    version: "1.2.3",
    deploymentEnvironment: "development",
    sink: () => {
      throw new Error("collector offline");
    },
  });
  assert.equal(logger.log("warn", "collector.unavailable"), false);
  assert.throws(() => logger.log("fatal" as never, "request.failed"), /level/i);
  assert.throws(() => logger.log("debug", "INVALID EVENT"), /event name/i);
});

test("metric helper validates measurements and redacts attributes", () => {
  const points: unknown[] = [];
  const metrics = createMetricRecorder({
    clock: () => FIXED_EPOCH,
    sink: (point) => points.push(point),
  });

  assert.equal(
    metrics.record("http.server.duration_ms", 12.5, {
      route: "/v1/tenants",
      authorization: "Bearer hidden",
    }),
    true,
  );
  assert.deepEqual(points, [
    {
      signal: "metric",
      timestamp: "2025-01-01T00:00:00.123Z",
      name: "http.server.duration_ms",
      value: 12.5,
      attributes: { authorization: REDACTED, route: "/v1/tenants" },
    },
  ]);
  assert.throws(() => metrics.record("Bad Metric", 1), /metric name/i);
  assert.throws(() => metrics.record("http.requests", Number.NaN), /finite/i);
});

test("trace helper propagates W3C context and exports redacted completed spans", () => {
  const spans: unknown[] = [];
  let nextByte = 1;
  const traces = createTraceRecorder({
    clock: () => FIXED_EPOCH,
    randomBytes: (length) =>
      Uint8Array.from({ length }, () => {
        const value = nextByte;
        nextByte += 1;
        return value;
      }),
    sink: (span) => spans.push(span),
  });

  const parent = parseTraceParent("00-0123456789abcdef0123456789abcdef-0123456789abcdef-01");
  const span = traces.start("database.query", {
    parent,
    attributes: { db_system: "postgresql", database_url: "postgres://u:p@db/app" },
  });
  assert.equal(span.context.traceId, parent.traceId);
  assert.equal(parseTraceParent(span.traceParent).spanId, span.context.spanId);
  assert.equal(span.end("error", { error_code: "DATABASE_UNAVAILABLE" }), true);
  assert.equal(span.end("ok"), false);
  assert.deepEqual(spans, [
    {
      signal: "span",
      name: "database.query",
      trace_id: parent.traceId,
      span_id: span.context.spanId,
      parent_span_id: parent.spanId,
      trace_flags: "01",
      started_at: "2025-01-01T00:00:00.123Z",
      ended_at: "2025-01-01T00:00:00.123Z",
      duration_ms: 0,
      status: "error",
      attributes: { database_url: REDACTED, db_system: "postgresql" },
      end_attributes: { error_code: "DATABASE_UNAVAILABLE" },
    },
  ]);

  for (const invalid of [
    "00-00000000000000000000000000000000-0123456789abcdef-01",
    "00-0123456789abcdef0123456789abcdef-0000000000000000-01",
    "00-0123456789ABCDEF0123456789ABCDEF-0123456789abcdef-01",
    "00-0123456789abcdef0123456789abcdef-0123456789abcdef-02",
    "not-a-trace-parent",
  ]) {
    assert.throws(() => parseTraceParent(invalid), /traceparent/i);
  }
});

test("health distinguishes liveness, required readiness, and optional degradation", async () => {
  const health = new HealthRegistry({ clock: () => FIXED_EPOCH, timeoutMs: 25 });
  health.register("database", {
    required: true,
    check: () => ({ status: "healthy", code: "DATABASE_OK" }),
  });
  health.register("telemetry", {
    required: false,
    check: () => ({ status: "unhealthy", code: "TELEMETRY_UNAVAILABLE" }),
  });

  assert.deepEqual(health.liveness(), {
    status: "healthy",
    live: true,
    checked_at: "2025-01-01T00:00:00.123Z",
  });
  assert.deepEqual(await health.readiness(), {
    status: "degraded",
    ready: true,
    checked_at: "2025-01-01T00:00:00.123Z",
    dependencies: [
      { name: "database", required: true, status: "healthy", code: "DATABASE_OK" },
      {
        name: "telemetry",
        required: false,
        status: "unhealthy",
        code: "TELEMETRY_UNAVAILABLE",
      },
    ],
  });
});

test("health fails readiness closed and sanitizes thrown or timed-out checks", async () => {
  const thrown = new HealthRegistry({ clock: () => FIXED_EPOCH, timeoutMs: 25 });
  thrown.register("database", {
    required: true,
    check: () => {
      throw new Error("postgres://user:password@private-host/database");
    },
  });
  const failed = await thrown.readiness();
  assert.equal(failed.ready, false);
  assert.equal(failed.status, "unhealthy");
  assert.deepEqual(failed.dependencies, [
    {
      name: "database",
      required: true,
      status: "unhealthy",
      code: "DEPENDENCY_CHECK_FAILED",
    },
  ]);
  assert.doesNotMatch(JSON.stringify(failed), /password|private-host/);

  const timedOut = new HealthRegistry({ timeoutMs: 5 });
  timedOut.register("database", {
    required: true,
    check: () => new Promise(() => undefined),
  });
  assert.deepEqual((await timedOut.readiness()).dependencies[0], {
    name: "database",
    required: true,
    status: "unhealthy",
    code: "DEPENDENCY_CHECK_TIMEOUT",
  });
});
