import { canonicalJson } from "./canonical-json.js";
import { parseResourceVersion, parseUuidV7, type ResourceVersion, type UuidV7 } from "./ids.js";

declare const cacheKeyBrand: unique symbol;
declare const cachePrefixBrand: unique symbol;

export type CacheKey = string & { readonly [cacheKeyBrand]: "CacheKey" };
export type CacheResourcePrefix = string & {
  readonly [cachePrefixBrand]: "CacheResourcePrefix";
};
export type CacheClassification = "public" | "internal" | "confidential" | "restricted";
export type CacheUsage = "performance" | "authorization";

export interface CacheScope {
  readonly deploymentEnvironment: string;
  readonly tenantId: UuidV7<string>;
  readonly environmentId: UuidV7<string>;
  readonly resourceType: string;
  readonly resourceId: UuidV7<string>;
  readonly resourceVersion: ResourceVersion;
  readonly policyVersion: ResourceVersion;
  readonly configurationVersion: ResourceVersion;
}

export interface CacheWriteOptions {
  readonly classification: CacheClassification;
  readonly ttlSeconds: number;
}

export interface CacheDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteByPrefix(prefix: string): Promise<number>;
}

export interface CacheHit<Value> {
  readonly status: "hit";
  readonly value: Value;
  readonly classification: CacheClassification;
  readonly authoritative: false;
  readonly requiresFreshAuthorization: true;
}

export interface CacheMiss {
  readonly status: "miss";
  readonly reason: "absent" | "invalid" | "unavailable";
  readonly authoritative: false;
  readonly requiresFreshAuthorization: true;
}

export type CacheRead<Value> = CacheHit<Value> | CacheMiss;
export type AuthorizationCacheFailureCode =
  "AUTHORIZATION_CACHE_MISS" | "AUTHORIZATION_CACHE_INVALID" | "AUTHORIZATION_CACHE_UNAVAILABLE";

export interface NamespacedCacheOptions {
  readonly maximumValueBytes?: number;
}

interface CacheEnvelope {
  readonly schema_version: 1;
  readonly key: CacheKey;
  readonly classification: CacheClassification;
  readonly value: unknown;
}

const DEPLOYMENT_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
const RESOURCE_TYPE_PATTERN = /^[a-z][a-z0-9:-]{0,63}$/;
const CLASSIFICATIONS = new Set<CacheClassification>([
  "public",
  "internal",
  "confidential",
  "restricted",
]);
const SENSITIVE_CACHE_KEY_PATTERN =
  /(^|_)(authorization|cookie|password|passphrase|secret|credential|private_key|api_key|apikey|token|client_secret|database_url|dsn)($|_)/;
const CREDENTIAL_VALUE_PATTERNS = [
  /\b(?:bearer|basic)\s+\S+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsecret-ref:\/\//i,
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i,
  /(?:[?&]|\b)(?:access_token|refresh_token|api_key|password|secret|token|credential)=\S+/i,
  /\b(?:ghp_|github_pat_|sk-)[A-Za-z0-9_-]{8,}/,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
] as const;

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function validatedScope(scope: CacheScope): CacheScope {
  if (!DEPLOYMENT_PATTERN.test(scope.deploymentEnvironment)) {
    throw new TypeError("Cache deployment environment must use stable lowercase notation");
  }
  if (!RESOURCE_TYPE_PATTERN.test(scope.resourceType)) {
    throw new TypeError("Cache resource type must use stable lowercase notation");
  }
  parseUuidV7(scope.tenantId);
  parseUuidV7(scope.environmentId);
  parseUuidV7(scope.resourceId);
  parseResourceVersion(scope.resourceVersion);
  parseResourceVersion(scope.policyVersion);
  parseResourceVersion(scope.configurationVersion);
  return scope;
}

export function buildCacheResourcePrefix(scope: CacheScope): CacheResourcePrefix {
  const valid = validatedScope(scope);
  const namespace = [
    "pf-cache:v1",
    `deployment=${encodeSegment(valid.deploymentEnvironment)}`,
    `tenant=${valid.tenantId}`,
    `environment=${valid.environmentId}`,
    `resource_type=${encodeSegment(valid.resourceType)}`,
    `resource_id=${valid.resourceId}`,
  ].join(":");
  return `${namespace}:` as CacheResourcePrefix;
}

export function buildCacheKey(scope: CacheScope): CacheKey {
  const valid = validatedScope(scope);
  const versionNamespace = [
    `resource_version=${valid.resourceVersion}`,
    `policy_version=${valid.policyVersion}`,
    `configuration_version=${valid.configurationVersion}`,
  ].join(":");
  return `${buildCacheResourcePrefix(valid)}${versionNamespace}` as CacheKey;
}

function normalizedKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function assertCacheSafe(value: unknown, ancestors = new Set<object>()): void {
  if (typeof value === "string") {
    if (CREDENTIAL_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new TypeError("Cache value contains credential material and cannot be stored");
    }
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (ancestors.has(value)) return;
  ancestors.add(value);
  try {
    for (const key of Object.keys(value)) {
      if (SENSITIVE_CACHE_KEY_PATTERN.test(normalizedKey(key))) {
        throw new TypeError("Cache value contains a credential-bearing field and cannot be stored");
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor !== undefined && !("get" in descriptor) && !("set" in descriptor)) {
        assertCacheSafe(descriptor.value, ancestors);
      }
    }
  } finally {
    ancestors.delete(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEnvelope(payload: string, expectedKey: CacheKey): CacheEnvelope {
  const parsed: unknown = JSON.parse(payload);
  if (!isRecord(parsed)) throw new TypeError("Cache envelope is not an object");
  const keys = Object.keys(parsed).sort();
  if (keys.join(",") !== "classification,key,schema_version,value") {
    throw new TypeError("Cache envelope fields are invalid");
  }
  if (
    parsed.schema_version !== 1 ||
    parsed.key !== expectedKey ||
    typeof parsed.classification !== "string" ||
    !CLASSIFICATIONS.has(parsed.classification as CacheClassification)
  ) {
    throw new TypeError("Cache envelope namespace or metadata is invalid");
  }
  assertCacheSafe(parsed.value);
  canonicalJson(parsed.value);
  return {
    schema_version: 1,
    key: expectedKey,
    classification: parsed.classification as CacheClassification,
    value: parsed.value,
  };
}

export class AuthorizationCacheFailure extends Error {
  readonly code: AuthorizationCacheFailureCode;

  constructor(code: AuthorizationCacheFailureCode) {
    super("Authorization cannot continue without fresh authoritative state.");
    this.name = "AuthorizationCacheFailure";
    this.code = code;
  }
}

function miss<Value>(reason: CacheMiss["reason"], usage: CacheUsage): CacheRead<Value> {
  if (usage === "authorization") {
    const code: AuthorizationCacheFailureCode =
      reason === "absent"
        ? "AUTHORIZATION_CACHE_MISS"
        : reason === "invalid"
          ? "AUTHORIZATION_CACHE_INVALID"
          : "AUTHORIZATION_CACHE_UNAVAILABLE";
    throw new AuthorizationCacheFailure(code);
  }
  return {
    status: "miss",
    reason,
    authoritative: false,
    requiresFreshAuthorization: true,
  };
}

export class NamespacedCache {
  readonly #driver: CacheDriver;
  readonly #maximumValueBytes: number;

  constructor(driver: CacheDriver, options: NamespacedCacheOptions = {}) {
    this.#driver = driver;
    this.#maximumValueBytes = options.maximumValueBytes ?? 262_144;
    if (
      !Number.isInteger(this.#maximumValueBytes) ||
      this.#maximumValueBytes < 64 ||
      this.#maximumValueBytes > 10_485_760
    ) {
      throw new TypeError("Cache maximum value bytes must be an integer from 64 through 10485760");
    }
  }

  async read<Value = unknown>(scope: CacheScope, usage: CacheUsage): Promise<CacheRead<Value>> {
    if (usage !== "performance" && usage !== "authorization") {
      throw new TypeError("Cache usage must be performance or authorization");
    }
    const key = buildCacheKey(scope);
    let payload: string | null;
    try {
      payload = await this.#driver.get(key);
    } catch {
      return miss("unavailable", usage);
    }
    if (payload === null) return miss("absent", usage);

    let envelope: CacheEnvelope;
    try {
      envelope = parseEnvelope(payload, key);
    } catch {
      return miss("invalid", usage);
    }
    return {
      status: "hit",
      value: envelope.value as Value,
      classification: envelope.classification,
      authoritative: false,
      requiresFreshAuthorization: true,
    };
  }

  async write(scope: CacheScope, value: unknown, options: CacheWriteOptions): Promise<boolean> {
    const key = buildCacheKey(scope);
    if (!CLASSIFICATIONS.has(options.classification)) {
      throw new TypeError("Cache classification is invalid");
    }
    if (
      !Number.isInteger(options.ttlSeconds) ||
      options.ttlSeconds < 1 ||
      options.ttlSeconds > 86_400
    ) {
      throw new TypeError("Cache TTL must be an integer from 1 through 86400 seconds");
    }
    assertCacheSafe(value);
    const payload = canonicalJson({
      schema_version: 1,
      key,
      classification: options.classification,
      value,
    });
    if (Buffer.byteLength(payload, "utf8") > this.#maximumValueBytes) {
      throw new RangeError("Cache value exceeds the configured maximum byte count");
    }

    try {
      await this.#driver.set(key, payload, options.ttlSeconds);
      return true;
    } catch {
      return false;
    }
  }

  async invalidate(scope: CacheScope): Promise<boolean> {
    try {
      return await this.#driver.delete(buildCacheKey(scope));
    } catch {
      return false;
    }
  }

  async invalidateResource(scope: CacheScope): Promise<number> {
    try {
      const deleted = await this.#driver.deleteByPrefix(buildCacheResourcePrefix(scope));
      return Number.isSafeInteger(deleted) && deleted >= 0 ? deleted : 0;
    } catch {
      return 0;
    }
  }
}
