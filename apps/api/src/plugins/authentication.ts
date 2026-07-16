import type { FastifyInstance } from "fastify";

import { StableError, errorCode } from "../../../../packages/core/src/errors.js";
import { parseUuidV7 } from "../../../../packages/core/src/ids.js";

export type PrincipalKind = "user" | "service" | "support";

export interface AuthenticatedPrincipal {
  readonly kind: PrincipalKind;
  readonly principalId: string;
  readonly authenticationStrength: string;
}

export type AuthenticateToken = (
  token: string,
) => AuthenticatedPrincipal | null | Promise<AuthenticatedPrincipal | null>;

declare module "fastify" {
  interface FastifyRequest {
    principal?: AuthenticatedPrincipal;
  }
}

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9._~-]{1,4096})$/;
const AUTHENTICATION_STRENGTH_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

function authenticationRequired(): StableError {
  return new StableError({
    code: errorCode("AUTHENTICATION_REQUIRED"),
    message: "Valid authentication is required.",
    httpStatus: 401,
    retryable: false,
    retryGuidance: "Authenticate with a current supported credential and retry.",
  });
}

function verifiedPrincipal(value: AuthenticatedPrincipal | null): AuthenticatedPrincipal {
  if (
    value === null ||
    !(["user", "service", "support"] as const).includes(value.kind) ||
    !AUTHENTICATION_STRENGTH_PATTERN.test(value.authenticationStrength)
  ) {
    throw authenticationRequired();
  }
  try {
    parseUuidV7(value.principalId);
  } catch {
    throw authenticationRequired();
  }
  return Object.freeze({ ...value });
}

export function installAuthentication(
  app: FastifyInstance,
  authenticateToken?: AuthenticateToken,
): void {
  app.decorateRequest("principal", undefined);
  app.addHook("preValidation", async (request) => {
    if (request.routeOptions.config.publicRoute === true) return;
    const authorization = request.headers.authorization;
    const match = typeof authorization === "string" ? BEARER_PATTERN.exec(authorization) : null;
    if (match === null || authenticateToken === undefined) throw authenticationRequired();
    request.principal = verifiedPrincipal(await authenticateToken(match[1]!));
  });
}
