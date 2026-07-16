import assert from "node:assert/strict";
import { test } from "node:test";

import { requestContext, type RequestContext } from "../../../apps/api/src/db/context.js";
import {
  RuntimeDatabasePool,
  type DatabaseClient,
  type DatabasePoolDriver,
  type DatabaseQueryResult,
  type VerifiedTransaction,
} from "../../../apps/api/src/db/pool.js";
import {
  ExpectedVersionMismatchError,
  RepositoryBase,
  RepositoryScopeViolationError,
  assertExpectedVersion,
} from "../../../apps/api/src/db/repository.js";
import { parseResourceVersion } from "../../../packages/core/src/ids.js";

const UUIDS = {
  user: "01941f29-7c7b-7000-8000-000000000001",
  principal: "01941f29-7c7b-7000-8000-000000000002",
  tenantA: "01941f29-7c7b-7000-8000-000000000003",
  tenantB: "01941f29-7c7b-7000-8000-000000000004",
  environmentA: "01941f29-7c7b-7000-8000-000000000005",
  environmentB: "01941f29-7c7b-7000-8000-000000000006",
  correlation: "01941f29-7c7b-7000-8000-000000000007",
} as const;

function context(overrides: Partial<Record<keyof RequestContext, unknown>> = {}): RequestContext {
  return requestContext({
    userId: UUIDS.user,
    principalId: UUIDS.principal,
    principalType: "user",
    tenantId: UUIDS.tenantA,
    environmentId: UUIDS.environmentA,
    authenticationStrength: "mfa",
    correlationId: UUIDS.correlation,
    ...overrides,
  });
}

interface LocalContext {
  readonly user_id: string;
  readonly principal_id: string;
  readonly principal_type: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly authentication_strength: string;
  readonly correlation_id: string;
}

class FakeClient implements DatabaseClient {
  readonly commands: string[] = [];
  localContext: LocalContext | undefined;
  transactionOpen = false;
  released = false;
  discarded = false;
  role = {
    role_name: "platform_api",
    is_superuser: false,
    bypasses_rls: false,
    inherits_roles: false,
    owns_platform_objects: false,
  };
  tamperVerification = false;

  async query<Row = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<DatabaseQueryResult<Row>> {
    this.commands.push(text);
    if (text === "BEGIN") {
      this.transactionOpen = true;
      return result<Row>();
    }
    if (text === "COMMIT" || text === "ROLLBACK") {
      this.transactionOpen = false;
      this.localContext = undefined;
      return result<Row>();
    }
    if (text.includes("platform:runtime-role-attestation")) {
      return result<Row>(this.role as Row);
    }
    if (text.includes("platform:set-request-context")) {
      assert.equal(this.transactionOpen, true);
      this.localContext = {
        user_id: String(values[0]),
        principal_id: String(values[1]),
        principal_type: String(values[2]),
        tenant_id: String(values[3]),
        environment_id: String(values[4]),
        authentication_strength: String(values[5]),
        correlation_id: String(values[6]),
      };
      return result<Row>();
    }
    if (text.includes("platform:verify-request-context")) {
      assert.ok(this.localContext);
      const row = this.tamperVerification
        ? { ...this.localContext, tenant_id: UUIDS.tenantB }
        : this.localContext;
      return result<Row>(row as Row);
    }
    if (text.includes("platform:test-current-context")) {
      return result<Row>(this.localContext as Row);
    }
    if (text.includes("platform:test-tenant-rows")) {
      return {
        rows: [
          {
            tenant_id: this.localContext?.tenant_id,
            environment_id: this.localContext?.environment_id,
            value: "visible",
          } as Row,
        ],
        rowCount: 1,
      };
    }
    throw new Error(`Unexpected test query: ${text}`);
  }

  release(discard = false): void {
    this.released = true;
    this.discarded = discard;
  }
}

class FakePool implements DatabasePoolDriver {
  readonly client = new FakeClient();
  leases = 0;

  async connect(): Promise<DatabaseClient> {
    this.leases += 1;
    this.client.released = false;
    return this.client;
  }
}

function result<Row>(row?: Row): DatabaseQueryResult<Row> {
  return { rows: row === undefined ? [] : [row], rowCount: row === undefined ? 0 : 1 };
}

class ContextProbeRepository extends RepositoryBase {
  async current(): Promise<LocalContext> {
    const query = await this.query<LocalContext>("/* platform:test-current-context */ SELECT 1");
    return query.rows[0]!;
  }

  async tenantRows(): Promise<readonly { value: string }[]> {
    return this.queryTenantRows<{ tenant_id: string; environment_id: string; value: string }>(
      "/* platform:test-tenant-rows */ SELECT 1",
    );
  }

  verifyRow(tenantId: string, environmentId: string): void {
    this.assertRowScope({ tenant_id: tenantId, environment_id: environmentId });
  }
}

test("pooled transactions install and verify context locally without cross-lease leakage", async () => {
  const driver = new FakePool();
  const pool = new RuntimeDatabasePool(driver);

  await pool.transaction(context(), async (transaction) => {
    const current = await new ContextProbeRepository(transaction).current();
    assert.equal(current.tenant_id, UUIDS.tenantA);
    assert.equal(current.environment_id, UUIDS.environmentA);
  });
  assert.equal(driver.client.localContext, undefined);
  assert.equal(driver.client.transactionOpen, false);

  await pool.transaction(
    context({ tenantId: UUIDS.tenantB, environmentId: UUIDS.environmentB }),
    async (transaction) => {
      const current = await new ContextProbeRepository(transaction).current();
      assert.equal(current.tenant_id, UUIDS.tenantB);
      assert.equal(current.environment_id, UUIDS.environmentB);
    },
  );
  assert.equal(driver.client.localContext, undefined);
  assert.equal(driver.leases, 2);
  assert.equal(
    driver.client.commands.filter((command) => command.includes("runtime-role-attestation")).length,
    2,
  );
});

test("rollback clears transaction-local context before the pooled client is reused", async () => {
  const driver = new FakePool();
  const pool = new RuntimeDatabasePool(driver);
  await assert.rejects(
    pool.transaction(context(), () => {
      throw new Error("domain failure");
    }),
    /domain failure/,
  );
  assert.equal(driver.client.localContext, undefined);
  assert.equal(driver.client.transactionOpen, false);
  assert.equal(driver.client.commands.at(-1), "ROLLBACK");

  await pool.transaction(context({ tenantId: UUIDS.tenantB }), async (transaction) => {
    assert.equal(
      (await new ContextProbeRepository(transaction).current()).tenant_id,
      UUIDS.tenantB,
    );
  });
});

test("verified transaction capability expires when the callback completes", async () => {
  const pool = new RuntimeDatabasePool(new FakePool());
  let captured: VerifiedTransaction | undefined;
  await pool.transaction(context(), (transaction) => {
    captured = transaction;
  });
  assert.throws(() => captured!.query("SELECT 1"), /transaction is no longer active/i);
});

test("runtime role must be the non-owner, non-superuser, non-bypass platform API role", async () => {
  for (const role of [
    { role_name: "postgres" },
    { role_name: "platform_api", is_superuser: true },
    { role_name: "platform_api", bypasses_rls: true },
    { role_name: "platform_api", inherits_roles: true },
    { role_name: "platform_api", owns_platform_objects: true },
  ]) {
    const driver = new FakePool();
    driver.client.role = { ...driver.client.role, ...role };
    await assert.rejects(
      new RuntimeDatabasePool(driver).transaction(context(), () => undefined),
      /database runtime role failed safety attestation/i,
    );
    assert.equal(driver.client.localContext, undefined);
  }
});

test("database-observed request context must exactly match the validated input", async () => {
  const driver = new FakePool();
  driver.client.tamperVerification = true;
  await assert.rejects(
    new RuntimeDatabasePool(driver).transaction(context(), () => undefined),
    /database request context verification failed/i,
  );
  assert.equal(driver.client.localContext, undefined);
});

test("repository rows must match the verified tenant and environment", async () => {
  const pool = new RuntimeDatabasePool(new FakePool());
  await pool.transaction(context(), async (transaction) => {
    const repository = new ContextProbeRepository(transaction);
    assert.deepEqual(await repository.tenantRows(), [
      { tenant_id: UUIDS.tenantA, environment_id: UUIDS.environmentA, value: "visible" },
    ]);
    repository.verifyRow(UUIDS.tenantA, UUIDS.environmentA);
    assert.throws(
      () => repository.verifyRow(UUIDS.tenantB, UUIDS.environmentA),
      RepositoryScopeViolationError,
    );
  });
});

test("expected-version guard accepts an exact match and rejects stale state opaquely", () => {
  assert.doesNotThrow(() =>
    assertExpectedVersion(parseResourceVersion(7), parseResourceVersion(7)),
  );
  assert.throws(
    () => assertExpectedVersion(parseResourceVersion(8), parseResourceVersion(7)),
    ExpectedVersionMismatchError,
  );
  try {
    assertExpectedVersion(parseResourceVersion(8), parseResourceVersion(7));
  } catch (error) {
    assert.deepEqual(JSON.parse(JSON.stringify(error)), {});
  }
});

test("request context validation fails closed before leasing a connection", async () => {
  for (const invalid of [
    { tenantId: "not-a-uuid" },
    { principalType: "anonymous" },
    { authenticationStrength: "MFA" },
    { correlationId: "550e8400-e29b-41d4-a716-446655440000" },
  ]) {
    assert.throws(() => context(invalid), /request context/i);
  }

  const driver = new FakePool();
  const forged = { ...context(), tenantId: "not-a-uuid" };
  await assert.rejects(
    new RuntimeDatabasePool(driver).transaction(forged as never, () => undefined),
    /request context/i,
  );
  assert.equal(driver.leases, 0);
});
