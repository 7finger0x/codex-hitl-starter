import {
  databaseContextMatches,
  requestContext,
  requestContextParameters,
  type DatabaseRequestContextRow,
  type RequestContext,
} from "./context.js";

export interface DatabaseQueryResult<Row = Record<string, unknown>> {
  readonly rows: readonly Row[];
  readonly rowCount: number;
}

export interface DatabaseClient {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<DatabaseQueryResult<Row>>;
  release(discard?: boolean): void;
}

export interface DatabasePoolDriver {
  connect(): Promise<DatabaseClient>;
}

export interface VerifiedTransaction {
  readonly context: RequestContext;
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<DatabaseQueryResult<Row>>;
}

interface RuntimeRoleAttestation {
  readonly role_name: string;
  readonly is_superuser: boolean;
  readonly bypasses_rls: boolean;
  readonly inherits_roles: boolean;
  readonly owns_platform_objects: boolean;
}

const EXPECTED_RUNTIME_ROLE = "platform_api";
const ROLE_ATTESTATION_SQL = `
/* platform:runtime-role-attestation */
SELECT
  current_user AS role_name,
  role.rolsuper AS is_superuser,
  role.rolbypassrls AS bypasses_rls,
  role.rolinherit AS inherits_roles,
  (
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class AS class
      JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = class.relnamespace
      WHERE class.relowner = role.oid
        AND namespace.nspname IN ('platform', 'platform_private')
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS procedure
      JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
      WHERE procedure.proowner = role.oid
        AND namespace.nspname IN ('platform', 'platform_private')
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_namespace AS namespace
      WHERE namespace.nspowner = role.oid
        AND namespace.nspname IN ('platform', 'platform_private')
    )
    OR EXISTS (
      SELECT 1
      FROM pg_catalog.pg_database AS database
      WHERE database.datdba = role.oid
        AND database.datname = current_database()
    )
  ) AS owns_platform_objects
FROM pg_catalog.pg_roles AS role
WHERE role.rolname = current_user
`;
const SET_CONTEXT_SQL = `
/* platform:set-request-context */
SELECT platform_private.set_request_context(
  $1::uuid,
  $2::uuid,
  $3::text,
  $4::uuid,
  $5::uuid,
  $6::text,
  $7::uuid
)
`;
const VERIFY_CONTEXT_SQL = `
/* platform:verify-request-context */
SELECT
  platform.current_user_id()::text AS user_id,
  platform.current_principal_id()::text AS principal_id,
  platform.current_principal_type() AS principal_type,
  platform.current_tenant_id()::text AS tenant_id,
  platform.current_environment_id()::text AS environment_id,
  platform.current_authentication_strength() AS authentication_strength,
  platform.current_correlation_id()::text AS correlation_id
FROM (SELECT platform_private.require_request_context()) AS required
`;

export class DatabaseSafetyError extends Error {}

function assertRuntimeRole(result: DatabaseQueryResult<RuntimeRoleAttestation>): void {
  const role = result.rows[0];
  if (
    result.rowCount !== 1 ||
    role === undefined ||
    role.role_name !== EXPECTED_RUNTIME_ROLE ||
    role.is_superuser !== false ||
    role.bypasses_rls !== false ||
    role.inherits_roles !== false ||
    role.owns_platform_objects !== false
  ) {
    throw new DatabaseSafetyError("Database runtime role failed safety attestation");
  }
}

export class RuntimeDatabasePool {
  readonly #driver: DatabasePoolDriver;

  constructor(driver: DatabasePoolDriver) {
    this.#driver = driver;
  }

  async transaction<Result>(
    context: RequestContext,
    operation: (transaction: VerifiedTransaction) => Result | Promise<Result>,
  ): Promise<Result> {
    const verifiedContext = requestContext(context);
    if (typeof operation !== "function") {
      throw new TypeError("Database transaction operation must be a function");
    }
    const client = await this.#driver.connect();
    let transactionOpen = false;
    let transactionCapabilityActive = false;
    let discardClient = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;

      assertRuntimeRole(await client.query<RuntimeRoleAttestation>(ROLE_ATTESTATION_SQL));
      await client.query(SET_CONTEXT_SQL, requestContextParameters(verifiedContext));
      const verification = await client.query<DatabaseRequestContextRow>(VERIFY_CONTEXT_SQL);
      if (
        verification.rowCount !== 1 ||
        verification.rows[0] === undefined ||
        !databaseContextMatches(verification.rows[0], verifiedContext)
      ) {
        throw new DatabaseSafetyError("Database request context verification failed");
      }

      transactionCapabilityActive = true;
      const transaction: VerifiedTransaction = Object.freeze({
        context: verifiedContext,
        query<Row = Record<string, unknown>>(
          text: string,
          values: readonly unknown[] = [],
        ): Promise<DatabaseQueryResult<Row>> {
          if (!transactionCapabilityActive) {
            throw new DatabaseSafetyError("Verified transaction is no longer active");
          }
          return client.query<Row>(text, values);
        },
      });
      const result = await operation(transaction);
      transactionCapabilityActive = false;
      await client.query("COMMIT");
      transactionOpen = false;
      return result;
    } catch (error) {
      transactionCapabilityActive = false;
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
          transactionOpen = false;
        } catch {
          discardClient = true;
          throw new DatabaseSafetyError("Database rollback failed; pooled client was discarded");
        }
      }
      throw error;
    } finally {
      transactionCapabilityActive = false;
      client.release(discardClient);
    }
  }
}
