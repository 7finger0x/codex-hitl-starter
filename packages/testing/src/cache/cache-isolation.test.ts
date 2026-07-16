import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AuthorizationCacheFailure,
  NamespacedCache,
  buildCacheKey,
  buildCacheResourcePrefix,
  type CacheDriver,
  type CacheScope,
} from "../../../core/src/cache.js";
import { parseResourceVersion, parseUuidV7 } from "../../../core/src/ids.js";

const TENANT_A = parseUuidV7<"TenantId">("01941f29-7c7b-7000-8000-000000000001");
const TENANT_B = parseUuidV7<"TenantId">("01941f29-7c7b-7000-8000-000000000002");
const ENVIRONMENT_A = parseUuidV7<"EnvironmentId">("01941f29-7c7b-7000-8000-000000000003");
const ENVIRONMENT_B = parseUuidV7<"EnvironmentId">("01941f29-7c7b-7000-8000-000000000004");
const RESOURCE = parseUuidV7<"ResourceId">("01941f29-7c7b-7000-8000-000000000005");

function scope(overrides: Partial<CacheScope> = {}): CacheScope {
  return {
    deploymentEnvironment: "development",
    tenantId: TENANT_A,
    environmentId: ENVIRONMENT_A,
    resourceType: "capability-manifest",
    resourceId: RESOURCE,
    resourceVersion: parseResourceVersion(1),
    policyVersion: parseResourceVersion(2),
    configurationVersion: parseResourceVersion(3),
    ...overrides,
  };
}

class MemoryDriver implements CacheDriver {
  readonly values = new Map<string, string>();
  readonly ttls = new Map<string, number>();
  available = true;

  async get(key: string): Promise<string | null> {
    this.assertAvailable();
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.assertAvailable();
    this.values.set(key, value);
    this.ttls.set(key, ttlSeconds);
  }

  async delete(key: string): Promise<boolean> {
    this.assertAvailable();
    this.ttls.delete(key);
    return this.values.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    this.assertAvailable();
    let deleted = 0;
    for (const key of [...this.values.keys()]) {
      if (!key.startsWith(prefix)) continue;
      this.values.delete(key);
      this.ttls.delete(key);
      deleted += 1;
    }
    return deleted;
  }

  private assertAvailable(): void {
    if (!this.available) throw new Error("valkey://user:password@private-host");
  }
}

test("cache keys cannot collide across tenant, environment, resource, or authority versions", () => {
  const variants = [
    scope(),
    scope({ tenantId: TENANT_B }),
    scope({ environmentId: ENVIRONMENT_B }),
    scope({ resourceId: TENANT_B }),
    scope({ resourceType: "capability:manifest" }),
    scope({ resourceVersion: parseResourceVersion(2) }),
    scope({ policyVersion: parseResourceVersion(3) }),
    scope({ configurationVersion: parseResourceVersion(4) }),
    scope({ deploymentEnvironment: "preview" }),
  ];
  const keys = variants.map(buildCacheKey);

  assert.equal(new Set(keys).size, variants.length);
  assert.ok(keys.every((key) => key.startsWith("pf-cache:v1:")));
  assert.notEqual(
    buildCacheResourcePrefix(scope()),
    buildCacheResourcePrefix(scope({ tenantId: TENANT_B })),
  );
  assert.throws(
    () => buildCacheKey(scope({ deploymentEnvironment: "Production" })),
    /deployment environment/i,
  );
  assert.throws(() => buildCacheKey(scope({ resourceType: "" })), /resource type/i);
});

test("cache values retain classification and bounded TTL without becoming authority", async () => {
  const driver = new MemoryDriver();
  const cache = new NamespacedCache(driver);
  const target = scope();

  assert.equal(
    await cache.write(
      target,
      { capabilities: ["tenant.read"] },
      {
        classification: "internal",
        ttlSeconds: 60,
      },
    ),
    true,
  );
  assert.equal(driver.ttls.get(buildCacheKey(target)), 60);
  assert.deepEqual(await cache.read(target, "performance"), {
    status: "hit",
    value: { capabilities: ["tenant.read"] },
    classification: "internal",
    authoritative: false,
    requiresFreshAuthorization: true,
  });
  assert.deepEqual(await cache.read(target, "authorization"), {
    status: "hit",
    value: { capabilities: ["tenant.read"] },
    classification: "internal",
    authoritative: false,
    requiresFreshAuthorization: true,
  });
});

test("namespace-envelope mismatch cannot cross tenant boundaries", async () => {
  const driver = new MemoryDriver();
  const cache = new NamespacedCache(driver);
  const tenantA = scope();
  const tenantB = scope({ tenantId: TENANT_B });
  await cache.write(tenantA, { tenant: "a" }, { classification: "internal", ttlSeconds: 60 });
  driver.values.set(buildCacheKey(tenantB), driver.values.get(buildCacheKey(tenantA))!);

  assert.deepEqual(await cache.read(tenantB, "performance"), {
    status: "miss",
    reason: "invalid",
    authoritative: false,
    requiresFreshAuthorization: true,
  });
  await assert.rejects(
    cache.read(tenantB, "authorization"),
    (error: unknown) =>
      error instanceof AuthorizationCacheFailure && error.code === "AUTHORIZATION_CACHE_INVALID",
  );
});

test("resource invalidation is constrained to one deployment, tenant, environment, and resource", async () => {
  const driver = new MemoryDriver();
  const cache = new NamespacedCache(driver);
  const oldVersion = scope();
  const newVersion = scope({ resourceVersion: parseResourceVersion(2) });
  const otherTenant = scope({ tenantId: TENANT_B });
  for (const target of [oldVersion, newVersion, otherTenant]) {
    await cache.write(
      target,
      { key: buildCacheKey(target) },
      {
        classification: "internal",
        ttlSeconds: 60,
      },
    );
  }

  assert.equal(await cache.invalidateResource(oldVersion), 2);
  assert.equal(driver.values.has(buildCacheKey(oldVersion)), false);
  assert.equal(driver.values.has(buildCacheKey(newVersion)), false);
  assert.equal(driver.values.has(buildCacheKey(otherTenant)), true);
});

test("cache outages fail open for performance and fail closed for authorization", async () => {
  const driver = new MemoryDriver();
  const cache = new NamespacedCache(driver);
  driver.available = false;

  assert.deepEqual(await cache.read(scope(), "performance"), {
    status: "miss",
    reason: "unavailable",
    authoritative: false,
    requiresFreshAuthorization: true,
  });
  assert.equal(
    await cache.write(scope(), { harmless: true }, { classification: "internal", ttlSeconds: 60 }),
    false,
  );
  assert.equal(await cache.invalidate(scope()), false);
  assert.equal(await cache.invalidateResource(scope()), 0);
  await assert.rejects(
    cache.read(scope(), "authorization"),
    (error: unknown) =>
      error instanceof AuthorizationCacheFailure &&
      error.code === "AUTHORIZATION_CACHE_UNAVAILABLE" &&
      !JSON.stringify(error).includes("private-host"),
  );
});

test("authorization cache misses fail closed", async () => {
  const cache = new NamespacedCache(new MemoryDriver());
  assert.deepEqual(await cache.read(scope(), "performance"), {
    status: "miss",
    reason: "absent",
    authoritative: false,
    requiresFreshAuthorization: true,
  });
  await assert.rejects(
    cache.read(scope(), "authorization"),
    (error: unknown) =>
      error instanceof AuthorizationCacheFailure && error.code === "AUTHORIZATION_CACHE_MISS",
  );
  await assert.rejects(cache.read(scope(), "unknown" as never), /cache usage/i);
});

test("secret-like keys, credential values, invalid TTLs, and oversized values are rejected", async () => {
  const cache = new NamespacedCache(new MemoryDriver(), { maximumValueBytes: 128 });
  for (const value of [
    { access_token: "hidden" },
    { nested: { password: "hidden" } },
    { harmless: "Bearer hidden" },
    { reference: "secret-ref://provider/key" },
  ]) {
    await assert.rejects(
      cache.write(scope(), value, { classification: "restricted", ttlSeconds: 60 }),
      /cache value.*credential/i,
    );
  }
  await assert.rejects(
    cache.write(scope(), { harmless: true }, { classification: "internal", ttlSeconds: 0 }),
    /TTL/i,
  );
  await assert.rejects(
    cache.write(
      scope(),
      { harmless: "x".repeat(256) },
      { classification: "internal", ttlSeconds: 60 },
    ),
    /maximum/i,
  );
});
