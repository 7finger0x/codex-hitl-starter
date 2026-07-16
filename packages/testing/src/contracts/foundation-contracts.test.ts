import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonObject | JsonPrimitive | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const featureContracts = resolve(repositoryRoot, "specs/002-platform-foundation/contracts");
const apiPath = resolve(featureContracts, "foundation-api.openapi.json");

const retainedOperations = [
  ["GET", "/health/live", "getLiveness"],
  ["GET", "/health/ready", "getReadiness"],
  ["GET", "/v1/session", "getSession"],
  ["PUT", "/v1/session/context", "selectSessionContext"],
  ["GET", "/v1/tenants", "listTenants"],
  ["POST", "/v1/tenants", "createTenant"],
  ["POST", "/v1/tenants/{tenantId}/invitations", "createInvitation"],
  [
    "PUT",
    "/v1/tenants/{tenantId}/members/{memberId}/role-assignments",
    "replaceMemberRoleAssignments",
  ],
  ["GET", "/v1/capabilities", "getCapabilities"],
  ["POST", "/v1/capability-definitions", "registerCapabilityDefinition"],
  ["POST", "/v1/configuration-versions", "createConfigurationVersion"],
  ["POST", "/v1/configuration-versions/{versionId}/activate", "activateConfigurationVersion"],
  ["GET", "/v1/audit-events", "searchAuditEvents"],
  ["POST", "/v1/audit-exports", "createAuditExport"],
] as const;

const addedOperations = [
  ["GET", "/v1/tenants/{tenantId}/members", "listMemberships"],
  ["PATCH", "/v1/tenants/{tenantId}/members/{memberId}", "updateMembership"],
  ["GET", "/v1/tenants/{tenantId}/invitations", "listInvitations"],
  ["POST", "/v1/invitations/{invitationId}/accept", "acceptInvitation"],
  ["POST", "/v1/tenants/{tenantId}/invitations/{invitationId}/revoke", "revokeInvitation"],
  ["GET", "/v1/permissions", "listPermissions"],
  ["GET", "/v1/tenants/{tenantId}/roles", "listRoles"],
  ["POST", "/v1/tenants/{tenantId}/roles", "createRole"],
  ["GET", "/v1/tenants/{tenantId}/roles/{roleId}", "getRole"],
  ["PATCH", "/v1/tenants/{tenantId}/roles/{roleId}", "updateRole"],
  ["GET", "/v1/tenants/{tenantId}/environments", "listEnvironments"],
  ["POST", "/v1/tenants/{tenantId}/environments", "createEnvironment"],
  ["GET", "/v1/tenants/{tenantId}/environments/{environmentId}", "getEnvironment"],
  ["PATCH", "/v1/tenants/{tenantId}/environments/{environmentId}", "updateEnvironment"],
  ["GET", "/v1/tenants/{tenantId}/service-identities", "listServiceIdentities"],
  ["POST", "/v1/tenants/{tenantId}/service-identities", "createServiceIdentity"],
  ["GET", "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}", "getServiceIdentity"],
  [
    "PATCH",
    "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}",
    "updateServiceIdentity",
  ],
  [
    "POST",
    "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials",
    "issueServiceCredential",
  ],
  [
    "POST",
    "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials/{credentialId}/revoke",
    "revokeServiceCredential",
  ],
  ["GET", "/v1/support-access-requests", "listSupportAccessRequests"],
  ["POST", "/v1/support-access-requests", "createSupportAccessRequest"],
  ["GET", "/v1/support-access-requests/{requestId}", "getSupportAccessRequest"],
  ["POST", "/v1/support-access-requests/{requestId}/grant", "grantSupportAccess"],
  ["POST", "/v1/support-access-requests/{requestId}/deny", "denySupportAccess"],
  ["GET", "/v1/support-access-grants", "listSupportAccessGrants"],
  ["POST", "/v1/support-access-grants/{grantId}/revoke", "revokeSupportAccess"],
  ["GET", "/v1/evidence-runs", "listEvidenceRuns"],
  ["POST", "/v1/evidence-runs", "startEvidenceRun"],
  ["GET", "/v1/evidence-runs/{runId}", "getEvidenceRun"],
  ["GET", "/v1/capability-definitions", "listCapabilityDefinitions"],
  ["GET", "/v1/capability-definitions/{capabilityId}", "getCapabilityDefinition"],
  [
    "GET",
    "/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures",
    "getCapabilityExposures",
  ],
  [
    "PUT",
    "/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures",
    "replaceCapabilityExposures",
  ],
] as const;

const expectedOperations = [...retainedOperations, ...addedOperations] as const;
const httpMethods = new Set(["delete", "get", "head", "options", "patch", "post", "put"]);

function parseJson(path: string): JsonObject {
  return asObject(JSON.parse(readFileSync(path, "utf8")), path);
}

function asObject(value: unknown, label: string): JsonObject {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), label);
  return value as JsonObject;
}

function asArray(value: JsonValue | undefined, label: string): JsonValue[] {
  assert.ok(Array.isArray(value), label);
  return value;
}

function asString(value: JsonValue | undefined, label: string): string {
  assert.equal(typeof value, "string", label);
  return value as string;
}

function resolvePointer(document: JsonObject, reference: string): JsonValue {
  assert.match(reference, /^#(?:\/|$)/, `external reference is forbidden: ${reference}`);
  if (reference === "#") return document;
  let current: JsonValue = document;
  for (const encoded of reference.slice(2).split("/")) {
    const token = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    const object = asObject(current, reference);
    assert.ok(token in object, `unresolved reference: ${reference}`);
    current = object[token] as JsonValue;
  }
  return current;
}

function dereference(document: JsonObject, value: JsonValue): JsonValue {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const object = value as JsonObject;
    if (typeof object.$ref === "string") return resolvePointer(document, object.$ref);
  }
  return value;
}

function operations(api: JsonObject): Array<readonly [string, string, string, JsonObject]> {
  const result: Array<readonly [string, string, string, JsonObject]> = [];
  const paths = asObject(api.paths, "OpenAPI paths");
  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem = asObject(rawPathItem, path);
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) continue;
      const operation = asObject(rawOperation, `${method} ${path}`);
      result.push([
        method.toUpperCase(),
        path,
        asString(operation.operationId, `${method} ${path} operationId`),
        operation,
      ]);
    }
  }
  return result;
}

function parameterNames(api: JsonObject, operation: JsonObject): Set<string> {
  const names = new Set<string>();
  for (const rawParameter of asArray(operation.parameters ?? [], "operation parameters")) {
    const parameter = asObject(dereference(api, rawParameter), "parameter");
    names.add(asString(parameter.name, "parameter name"));
  }
  return names;
}

function responseObject(api: JsonObject, value: JsonValue): JsonObject {
  let current = value;
  while (
    current !== null &&
    typeof current === "object" &&
    !Array.isArray(current) &&
    typeof (current as JsonObject).$ref === "string"
  ) {
    current = dereference(api, current);
  }
  return asObject(current, "response");
}

function walk(value: JsonValue, visit: (value: JsonObject) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    visit(object);
    for (const child of Object.values(object)) walk(child, visit);
  }
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("HCP-02 publishes the exact 14 retained plus 34 added REST operations", () => {
  const api = parseJson(apiPath);
  assert.equal(asObject(api.info, "info").version, "1.0.0");
  const actual = operations(api).map(([method, path, operationId]) => [method, path, operationId]);
  assert.deepEqual(actual.toSorted(), expectedOperations.map((item) => [...item]).toSorted());
  assert.equal(new Set(actual.map(([method, path]) => `${method} ${path}`)).size, 48);
  assert.equal(new Set(actual.map(([, , operationId]) => operationId)).size, 48);
});

test("all approved schema families and bounded lifecycle values are present", () => {
  const api = parseJson(apiPath);
  const schemas = asObject(asObject(api.components, "components").schemas, "schemas");
  const requiredSchemas = [
    "OperationMetadata",
    "PageMetadata",
    "Membership",
    "MembershipPage",
    "Invitation",
    "InvitationPage",
    "Permission",
    "PermissionPage",
    "Role",
    "RolePage",
    "TenantEnvironment",
    "EnvironmentPage",
    "ServiceIdentity",
    "ServiceIdentityPage",
    "ServiceCredentialIssued",
    "SupportAccessRequest",
    "SupportAccessRequestPage",
    "SupportAccessGrant",
    "SupportAccessGrantPage",
    "EvidenceRun",
    "EvidenceRunPage",
    "CapabilityDefinition",
    "CapabilityDefinitionPage",
    "CapabilityExposure",
    "CapabilityExposureSet",
  ];
  for (const schema of requiredSchemas) assert.ok(schema in schemas, schema);
  const membershipStatus = asObject(
    asObject(asObject(schemas.Membership, "Membership").properties, "properties").status,
    "membership status",
  );
  assert.deepEqual(asArray(membershipStatus.enum, "membership status enum"), [
    "invited",
    "active",
    "suspended",
    "removed",
  ]);
  const evidenceStatus = asObject(
    asObject(asObject(schemas.EvidenceRun, "EvidenceRun").properties, "properties").status,
    "evidence status",
  );
  assert.deepEqual(asArray(evidenceStatus.enum, "evidence status enum"), [
    "queued",
    "running",
    "complete_pass",
    "complete_fail",
    "incomplete",
    "cancelled",
  ]);
});

test("mutations, responses, pagination, and safe shared errors follow the approved rules", () => {
  const api = parseJson(apiPath);
  const allOperations = operations(api);
  for (const [method, path, operationId, operation] of allOperations) {
    if (!path.startsWith("/health/")) {
      assert.ok(parameterNames(api, operation).has("X-Correlation-Id"), operationId);
    }
    if (["PATCH", "POST", "PUT"].includes(method)) {
      assert.ok(parameterNames(api, operation).has("Idempotency-Key"), operationId);
    }
    if (method === "PATCH" || operationId.startsWith("replace")) {
      assert.ok(parameterNames(api, operation).has("If-Match"), operationId);
    }
    const responses = asObject(operation.responses, `${operationId} responses`);
    const success = Object.entries(responses).filter(([code]) => /^2\d\d$/.test(code));
    assert.equal(success.length, 1, `${operationId} must have one success response`);
    for (const [code, rawResponse] of Object.entries(responses)) {
      const response = responseObject(api, rawResponse);
      const headers = asObject(response.headers, `${operationId} ${code} response headers`);
      assert.ok("X-Correlation-Id" in headers, `${operationId} ${code}`);
    }
  }

  const components = asObject(api.components, "components");
  const responses = asObject(components.responses, "shared responses");
  for (const name of [
    "BadRequest",
    "Unauthorized",
    "Forbidden",
    "NotFoundOpaque",
    "Conflict",
    "PreconditionFailed",
    "ValidationError",
    "TooManyRequests",
    "ServiceUnavailable",
  ]) {
    assert.ok(name in responses, name);
  }
  const schemas = asObject(components.schemas, "schemas");
  const error = asObject(schemas.ErrorResponse, "ErrorResponse");
  assert.equal(error.additionalProperties, false);
  const nestedError = asObject(
    asObject(error.properties, "ErrorResponse properties").error,
    "ErrorResponse.error",
  );
  assert.equal(nestedError.additionalProperties, false);
  const details = asObject(
    asObject(nestedError.properties, "nested error properties").details,
    "safe details",
  );
  assert.equal(details.additionalProperties, false);
});

test("all canonical references resolve internally and historical sketches stay excluded", () => {
  const canonicalNames = [
    "foundation-api.openapi.json",
    "domain-event.schema.json",
    "capability-manifest.schema.json",
    "platform-configuration.schema.json",
    "evidence-manifest.schema.json",
    "traceability.schema.json",
  ];
  for (const name of canonicalNames) {
    const document = parseJson(resolve(featureContracts, name));
    walk(document, (object) => {
      if (typeof object.$ref === "string") resolvePointer(document, object.$ref);
    });
  }

  const historicalOpenApi = readFileSync(resolve(featureContracts, "openapi.yaml"), "utf8");
  assert.match(historicalOpenApi, /^x-status: superseded-planning-sketch$/m);
  assert.match(historicalOpenApi, /^x-superseded-by: foundation-api\.openapi\.json$/m);
  const historicalEvent = parseJson(resolve(featureContracts, "event-envelope.schema.json"));
  assert.match(asString(historicalEvent.description, "historical event description"), /Superseded/);

  const sourceManifestPath = resolve(
    repositoryRoot,
    "packages/core/src/contracts/contract-sources.json",
  );
  assert.ok(existsSync(sourceManifestPath), "contract source manifest is missing");
  const sourceManifest = parseJson(sourceManifestPath);
  const exclusions = asArray(sourceManifest.historical_exclusions, "historical exclusions");
  assert.deepEqual(exclusions, [
    "specs/002-platform-foundation/contracts/openapi.yaml",
    "specs/002-platform-foundation/contracts/event-envelope.schema.json",
  ]);
});

test("event, capability, configuration, evidence, and traceability semantics fail closed", () => {
  const event = parseJson(resolve(featureContracts, "domain-event.schema.json"));
  const eventRequired = new Set(
    asArray(event.required, "domain event required").map((value) => asString(value, "required")),
  );
  for (const field of [
    "event_id",
    "event_type",
    "schema_version",
    "tenant_id",
    "environment_id",
    "producer",
    "subject",
    "actor",
    "correlation_id",
    "causation_id",
    "idempotency_key",
    "occurred_at",
    "trace_context",
    "data",
  ]) {
    assert.ok(eventRequired.has(field), field);
  }
  const capability = parseJson(resolve(featureContracts, "capability-manifest.schema.json"));
  assert.match(
    asString(capability.description, "capability description"),
    /never an authorization token/i,
  );
  const configuration = parseJson(resolve(featureContracts, "platform-configuration.schema.json"));
  const secretReferences = asObject(
    asObject(configuration.properties, "configuration properties").secret_references,
    "secret references",
  );
  assert.equal(
    asObject(secretReferences.additionalProperties, "secret reference values").pattern,
    "^secret-ref://[A-Za-z0-9._/-]+$",
  );

  const evidence = parseJson(resolve(featureContracts, "evidence-manifest.schema.json"));
  assert.ok(asArray(evidence.allOf, "evidence completion invariants").length >= 2);
  const traceability = parseJson(resolve(featureContracts, "traceability.schema.json"));
  assert.ok(asArray(traceability.allOf, "traceability completion invariants").length >= 1);
});

test("synthetic examples are complete enough to scan and contain no secret-shaped values", () => {
  const values: JsonValue[] = [];
  for (const name of [
    "foundation-api.openapi.json",
    "domain-event.schema.json",
    "capability-manifest.schema.json",
    "platform-configuration.schema.json",
    "evidence-manifest.schema.json",
    "traceability.schema.json",
  ]) {
    const document = parseJson(resolve(featureContracts, name));
    walk(document, (object) => {
      if ("example" in object) values.push(object.example as JsonValue);
      if ("examples" in object) values.push(object.examples as JsonValue);
    });
  }
  assert.ok(values.length >= 6, `expected at least six example sets, found ${values.length}`);
  const serialized = JSON.stringify(values);
  assert.doesNotMatch(
    serialized,
    /(?:Bearer\s+[A-Za-z0-9._-]+|sk-[A-Za-z0-9]{12,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/i,
  );
  assert.doesNotMatch(serialized, /(?:customer[_-]?prod|live[_-]?account|production[_-]?secret)/i);
});

test("generated bindings are reproducible from only the six approved sources", () => {
  const generator = resolve(repositoryRoot, "packages/core/scripts/generate-contracts.ts");
  assert.ok(existsSync(generator), "contract generator is missing");
  const generated = resolve(repositoryRoot, "packages/core/src/generated/foundation-contracts.ts");
  assert.ok(existsSync(generated), "generated TypeScript bindings are missing");
  const result = spawnSync(process.execPath, ["--import", "tsx", generator, "--check"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    shell: false,
    timeout: 30_000,
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const generatedText = readFileSync(generated, "utf8");
  assert.match(generatedText, /THIS FILE IS GENERATED/);
  for (const [, , operationId] of expectedOperations) {
    assert.match(generatedText, new RegExp(`\\b${operationId}\\b`), operationId);
  }

  const sourceManifest = parseJson(
    resolve(repositoryRoot, "packages/core/src/contracts/contract-sources.json"),
  );
  const sources = asArray(sourceManifest.sources, "contract sources");
  assert.equal(sources.length, 6);
  for (const rawSource of sources) {
    const source = asObject(rawSource, "contract source");
    const path = asString(source.path, "contract source path");
    assert.equal(source.sha256, sha256(resolve(repositoryRoot, path)), path);
  }
});
