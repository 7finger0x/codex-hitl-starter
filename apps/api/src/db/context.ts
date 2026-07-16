import { parseUuidV7, type UuidV7 } from "../../../../packages/core/src/ids.js";
import {
  parseCorrelationId,
  type CorrelationId,
} from "../../../../packages/core/src/correlation.js";

export type PrincipalType = "user" | "service" | "support" | "system";

export interface RequestContext {
  readonly userId: UuidV7<"UserId">;
  readonly principalId: UuidV7<"PrincipalId">;
  readonly principalType: PrincipalType;
  readonly tenantId: UuidV7<"TenantId">;
  readonly environmentId: UuidV7<"EnvironmentId">;
  readonly authenticationStrength: string;
  readonly correlationId: CorrelationId;
}

export interface DatabaseRequestContextRow {
  readonly user_id: string;
  readonly principal_id: string;
  readonly principal_type: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly authentication_strength: string;
  readonly correlation_id: string;
}

const PRINCIPAL_TYPES = new Set<PrincipalType>(["user", "service", "support", "system"]);
const AUTHENTICATION_STRENGTH_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const REQUEST_CONTEXT_KEYS = [
  "authenticationStrength",
  "correlationId",
  "environmentId",
  "principalId",
  "principalType",
  "tenantId",
  "userId",
] as const;

function fail(): never {
  throw new TypeError("Request context is incomplete or malformed");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates the authentication boundary before a database client is leased. */
export function requestContext(value: unknown): RequestContext {
  if (!isRecord(value)) return fail();
  if (Object.keys(value).sort().join(",") !== [...REQUEST_CONTEXT_KEYS].sort().join(",")) {
    return fail();
  }

  try {
    if (
      typeof value.principalType !== "string" ||
      !PRINCIPAL_TYPES.has(value.principalType as PrincipalType) ||
      typeof value.authenticationStrength !== "string" ||
      !AUTHENTICATION_STRENGTH_PATTERN.test(value.authenticationStrength)
    ) {
      return fail();
    }
    return Object.freeze({
      userId: parseUuidV7<"UserId">(value.userId),
      principalId: parseUuidV7<"PrincipalId">(value.principalId),
      principalType: value.principalType as PrincipalType,
      tenantId: parseUuidV7<"TenantId">(value.tenantId),
      environmentId: parseUuidV7<"EnvironmentId">(value.environmentId),
      authenticationStrength: value.authenticationStrength,
      correlationId: parseCorrelationId(value.correlationId),
    });
  } catch {
    return fail();
  }
}

export function requestContextParameters(context: RequestContext): readonly string[] {
  return [
    context.userId,
    context.principalId,
    context.principalType,
    context.tenantId,
    context.environmentId,
    context.authenticationStrength,
    context.correlationId,
  ];
}

export function databaseContextMatches(
  observed: DatabaseRequestContextRow,
  expected: RequestContext,
): boolean {
  return (
    observed.user_id === expected.userId &&
    observed.principal_id === expected.principalId &&
    observed.principal_type === expected.principalType &&
    observed.tenant_id === expected.tenantId &&
    observed.environment_id === expected.environmentId &&
    observed.authentication_strength === expected.authenticationStrength &&
    observed.correlation_id === expected.correlationId
  );
}
