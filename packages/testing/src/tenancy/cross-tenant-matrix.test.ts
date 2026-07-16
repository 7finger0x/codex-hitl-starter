import assert from "node:assert/strict";
import { test } from "node:test";

type AccessKind =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "function"
  | "storage"
  | "cache"
  | "job"
  | "export"
  | "audit";

interface MatrixRequest {
  readonly access: AccessKind;
  readonly actorTenantId: string;
  readonly targetTenantId: string;
  readonly targetResourceId: string;
}

interface MatrixResult {
  readonly allowed: boolean;
  readonly status: number;
  readonly body: Readonly<Record<string, unknown>>;
  readonly audit: {
    readonly recorded: boolean;
    readonly action: AccessKind;
    readonly decision: "allow" | "deny";
    readonly actorTenantId: string;
  };
}

interface CrossTenantMatrixDriver {
  execute(request: MatrixRequest): Promise<MatrixResult>;
}

const TENANT_A = "01941f29-7c7b-7000-8000-000000000001";
const TENANT_B = "01941f29-7c7b-7000-8000-000000000002";
const RESOURCE_B = "01941f29-7c7b-7000-8000-000000000003";
const CORRELATION_ID = /^019[0-9a-f]-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const accessKinds: readonly AccessKind[] = [
  "select",
  "insert",
  "update",
  "delete",
  "function",
  "storage",
  "cache",
  "job",
  "export",
  "audit",
];
const driverModulePath = "../../../identity/src/cross-tenant-test-driver.js";

function matrixDriver(value: unknown): CrossTenantMatrixDriver {
  assert.ok(value !== null && typeof value === "object", "matrix driver module must load");
  const candidate = (value as { crossTenantMatrixDriver?: unknown }).crossTenantMatrixDriver;
  assert.ok(candidate !== null && typeof candidate === "object", "matrix driver must be exported");
  assert.equal(
    typeof (candidate as { execute?: unknown }).execute,
    "function",
    "matrix driver must execute access attempts",
  );
  return candidate as CrossTenantMatrixDriver;
}

async function loadDriver(): Promise<CrossTenantMatrixDriver> {
  const module: unknown = await import(driverModulePath);
  return matrixDriver(module);
}

function assertOpaqueDenial(access: AccessKind, result: MatrixResult): void {
  assert.equal(result.allowed, false, `${access} crossed the tenant boundary`);
  assert.equal(result.status, 404, `${access} must use an opaque not-found response`);
  assert.equal(result.body.code, "RESOURCE_NOT_FOUND");
  assert.match(String(result.body.correlation_id), CORRELATION_ID);
  assert.deepEqual(Object.keys(result.body).toSorted(), ["code", "correlation_id", "message"]);
  assert.equal(result.body.message, "The requested resource was not found.");
  assert.equal(JSON.stringify(result.body).includes(TENANT_B), false);
  assert.equal(JSON.stringify(result.body).includes(RESOURCE_B), false);
  assert.deepEqual(result.audit, {
    recorded: true,
    action: access,
    decision: "deny",
    actorTenantId: TENANT_A,
  });
}

for (const access of accessKinds) {
  test(`${access} permits same-tenant access and opaquely denies cross-tenant access`, async () => {
    const driver = await loadDriver();
    const sameTenant = await driver.execute({
      access,
      actorTenantId: TENANT_A,
      targetTenantId: TENANT_A,
      targetResourceId: RESOURCE_B,
    });
    assert.equal(sameTenant.allowed, true, `${access} control must not blanket-deny access`);
    assert.equal(sameTenant.audit.decision, "allow");

    const crossTenant = await driver.execute({
      access,
      actorTenantId: TENANT_A,
      targetTenantId: TENANT_B,
      targetResourceId: RESOURCE_B,
    });
    assertOpaqueDenial(access, crossTenant);
  });
}
