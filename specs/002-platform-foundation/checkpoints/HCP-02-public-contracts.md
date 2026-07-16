# HCP-02: Platform Public and Cross-Service Contracts

**Status**: `approved`
**Prepared**: 2026-07-13
**Tasks**: T032-T035
**Requirements**: PF-006, PF-008, PF-012, PF-019, PF-021, PF-028, PF-031
**Protected action**: establishing REST, error, event, capability,
configuration, evidence, and traceability schemas as implementation authority

## Decision boundary

T032 prepares this review package only. It changes no contract, generated type,
runtime handler, database schema, infrastructure, or external publication.
T033 must record the user's exact decision before T034 writes contract tests or
T035 materializes and publishes the approved authority set inside the
repository.

Approval of HCP-02 cannot authorize dependencies, persistence, infrastructure,
engineering-policy changes, secrets, remote CI, deployment, or production use.

## Current candidate inventory

The following files are proposed as the only canonical contract inputs. Their
current hashes bind the unchanged portions of the review. The REST candidate is
incomplete until the exact delta below is materialized after approval.

| Candidate | SHA-256 | Proposed role |
|---|---|---|
| `contracts/foundation-api.openapi.json` | `2d2e6a128bdfff148906de1ccb5e62c7f65105c4977e6d487bdf314c3e930689` | REST v1 operations, parameters, responses, and shared error vocabulary |
| `contracts/domain-event.schema.json` | `219754d7e785d5dbf861e16f1fe8c6751c8f6c25bd4a1eff8fb1b5600a192812` | Canonical versioned domain-event envelope |
| `contracts/capability-manifest.schema.json` | `6e6ebae61c85aa13d6eb6c62630ffedf7cd9bb666b64446a175aa0bf475a1a37` | Signed discovery/display artifact; never authorization |
| `contracts/platform-configuration.schema.json` | `346d5b7d1c12f8dbfbf5c68ab5b2657807673c35384138769df271c8d104a936` | Tenant/environment configuration values and opaque secret references |
| `contracts/evidence-manifest.schema.json` | `79dad0bd9493fb4f6555d8c6f473d0fbfe2ec9651ad0e6a4192df6067150242f` | Exact-revision verification and completion-decision evidence |
| `contracts/traceability.schema.json` | `fc5483c9b6bd949703a76c7bfc4abda97a7760b8bb45550aeb381e9345964344` | Requirement-to-evidence graph |

All paths above are relative to `specs/002-platform-foundation/`.

## Existing REST surface retained

The 14 existing operations remain in v1 with their current method, path, and
operation ID:

| Method | Path | Operation ID |
|---|---|---|
| GET | `/health/live` | `getLiveness` |
| GET | `/health/ready` | `getReadiness` |
| GET | `/v1/session` | `getSession` |
| PUT | `/v1/session/context` | `selectSessionContext` |
| GET | `/v1/tenants` | `listTenants` |
| POST | `/v1/tenants` | `createTenant` |
| POST | `/v1/tenants/{tenantId}/invitations` | `createInvitation` |
| PUT | `/v1/tenants/{tenantId}/members/{memberId}/role-assignments` | `replaceMemberRoleAssignments` |
| GET | `/v1/capabilities` | `getCapabilities` |
| POST | `/v1/capability-definitions` | `registerCapabilityDefinition` |
| POST | `/v1/configuration-versions` | `createConfigurationVersion` |
| POST | `/v1/configuration-versions/{versionId}/activate` | `activateConfigurationVersion` |
| GET | `/v1/audit-events` | `searchAuditEvents` |
| POST | `/v1/audit-exports` | `createAuditExport` |

T035 changes `info.version` from `0.1.0-proposed` to `1.0.0` only when the
approved delta is present and its tests pass.

## Exact REST delta proposed for approval

These 34 additions close the named completeness gaps and the PF-031 capability
exposure path. No HTTP `DELETE` operation is introduced; terminal lifecycle
states preserve attributable history.

### Membership and invitation lifecycle

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/tenants/{tenantId}/members` | `listMemberships` | 200 |
| PATCH | `/v1/tenants/{tenantId}/members/{memberId}` | `updateMembership` | 200 |
| GET | `/v1/tenants/{tenantId}/invitations` | `listInvitations` | 200 |
| POST | `/v1/invitations/{invitationId}/accept` | `acceptInvitation` | 200 |
| POST | `/v1/tenants/{tenantId}/invitations/{invitationId}/revoke` | `revokeInvitation` | 200 |

Membership status is exactly `invited`, `active`, `suspended`, or `removed`;
`removed` is terminal. Invitation status is exactly `pending`, `accepted`,
`expired`, or `revoked`. Acceptance uses the invitation bearer proof, not an
untrusted tenant header, and returns no token verifier.

### Custom roles and permission catalog

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/permissions` | `listPermissions` | 200 |
| GET | `/v1/tenants/{tenantId}/roles` | `listRoles` | 200 |
| POST | `/v1/tenants/{tenantId}/roles` | `createRole` | 201 |
| GET | `/v1/tenants/{tenantId}/roles/{roleId}` | `getRole` | 200 |
| PATCH | `/v1/tenants/{tenantId}/roles/{roleId}` | `updateRole` | 200 |

Permission codes remain stable global references. A custom role contains a
tenant key, name, description, status, version, permission effects, and
schema-valid environment/team/resource conditions. Explicit deny remains
representable and cannot be weakened by capability visibility.

### Tenant environment management

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/tenants/{tenantId}/environments` | `listEnvironments` | 200 |
| POST | `/v1/tenants/{tenantId}/environments` | `createEnvironment` | 201 |
| GET | `/v1/tenants/{tenantId}/environments/{environmentId}` | `getEnvironment` | 200 |
| PATCH | `/v1/tenants/{tenantId}/environments/{environmentId}` | `updateEnvironment` | 200 |

Tenant environments use `code`, `kind`, `execution_mode`, `status`, and
`version`. They do not expose deployment-environment `risk_tier`; deployment
and tenant environments are separate concepts.

### Service-identity and credential lifecycle

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/tenants/{tenantId}/service-identities` | `listServiceIdentities` | 200 |
| POST | `/v1/tenants/{tenantId}/service-identities` | `createServiceIdentity` | 201 |
| GET | `/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}` | `getServiceIdentity` | 200 |
| PATCH | `/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}` | `updateServiceIdentity` | 200 |
| POST | `/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials` | `issueServiceCredential` | 201 |
| POST | `/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials/{credentialId}/revoke` | `revokeServiceCredential` | 200 |

Service identities require explicit tenant, environment, resource, and action
scope plus owner, status, expiry, and version. Credential issuance returns
plaintext exactly once over a `Cache-Control: no-store` response; list/get,
errors, logs, audit, evidence, and AI context expose only prefix and metadata.
Human sessions are not accepted as service credentials.

### Privileged support-access lifecycle

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/support-access-requests` | `listSupportAccessRequests` | 200 |
| POST | `/v1/support-access-requests` | `createSupportAccessRequest` | 201 |
| GET | `/v1/support-access-requests/{requestId}` | `getSupportAccessRequest` | 200 |
| POST | `/v1/support-access-requests/{requestId}/grant` | `grantSupportAccess` | 201 |
| POST | `/v1/support-access-requests/{requestId}/deny` | `denySupportAccess` | 200 |
| GET | `/v1/support-access-grants` | `listSupportAccessGrants` | 200 |
| POST | `/v1/support-access-grants/{grantId}/revoke` | `revokeSupportAccess` | 200 |

Requests and grants require separate platform-support identity, explicit reason,
step-up evidence, customer tenant/environment/resource scope, start, expiry,
issuer, status, version, and audit reference. Grant, denial, use, expiry, and
revocation remain distinct append-only evidence events. A grant is never a
cross-tenant discovery mechanism.

### Evidence-run operations

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/evidence-runs` | `listEvidenceRuns` | 200 |
| POST | `/v1/evidence-runs` | `startEvidenceRun` | 202 |
| GET | `/v1/evidence-runs/{runId}` | `getEvidenceRun` | 200 |

An evidence run binds source revision, documented worktree state, check profile,
tenant/environment or repository scope, requester, status, timestamps, and
manifest reference/hash. Status is exactly `queued`, `running`,
`complete_pass`, `complete_fail`, `incomplete`, or `cancelled`. Only
`complete_pass` may permit a completion claim, and remote CI or deployment state
cannot be inferred from a local run.

### Capability definition and exposure completeness

| Method | Path | Operation ID | Success |
|---|---|---|---|
| GET | `/v1/capability-definitions` | `listCapabilityDefinitions` | 200 |
| GET | `/v1/capability-definitions/{capabilityId}` | `getCapabilityDefinition` | 200 |
| GET | `/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures` | `getCapabilityExposures` | 200 |
| PUT | `/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures` | `replaceCapabilityExposures` | 200 |

Definitions preserve canonical permissions/routes/actions. Exposure is an
immutable versioned tenant/environment selection with policy/configuration
references. Neither exposure nor a signed capability manifest authorizes an
action.

## Shared REST contract rules

T035 must materialize these rules for every retained and added operation:

1. Request objects reject unknown properties unless a specifically reviewed
   extensibility map permits them; identifiers use UUID format and bounded text,
   arrays, pagination, and filters have explicit limits.
2. Authentication is bearer human-session or distinct service credential as
   declared per operation. Tenant and environment context is required for every
   scoped operation and independently authorized.
3. Every mutation requires `Idempotency-Key`; mutable-resource replacement or
   patch additionally requires `If-Match`. Hash conflicts return 409 and stale
   versions return 412 without partial effects.
4. Every response returns `X-Correlation-Id`. Successful sensitive mutations
   include `correlation_id`, `audit_event_id`, resource version, and sanitized
   warnings through shared `OperationMetadata`.
5. The canonical error media type is `application/json` with the existing
   nested `ErrorResponse`: stable uppercase `code`, safe actionable `message`,
   UUID `correlation_id`, `retryable`, `retry_guidance`, and allowlisted safe
   details. Validation stacks, target-existence facts, credentials, and raw
   provider errors are forbidden.
6. Opaque 404 and authorization 403 responses use the same safe shape. Common
   400, 401, 403, opaque 404, 409, 412, 422, 429, and 503 responses are declared
   wherever applicable; undocumented errors fail contract tests.
7. List operations use one opaque cursor and bounded `limit`, returning shared
   `PageMetadata`. Cursor contents are not authority and cannot change tenant
   scope.
8. Secret values are forbidden except the one-time service-credential issuance
   field described above. Configuration accepts only `secret-ref://` opaque
   references.
9. Examples use synthetic UUIDs, identities, tenants, references, and values;
   secret-shaped, customer, live-account, and production identifiers fail the
   example scan.
10. All `$ref` values resolve within the approved authority set. Runtime request
    and response validation and generated types derive from the same source.

## New and reconciled schema families

The API delta adds shared schemas for `OperationMetadata`, `PageMetadata`,
membership/invitation requests and views, permissions/roles and scoped effects,
tenant environments, service identities and one-time credentials, support
requests/grants/actions, evidence runs, capability definitions/exposures, and
their create/update inputs. Required fields and lifecycle values are those stated
in the operation sections above; response views never reuse write-input schemas
where doing so could expose secret or internal fields.

The current `Tenant`, `Session`, configuration, audit, capability, and error
schemas are retained, then tightened to reference these shared metadata,
pagination, context, and error definitions. T034 must fail before T035 because
the current candidate lacks these operations and schemas.

## Domain-event reconciliation

`domain-event.schema.json` remains unchanged and canonical. It already requires
every PF-019 field: event and schema version, tenant, environment, producer,
subject/version, actor, correlation, causation, idempotency, occurrence time,
trace context, and schema-valid data.

The superseded event sketch is reconciled as follows:

| Superseded field/choice | Disposition |
|---|---|
| `recorded_at` required | Delivery/audit storage metadata, not a domain-fact field; do not add |
| separate required `aggregate` | Canonical `subject` already carries type, ID, and version; do not duplicate |
| optional `data_hash` | Integrity is computed by outbox/evidence canonical hashing; do not make it envelope authority |
| required `provenance` | Keep canonical optional provenance for source adapters; PF-019 does not require it |
| semantic-string `schema_version` | Use canonical positive integer plus versioned `event_type` suffix |
| generic dotted event names | Use canonical `domain.past_fact.vN` pattern |
| omitted required `causation_id` | Canonical nullable-but-required causation field wins |
| no `published_at` | Canonical optional publication timestamp wins |

Breaking payload semantics require a new event type version; an existing event
type's required fields and meanings are immutable.

## Superseded-sketch disposition

The following files remain preserved as historical planning artifacts and are
never contract authority, generated inputs, published artifacts, or consumer
references:

| Historical sketch | SHA-256 | Guard |
|---|---|---|
| `contracts/openapi.yaml` | `95db9549ab9ece986dca4852396ebcb3973c0463916c0c4a88cb4c5d92a6ab36` | Must retain `x-status: superseded-planning-sketch` and `x-superseded-by` |
| `contracts/event-envelope.schema.json` | `541f279f7fcf6346f85b199b6218ea2a4514971ca96f42f0da1ee73405bf7ad6` | Must retain its superseded description |

Specific REST sketch choices are reconciled this way:

- `getSession`, `getCapabilities`, and `searchAuditEvents` remain the stable
  operation IDs; the older aliases are not generated.
- `POST /v1/tenants/{tenantId}/invitations` remains the invitation command;
  `POST .../members` is not a second invite route.
- The member, role, environment, and evidence-run operations listed in this
  review are absorbed with the exact canonical paths and models above.
- `/health/startup` is not public v1; startup validation feeds readiness and
  machine-readable bootstrap evidence.
- Current `Tenant` naming/type/status and the data-model-aligned environment and
  membership states win over the sketch's `slug`, deployment `risk_tier`, and
  `revoked` membership vocabulary.
- The existing nested `ErrorResponse` wins over the sketch's RFC-style
  `ErrorEnvelope`; no endpoint publishes two error shapes.

T034 adds a guard that fails if either historical file enters generation or
publication. This reconciliation performs no deletion.

## Consumer inventory and ownership

| Consumer | Contract use | Migration owner |
|---|---|---|
| `apps/api` | Authoritative HTTP request/response enforcement | API Architecture |
| `apps/web` | Session, tenant, capability, administration, audit, and operator views | Web Platform |
| `apps/workers` | Domain events, evidence jobs, exports, and reconciliation | Platform Operations |
| `packages/core` | Canonical source, generated types, errors, IDs, and hashes | Platform Architecture |
| `packages/identity` | Tenant, membership, environment, invitation, and service-identity views | Identity Engineering |
| `packages/policy` | Roles, permissions, approvals, support access, and capability decisions | Security Engineering |
| `packages/config` | Configuration and capability exposure | Platform Configuration |
| `packages/audit` | Audit query/export views | Security and Compliance |
| `packages/events` | Domain-event producer/consumer validation | Platform Events |
| tests, SDKs, docs, future integrations | Contract fixtures and generated client surfaces | Developer Experience |

No external consumer is claimed to exist yet. HCP-08 remains required before
any repository or generated contract is transmitted externally.

## Threat review

| Threat | Required control and T034/T035 evidence |
|---|---|
| Cross-tenant identifier substitution | Explicit tenant/environment context, independent authorization, composite ownership tests, opaque denial |
| UI or capability manifest used as authority | Manifest description, signature/expiry validation, and direct-action denial tests |
| Mass assignment and schema confusion | `additionalProperties: false`, complete request/response schemas, bounded polymorphism, unknown-version failure |
| Stale membership, role, config, or approval | Version fields, `If-Match`, fresh authoritative evaluation, next-request revocation tests |
| Idempotency collision or replay | Required key, canonical request hash, prior-result replay, mismatch 409 |
| Service-credential disclosure | One-time no-store response, write/view schema separation, secret-shaped example and serialization scans |
| Privileged support abuse | Separate identity, reason, step-up, exact customer/resource scope, short expiry, revocation, complete audit |
| Error or validation leakage | One safe error schema, allowlisted details, opaque target handling, no raw exception/provider output |
| Event spoofing, duplicate delivery, or payload drift | Required tenant/producer/subject/idempotency/trace fields, versioned type, schema validation, inbox hash conflict |
| Configuration secret injection | Opaque reference pattern only, environment classification guard, unknown properties rejected |
| False verification or traceability pass | Exact revision/worktree binding, explicit skipped/incomplete state, zero-gap trace summary, completion boolean invariant |
| Schema downgrade or generated-code drift | Immutable version IDs, locked authority hashes, internal-reference and generated-diff checks |
| Oversized request, page, filter, or evidence graph | Explicit length/item/page limits and bounded server processing |

## Compatibility and versioning policy

1. REST uses `/v1`; operation IDs, stable error codes, permission codes, field
   meanings, and resource identifiers do not change within v1.
2. Adding an optional response field or optional operation is normally additive.
   Adding a required field, narrowing a constraint, removing/renaming a field or
   operation, changing status/error behavior, or changing tenant/authorization
   semantics is breaking. Enum expansion is treated as potentially breaking for
   exhaustive consumers and requires consumer review.
3. A breaking REST change requires `/v2`, a new approved contract hash, an
   inventory of every consumer, dual support until every inventoried consumer
   migrates, rollback, and a separate approved removal task. Time alone never
   expires v1.
4. Event breaking changes use a new `event_type` version. Old consumers and
   inbox/idempotency records remain valid for their version.
5. JSON Schema `$id` and `schema_version` identify immutable major authority.
   Tightening accepted inputs or changing completion semantics is breaking even
   if the JSON shape remains parseable.
6. Generated sources are reproducible outputs, never hand-edited authority.
   Contract tests compare generated output and fail on drift.
7. Deprecations require an owner, reason, replacement, consumer list, migration
   evidence, and approved removal; deprecated fields remain validated during the
   compatibility window.
8. Contract evidence records source revision, worktree classification, authority
   and generated hashes, test results, warnings, and the exact HCP-02 decision.

## T034 test-first acceptance plan

Before T035 changes the candidate contracts, T034 must add tests that fail for
the intended missing operations/schemas and then cover:

- all 48 approved operations and unique stable operation IDs;
- complete request, success, and applicable error schemas with examples;
- every `$ref` resolving only within the approved authority set;
- the shared tenant/environment/correlation/idempotency/version rules;
- custom-role, service-identity, environment, support-access, evidence-run, and
  capability-exposure completeness;
- PF-019 domain-event required fields, version naming, sanitized data, and
  unknown-field behavior;
- capability manifests never serving as authorization;
- configuration secret-reference-only behavior;
- evidence/traceability incomplete, skipped, gap, duplicate, and dangling-link
  failure cases;
- sanitized examples and errors with no secret or cross-tenant disclosure;
- compatibility classification for additive, potentially breaking, and breaking
  fixtures;
- historical sketches excluded from generation and publication.

No passing result may be manufactured before T035 materializes the approved
authority.

## Validation and known gaps before decision

- All seven JSON candidate/sketch documents parse as JSON; the superseded YAML
  sketch parses as YAML.
- The current REST candidate has 14 operations. The approved delta would produce
  exactly 48 unique method/path operations.
- The current REST candidate intentionally fails the future completeness tests;
  this is the reviewed gap T035 would close, not current implementation evidence.
- Runtime handlers, generated TypeScript, external consumers, RLS, deployment,
  and remote CI do not yet exist and cannot be inferred from this review.
- HCP-03 remains separately required for persistence, HCP-04 for infrastructure,
  HCP-05 for engineering policy, and HCP-08 for publication/remote CI.

## Recovery and invalidation

Before T035, denial or revision has no runtime rollback because no contract has
changed. After approval, T035 must capture the pre-change hashes above, apply the
approved delta through reviewed source patches, generate from the single
authority set, and run T034 plus root verification.

If validation fails, restore the six candidate files to the hashes above through
reviewed patches, remove only generated outputs created by T035, retain failure
evidence, and leave T035 unchecked. Do not delete the historical sketches.

Approval is invalidated by any unlisted operation, path, method, operation ID,
required field, lifecycle value, security rule, schema source, compatibility
rule, candidate hash, historical-sketch disposition, or consumer boundary.

## Requested decision

### Option A — approve the exact candidate (recommended)

Approve the six-file authority set, 14 retained operations, exact 34-operation
delta, shared REST rules, event reconciliation, historical-sketch retention,
consumer inventory, threat controls, compatibility policy, T034 failing-test
scope, and T035 in-repository materialization described in this record.

### Option B — request changes

Keep HCP-02 pending and identify the exact operation, schema, security,
compatibility, consumer, or reconciliation change required. T034-T035 remain
blocked until a revised candidate is approved.

### Option C — deny

Do not establish these contracts as authority. T034-T035 and every dependent
contract implementation remain blocked.

## Approval language

An approval must identify HCP-02, Option A or an exact amended scope, the six
canonical files, 34-operation delta, superseded-sketch disposition,
compatibility/security conditions, and whether T034-T035 are authorized. General
permission to continue is not approval for this public-contract checkpoint.

## Decision record

- **Decision**: `approved` — Option A
- **Approver**: User in Codex task
- **Decision time**: `2026-07-13T02:45:52-07:00`
- **Conditions**: The approval covers the six canonical files, the 14 retained
  operations, exact 34-operation REST delta, historical-only retention of
  `openapi.yaml` and `event-envelope.schema.json`, all recorded security and
  compatibility conditions, T034 failing-test work, and T035 in-repository
  materialization. It grants no dependency, persistence, infrastructure,
  engineering-policy, secret, deployment, production, remote-CI, or external-
  publication authority.
- **Rationale**: The user selected the exact recommended candidate without an
  amendment.
- **Approval statement**: "0Approve HCP-02 Option A and authorize T034-T035
  exactly as recorded in HCP-02-public-contracts.md, including the six canonical
  files, the 14 retained operations and exact 34-operation REST delta,
  historical-only retention of openapi.yaml and event-envelope.schema.json, and
  all recorded security and compatibility conditions."
- **Evidence**: `evidence/contracts/t032-hcp02-review.json` and
  `evidence/contracts/t033-hcp02-decision.json`

## T035 materialization status

**Status**: `complete`

The approved in-repository source change is materialized without extending its
scope. The API contains the exact 48 unique operations, the event/capability/
configuration inputs retain their approved hashes, evidence and traceability add
the approved fail-closed completion invariants, and the historical sketches
retain their exact pre-approval hashes and guards. `packages/core` exposes the six
JSON sources and deterministically generates TypeScript bindings; no hand-edited
generated output is accepted.

The user approved the exact HCP-01 T035 verification amendment on
2026-07-13T03:23:16-07:00. Under the approved Node.js 24.18.0 binary, the
contract suite passes 7 of 7; generation drift, formatting for every changed or
generated T034/T035 file, ESLint, and both strict TypeScript projects pass. The
canonical audit confirms 48 unique operations, 612 resolved internal references,
no duplicate JSON keys, exact path parameters, and correlation headers on every
response. The previously reported 614 count included two references from the
excluded historical event sketch and is corrected here.

The unchanged approved `domain-event.schema.json` retains its exact HCP-02 hash
and its pre-existing two-array Prettier style warning. This is a deliberate
byte-preservation condition, not a generated or changed-file formatting failure.
Authority and root verification pass, and the dependency lock remains unchanged.
T035 is complete without external publication.

Current source hashes and the supported-runtime result are recorded in
`evidence/contracts/t035-contract-publication.json`.
