import assert from "node:assert/strict";
import { test } from "node:test";

import type { FastifyInstance } from "fastify";

import { HealthRegistry } from "../../../packages/observability/src/health.js";
import { buildApp, type AuthenticatedPrincipal } from "./app.js";

const CORRELATION_ID = "01941f29-7c7b-7000-8000-000000000000";

async function withApp(
  options: Parameters<typeof buildApp>[0],
  assertion: (app: FastifyInstance) => Promise<void>,
): Promise<void> {
  const app = buildApp(options);
  try {
    await app.ready();
    await assertion(app);
  } finally {
    await app.close();
  }
}

test("liveness uses the approved Health contract and correlation header", async () => {
  await withApp({ clock: () => 1_735_689_600_123 }, async (app) => {
    const response = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": CORRELATION_ID },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["x-correlation-id"], CORRELATION_ID);
    assert.deepEqual(response.json(), {
      status: "ok",
      service: "foundation-api",
      version: "0.0.0",
      time: "2025-01-01T00:00:00.123Z",
      checks: { process: "ok" },
    });
  });
});

test("missing correlation is generated and malformed correlation fails closed", async () => {
  await withApp({}, async (app) => {
    const generated = await app.inject({ method: "GET", url: "/health/live" });
    assert.equal(generated.statusCode, 200);
    assert.match(
      generated.headers["x-correlation-id"] as string,
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    const malformed = await app.inject({
      method: "GET",
      url: "/health/live",
      headers: { "x-correlation-id": "not-a-correlation-id" },
    });
    assert.equal(malformed.statusCode, 400);
    assert.equal(malformed.json().error.code, "INVALID_CORRELATION_ID");
    assert.notEqual(malformed.json().error.correlation_id, "not-a-correlation-id");
    assert.equal("stack" in malformed.json().error, false);
  });
});

test("readiness distinguishes optional degradation and required failure", async () => {
  const degraded = new HealthRegistry({ clock: () => 1_735_689_600_123 });
  degraded.register("database", {
    required: true,
    check: () => ({ status: "healthy", code: "DATABASE_OK" }),
  });
  degraded.register("telemetry", {
    required: false,
    check: () => ({ status: "unhealthy", code: "TELEMETRY_UNAVAILABLE" }),
  });
  await withApp({ health: degraded }, async (app) => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().checks, { database: "ok", telemetry: "unavailable" });
    assert.equal(response.json().status, "degraded");
  });

  const unavailable = new HealthRegistry({ clock: () => 1_735_689_600_123 });
  unavailable.register("database", {
    required: true,
    check: () => ({ status: "unhealthy", code: "DATABASE_UNAVAILABLE" }),
  });
  await withApp({ health: unavailable }, async (app) => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "SERVICE_UNAVAILABLE");
    assert.equal(response.json().error.retryable, true);
    assert.match(response.json().error.correlation_id, /^[0-9a-f-]{36}$/);
  });
});

test("protected probes require verified bearer authentication", async () => {
  const principal: AuthenticatedPrincipal = {
    kind: "user",
    principalId: "01941f29-7c7b-7000-8000-000000000001",
    authenticationStrength: "multi_factor",
  };
  await withApp(
    {
      authenticateToken: async (token) => (token === "verified-token" ? principal : null),
      configure: (app) => {
        app.get("/_test/protected", async (request) => ({ principal: request.principal }));
      },
    },
    async (app) => {
      for (const authorization of [undefined, "Basic abc", "Bearer rejected-token"]) {
        const response = await app.inject({
          method: "GET",
          url: "/_test/protected",
          ...(authorization === undefined ? {} : { headers: { authorization } }),
        });
        assert.equal(response.statusCode, 401);
        assert.equal(response.json().error.code, "AUTHENTICATION_REQUIRED");
      }

      const accepted = await app.inject({
        method: "GET",
        url: "/_test/protected",
        headers: { authorization: "Bearer verified-token" },
      });
      assert.equal(accepted.statusCode, 200);
      assert.deepEqual(accepted.json(), { principal });
    },
  );
});

test("mutation hooks require idempotency and canonical weak If-Match versions", async () => {
  const principal: AuthenticatedPrincipal = {
    kind: "service",
    principalId: "01941f29-7c7b-7000-8000-000000000002",
    authenticationStrength: "service_credential",
  };
  await withApp(
    {
      authenticateToken: async () => principal,
      configure: (app) => {
        app.post(
          "/_test/mutation",
          { config: { idempotent: true, requiresIfMatch: true } },
          async (request) => ({
            key: request.idempotencyKey,
            expectedVersion: request.expectedVersion,
            version: 3,
          }),
        );
      },
    },
    async (app) => {
      const missing = await app.inject({
        method: "POST",
        url: "/_test/mutation",
        headers: { authorization: "Bearer verified-token" },
      });
      assert.equal(missing.statusCode, 400);
      assert.equal(missing.json().error.code, "IDEMPOTENCY_KEY_REQUIRED");

      const malformedVersion = await app.inject({
        method: "POST",
        url: "/_test/mutation",
        headers: {
          authorization: "Bearer verified-token",
          "idempotency-key": "0123456789abcdef",
          "if-match": "3",
        },
      });
      assert.equal(malformedVersion.statusCode, 400);
      assert.equal(malformedVersion.json().error.code, "INVALID_IF_MATCH");

      const accepted = await app.inject({
        method: "POST",
        url: "/_test/mutation",
        headers: {
          authorization: "Bearer verified-token",
          "idempotency-key": "0123456789abcdef",
          "if-match": 'W/"2"',
        },
      });
      assert.equal(accepted.statusCode, 200);
      assert.equal(accepted.headers.etag, 'W/"3"');
      assert.deepEqual(accepted.json(), {
        key: "0123456789abcdef",
        expectedVersion: 2,
        version: 3,
      });
    },
  );
});

test("unknown failures are sanitized and health is the only public route set", async () => {
  await withApp(
    {
      authenticateToken: async () => ({
        kind: "user",
        principalId: "01941f29-7c7b-7000-8000-000000000003",
        authenticationStrength: "single_factor",
      }),
      configure: (app) => {
        app.get("/_test/failure", async () => {
          throw new Error("database password=do-not-reflect");
        });
      },
    },
    async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/_test/failure",
        headers: { authorization: "Bearer verified-token" },
      });
      assert.equal(response.statusCode, 500);
      assert.equal(response.json().error.code, "INTERNAL_ERROR");
      assert.doesNotMatch(response.body, /password|do-not-reflect/i);

      const routes = app.printRoutes();
      assert.match(routes, /health\/[\s\S]*live/);
      assert.match(routes, /health\/[\s\S]*ready/);
      assert.doesNotMatch(routes, /swagger|openapi|v1\/session/);
    },
  );
});
