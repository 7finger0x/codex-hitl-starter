import {
  parseResourceVersion,
  parseUuidV7,
  type ResourceVersion,
} from "../../../../packages/core/src/ids.js";
import type { DatabaseQueryResult, VerifiedTransaction } from "./pool.js";

export interface TenantScopedRow {
  readonly tenant_id: string;
  readonly environment_id?: string;
}

export class RepositoryScopeViolationError extends Error {}
export class ExpectedVersionMismatchError extends Error {}

export function assertExpectedVersion(actual: ResourceVersion, expected: ResourceVersion): void {
  const validActual = parseResourceVersion(actual);
  const validExpected = parseResourceVersion(expected);
  if (validActual !== validExpected) {
    throw new ExpectedVersionMismatchError("The expected resource version does not match");
  }
}

export abstract class RepositoryBase {
  readonly #transaction: VerifiedTransaction;

  constructor(transaction: VerifiedTransaction) {
    this.#transaction = transaction;
  }

  protected get context(): VerifiedTransaction["context"] {
    return this.#transaction.context;
  }

  protected query<Row = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<DatabaseQueryResult<Row>> {
    return this.#transaction.query<Row>(text, values);
  }

  protected async queryTenantRows<Row extends TenantScopedRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<readonly Row[]> {
    const result = await this.query<Row>(text, values);
    for (const row of result.rows) this.assertRowScope(row);
    return result.rows;
  }

  protected assertRowScope(row: TenantScopedRow): void {
    let tenantId: string;
    let environmentId: string | undefined;
    try {
      tenantId = parseUuidV7(row.tenant_id);
      environmentId =
        row.environment_id === undefined ? undefined : parseUuidV7(row.environment_id);
    } catch {
      throw new RepositoryScopeViolationError("Repository row scope verification failed");
    }
    if (
      tenantId !== this.context.tenantId ||
      (environmentId !== undefined && environmentId !== this.context.environmentId)
    ) {
      throw new RepositoryScopeViolationError("Repository row scope verification failed");
    }
  }
}
