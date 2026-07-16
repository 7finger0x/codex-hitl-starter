import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp, type AuthenticatedPrincipal } from "../../../apps/api/src/app.js";

const PRINCIPAL: AuthenticatedPrincipal = {
  kind: "user",
  principalId: "01941f29-7c7b-7000-8000-000000000055",
  authenticationStrength: "multi_factor",
};

const contract = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "specs/002-platform-foundation/contracts/foundation-api.openapi.json"),
    "utf8",
  ),
) as {
  readonly paths: Readonly<Record<string, Readonly<Record<string, { operationId?: string }>>>>;
};

async function withApp(assertion: (app: FastifyInstance) => Promise<void>): Promise<void> {
  const app = buildApp({ authenticateToken: async () => PRINCIPAL });
  try {
    await app.ready();
    await assertion(app);
  } finally {
    await app.close();
  }
}

function approvedOperation(path: string, method: string, operationId: string): void {
  assert.equal(contract.paths[path]?.[method]?.operationId, operationId);
}

test("session context endpoint is registered from the approved contract", async () => {
  approvedOperation("/v1/session", "get", "getSession");
  await withApp(async (app) => {
    assert.match(app.printRoutes(), /v1\/session/u);
    const response = await app.inject({
      method: "GET",
      url: "/v1/session",
      headers: { authorization: "Bearer synthetic-user" },
    });
    assert.equal(response.statusCode, 200);
    assert.ok(Array.isArray(response.json().available_tenants));
  });
});

test("tenant listing and atomic creation endpoints are registered", async () => {
  approvedOperation("/v1/tenants", "get", "listTenants");
  approvedOperation("/v1/tenants", "post", "createTenant");
  await withApp(async (app) => {
    const routes = app.printRoutes();
    assert.match(routes, /v1\/tenants/u);

    const listed = await app.inject({
      method: "GET",
      url: "/v1/tenants",
      headers: { authorization: "Bearer synthetic-user" },
    });
    assert.equal(listed.statusCode, 200);
    assert.ok(Array.isArray(listed.json().items));

    const created = await app.inject({
      method: "POST",
      url: "/v1/tenants",
      headers: {
        authorization: "Bearer synthetic-user",
        "idempotency-key": "tenant-create-00000055",
      },
      payload: { name: "Synthetic Tenant", tenant_type: "team" },
    });
    assert.equal(created.statusCode, 201);
    assert.deepEqual(Object.keys(created.json()).toSorted(), [
      "default_environment",
      "owner_membership",
      "tenant",
    ]);
  });
});

test("context selection is idempotent and returns recalculated authority", async () => {
  approvedOperation("/v1/session/context", "put", "selectSessionContext");
  await withApp(async (app) => {
    assert.match(app.printRoutes(), /v1\/session\/context/u);
    const response = await app.inject({
      method: "PUT",
      url: "/v1/session/context",
      headers: {
        authorization: "Bearer synthetic-user",
        "idempotency-key": "context-select-00000055",
      },
      payload: {
        tenant_id: "01941f29-7c7b-7000-8000-000000000101",
        environment_id: "01941f29-7c7b-7000-8000-000000000201",
      },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().tenant_id, "01941f29-7c7b-7000-8000-000000000101");
    assert.ok(response.json().capability_manifest !== undefined);
  });
});

test("invitation lifecycle endpoints use opaque approved paths", async () => {
  approvedOperation("/v1/tenants/{tenantId}/invitations", "post", "createInvitation");
  approvedOperation("/v1/invitations/{invitationId}/accept", "post", "acceptInvitation");
  approvedOperation(
    "/v1/tenants/{tenantId}/invitations/{invitationId}/revoke",
    "post",
    "revokeInvitation",
  );
  await withApp(async (app) => {
    const routes = app.printRoutes();
    assert.match(routes, /invitations/u);
    assert.match(routes, /accept/u);
    assert.match(routes, /revoke/u);
  });
});

test("membership and role-assignment endpoints are registered", async () => {
  approvedOperation("/v1/tenants/{tenantId}/members", "get", "listMemberships");
  approvedOperation(
    "/v1/tenants/{tenantId}/members/{memberId}/role-assignments",
    "put",
    "replaceMemberRoleAssignments",
  );
  await withApp(async (app) => {
    const routes = app.printRoutes();
    assert.match(routes, /members/u);
    assert.match(routes, /role-assignments/u);
  });
});

test("identity routes remain protected and deny unauthenticated direct calls", async () => {
  const app = buildApp();
  try {
    await app.ready();
    for (const [method, url] of [
      ["GET", "/v1/session"],
      ["GET", "/v1/tenants"],
      ["PUT", "/v1/session/context"],
    ] as const) {
      const response = await app.inject({ method, url });
      assert.equal(response.statusCode, 401, `${method} ${url}`);
      assert.equal(response.json().error.code, "AUTHENTICATION_REQUIRED");
      assert.match(response.json().error.correlation_id, /^[0-9a-f-]{36}$/u);
    }
  } finally {
    await app.close();
  }
});
