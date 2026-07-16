import { randomBytes as nodeRandomBytes } from "node:crypto";

import { nowUtc, type UtcInstant } from "../../core/src/time.js";
import { redactRecord, type RedactedValue } from "./redaction.js";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type SpanStatus = "ok" | "error";
export type TraceId = string & { readonly __traceId: unique symbol };
export type SpanId = string & { readonly __spanId: unique symbol };

export interface TraceContext {
  readonly traceId: TraceId;
  readonly spanId: SpanId;
  readonly traceFlags: string;
}

export interface TechnicalLogger {
  log(level: LogLevel, event: string, fields?: Readonly<Record<string, unknown>>): boolean;
}

export interface TechnicalLoggerOptions {
  readonly service: string;
  readonly version: string;
  readonly deploymentEnvironment: string;
  readonly clock?: () => number;
  readonly sink: (line: string) => void;
}

export interface MetricPoint {
  readonly signal: "metric";
  readonly timestamp: UtcInstant;
  readonly name: string;
  readonly value: number;
  readonly attributes: Readonly<Record<string, RedactedValue>>;
}

export interface MetricRecorder {
  record(name: string, value: number, attributes?: Readonly<Record<string, unknown>>): boolean;
}

export interface MetricRecorderOptions {
  readonly clock?: () => number;
  readonly sink: (point: MetricPoint) => void;
}

export interface SpanRecord {
  readonly signal: "span";
  readonly name: string;
  readonly trace_id: TraceId;
  readonly span_id: SpanId;
  readonly parent_span_id?: SpanId;
  readonly trace_flags: string;
  readonly started_at: UtcInstant;
  readonly ended_at: UtcInstant;
  readonly duration_ms: number;
  readonly status: SpanStatus;
  readonly attributes: Readonly<Record<string, RedactedValue>>;
  readonly end_attributes?: Readonly<Record<string, RedactedValue>>;
}

export interface SpanHandle {
  readonly context: TraceContext;
  readonly traceParent: string;
  end(status: SpanStatus, attributes?: Readonly<Record<string, unknown>>): boolean;
}

export interface StartSpanOptions {
  readonly parent?: TraceContext;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface TraceRecorder {
  start(name: string, options?: StartSpanOptions): SpanHandle;
}

export interface TraceRecorderOptions {
  readonly clock?: () => number;
  readonly randomBytes?: (length: number) => Uint8Array;
  readonly sink: (span: SpanRecord) => void;
}

const SIGNAL_NAME_PATTERN = /^[a-z][a-z0-9_.]{1,127}$/;
const TRACE_PARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-(0[01])$/;
const LOG_LEVELS = new Set<LogLevel>(["debug", "info", "warn", "error"]);
const SPAN_STATUSES = new Set<SpanStatus>(["ok", "error"]);
const RESERVED_LOG_FIELDS = new Set([
  "timestamp",
  "signal",
  "level",
  "event",
  "service",
  "service_version",
  "deployment_environment",
]);
const AUDIT_PAYLOAD_FIELDS = new Set([
  "audit",
  "audit_event",
  "audit_record",
  "audit_payload",
  "decision_evidence",
]);

function checkedName(value: string, label: string): string {
  if (typeof value !== "string" || !SIGNAL_NAME_PATTERN.test(value)) {
    throw new TypeError(`${label} name must be lowercase dotted notation`);
  }
  return value;
}

function checkedLabel(value: string, label: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128) {
    throw new TypeError(`${label} must contain between 1 and 128 characters`);
  }
  return value;
}

function assertNoAuditPayload(value: unknown, ancestors: Set<object>, depth: number): void {
  if (typeof value !== "object" || value === null || value instanceof Error) return;
  if (depth > 20) {
    throw new TypeError("Technical log fields are too deep to establish audit separation");
  }
  if (ancestors.has(value)) return;
  ancestors.add(value);
  try {
    for (const key of Object.keys(value)) {
      if (AUDIT_PAYLOAD_FIELDS.has(key)) {
        throw new TypeError("Audit payloads must use the append-only audit boundary");
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor !== undefined && !("get" in descriptor) && !("set" in descriptor)) {
        assertNoAuditPayload(descriptor.value, ancestors, depth + 1);
      }
    }
  } finally {
    ancestors.delete(value);
  }
}

function checkedLogFields(fields: Readonly<Record<string, unknown>>): void {
  for (const key of Object.keys(fields)) {
    if (RESERVED_LOG_FIELDS.has(key)) {
      throw new TypeError(`Technical log field ${key} is reserved`);
    }
  }
  assertNoAuditPayload(fields, new Set(), 0);
}

export function createTechnicalLogger(options: TechnicalLoggerOptions): TechnicalLogger {
  const service = checkedLabel(options.service, "Service");
  const version = checkedLabel(options.version, "Service version");
  const deploymentEnvironment = checkedLabel(
    options.deploymentEnvironment,
    "Deployment environment",
  );
  const clock = options.clock ?? Date.now;

  return {
    log(level, event, fields = {}) {
      if (!LOG_LEVELS.has(level)) throw new TypeError("Technical log level is invalid");
      checkedName(event, "Technical log event");
      checkedLogFields(fields);
      const record = {
        timestamp: nowUtc(clock),
        signal: "technical_log",
        level,
        event,
        service,
        service_version: version,
        deployment_environment: deploymentEnvironment,
        ...redactRecord(fields),
      };
      try {
        options.sink(JSON.stringify(record));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createMetricRecorder(options: MetricRecorderOptions): MetricRecorder {
  const clock = options.clock ?? Date.now;
  return {
    record(name, value, attributes = {}) {
      checkedName(name, "Metric");
      if (!Number.isFinite(value)) {
        throw new TypeError("Metric value must be finite");
      }
      const point: MetricPoint = {
        signal: "metric",
        timestamp: nowUtc(clock),
        name,
        value,
        attributes: redactRecord(attributes),
      };
      try {
        options.sink(point);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function parseTraceId(value: string): TraceId {
  if (/^0{32}$/.test(value)) throw new TypeError("W3C traceparent trace ID must not be zero");
  return value as TraceId;
}

function parseSpanId(value: string): SpanId {
  if (/^0{16}$/.test(value)) throw new TypeError("W3C traceparent span ID must not be zero");
  return value as SpanId;
}

export function parseTraceParent(value: unknown): TraceContext {
  if (typeof value !== "string") {
    throw new TypeError("Expected a supported W3C traceparent string");
  }
  const match = TRACE_PARENT_PATTERN.exec(value);
  if (match === null) throw new TypeError("Expected a supported W3C traceparent string");
  return {
    traceId: parseTraceId(match[1]!),
    spanId: parseSpanId(match[2]!),
    traceFlags: match[3]!,
  };
}

export function formatTraceParent(context: TraceContext): string {
  const value = `00-${context.traceId}-${context.spanId}-${context.traceFlags}`;
  parseTraceParent(value);
  return value;
}

function randomIdentifier(length: number, source: (length: number) => Uint8Array): string {
  const supplied = source(length);
  if (!(supplied instanceof Uint8Array) || supplied.length !== length) {
    throw new TypeError("Trace random source must return exactly the requested byte count");
  }
  const bytes = Uint8Array.from(supplied);
  if (bytes.every((byte) => byte === 0)) bytes[bytes.length - 1] = 1;
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createTraceRecorder(options: TraceRecorderOptions): TraceRecorder {
  const clock = options.clock ?? Date.now;
  const entropy = options.randomBytes ?? ((length) => nodeRandomBytes(length));

  return {
    start(name, startOptions = {}) {
      checkedName(name, "Span");
      const parent =
        startOptions.parent === undefined
          ? undefined
          : parseTraceParent(formatTraceParent(startOptions.parent));
      const traceId = parent?.traceId ?? parseTraceId(randomIdentifier(16, entropy));
      const spanId = parseSpanId(randomIdentifier(8, entropy));
      const traceFlags = parent?.traceFlags ?? "01";
      const context: TraceContext = { traceId, spanId, traceFlags };
      const startedEpoch = clock();
      const startedAt = nowUtc(() => startedEpoch);
      const attributes = redactRecord(startOptions.attributes ?? {});
      let ended = false;

      return {
        context,
        traceParent: formatTraceParent(context),
        end(status, endAttributes) {
          if (ended) return false;
          if (!SPAN_STATUSES.has(status)) throw new TypeError("Span status is invalid");
          ended = true;
          const endedEpoch = clock();
          const record: SpanRecord = {
            signal: "span",
            name,
            trace_id: traceId,
            span_id: spanId,
            ...(parent === undefined ? {} : { parent_span_id: parent.spanId }),
            trace_flags: traceFlags,
            started_at: startedAt,
            ended_at: nowUtc(() => endedEpoch),
            duration_ms: Math.max(0, endedEpoch - startedEpoch),
            status,
            attributes,
            ...(endAttributes === undefined ? {} : { end_attributes: redactRecord(endAttributes) }),
          };
          try {
            options.sink(record);
            return true;
          } catch {
            return false;
          }
        },
      };
    },
  };
}
