export const REDACTED = "[REDACTED]" as const;
export const CIRCULAR = "[CIRCULAR]" as const;
export const TRUNCATED = "[TRUNCATED]" as const;

export type RedactedValue =
  | boolean
  | null
  | number
  | string
  | readonly RedactedValue[]
  | { readonly [key: string]: RedactedValue };

export interface RedactionOptions {
  readonly maximumDepth?: number;
  readonly maximumEntries?: number;
}

const DEFAULT_MAXIMUM_DEPTH = 12;
const DEFAULT_MAXIMUM_ENTRIES = 100;
const SENSITIVE_KEY_PATTERN =
  /(^|_)(authorization|proxy_authorization|cookie|set_cookie|password|passphrase|secret|credential|private_key|api_key|apikey|token|client_secret|database_url|dsn)($|_)/;
const CREDENTIAL_VALUE_PATTERNS = [
  /\b(?:bearer|basic)\s+\S+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsecret-ref:\/\//i,
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i,
  /(?:[?&]|\b)(?:access_token|refresh_token|api_key|password|secret)=\S+/i,
  /\b(?:ghp_|github_pat_|sk-)[A-Za-z0-9_-]{8,}/,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
] as const;

function normalizedKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(normalizedKey(key));
}

function redactString(value: string): string {
  return CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(value)) ? REDACTED : value;
}

interface RedactionState {
  readonly ancestors: Set<object>;
  readonly maximumDepth: number;
  readonly maximumEntries: number;
}

function walk(value: unknown, state: RedactionState, depth: number): RedactedValue {
  if (depth > state.maximumDepth) return TRUNCATED;
  if (value === null) return null;

  switch (typeof value) {
    case "string":
      return redactString(value);
    case "boolean":
      return value;
    case "number":
      return Number.isFinite(value) ? value : REDACTED;
    case "undefined":
    case "bigint":
    case "symbol":
    case "function":
      return REDACTED;
    case "object":
      break;
  }

  if (value instanceof Error) return REDACTED;
  if (state.ancestors.has(value)) return CIRCULAR;

  const prototype = Object.getPrototypeOf(value) as object | null;
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return REDACTED;
  }

  state.ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const output: RedactedValue[] = [];
      const limit = Math.min(value.length, state.maximumEntries);
      for (let index = 0; index < limit; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        output.push(
          descriptor === undefined || "get" in descriptor || "set" in descriptor
            ? REDACTED
            : walk(descriptor.value, state, depth + 1),
        );
      }
      if (value.length > state.maximumEntries) output.push(TRUNCATED);
      return output;
    }

    const output: Record<string, RedactedValue> = {};
    const keys = Object.keys(value).sort();
    for (const key of keys.slice(0, state.maximumEntries)) {
      if (isSensitiveKey(key)) {
        output[key] = REDACTED;
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || "get" in descriptor || "set" in descriptor) {
        output[key] = REDACTED;
        continue;
      }
      output[key] = walk(descriptor.value, state, depth + 1);
    }
    if (keys.length > state.maximumEntries) output.redaction_truncated = true;
    return output;
  } catch {
    return REDACTED;
  } finally {
    state.ancestors.delete(value);
  }
}

export function redactValue(value: unknown, options: RedactionOptions = {}): RedactedValue {
  const maximumDepth = options.maximumDepth ?? DEFAULT_MAXIMUM_DEPTH;
  const maximumEntries = options.maximumEntries ?? DEFAULT_MAXIMUM_ENTRIES;
  if (!Number.isInteger(maximumDepth) || maximumDepth < 1 || maximumDepth > 100) {
    throw new TypeError("Redaction maximum depth must be an integer from 1 through 100");
  }
  if (!Number.isInteger(maximumEntries) || maximumEntries < 1 || maximumEntries > 10_000) {
    throw new TypeError("Redaction maximum entries must be an integer from 1 through 10000");
  }

  try {
    return walk(value, { ancestors: new Set(), maximumDepth, maximumEntries }, 0);
  } catch {
    return REDACTED;
  }
}

export function redactRecord(
  value: Readonly<Record<string, unknown>>,
  options?: RedactionOptions,
): Readonly<Record<string, RedactedValue>> {
  const redacted = redactValue(value, options);
  if (typeof redacted !== "object" || redacted === null || Array.isArray(redacted)) {
    return { value: REDACTED };
  }
  return redacted as Readonly<Record<string, RedactedValue>>;
}
