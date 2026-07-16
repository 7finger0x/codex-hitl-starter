# Phase 1 Data Model: Platform Foundation

**Status**: Proposed design; persistence changes require HCP-03 approval  
**Authority**: PF-001 through PF-024, PF-028 through PF-033  
**Database**: Supabase Postgres, shared schema with mandatory RLS

## Conventions

- Canonical identifiers are UUIDv7 values represented as opaque strings at
  interfaces and branded by entity type in TypeScript.
- Every tenant-owned row contains `tenant_id`; environment-scoped rows also
  contain `environment_id`. Globally scoped tables are explicitly allowlisted.
- All timestamps are UTC `timestamptz`. Mutable aggregates contain `version`
  starting at 1 and updated with optimistic concurrency.
- Published policy and configuration records are immutable. Corrections create a
  new version; they never rewrite prior decision inputs.
- External credentials are opaque `secret_reference` values. No secret value is
  accepted by an ordinary domain record.
- Unique keys and foreign keys include tenant/environment columns where needed so
  a valid identifier from another tenant cannot be linked accidentally.
- Runtime roles do not own tenant tables and never receive `BYPASSRLS`.
- Deletion of append-only evidence, published versions, and delivered events is
  denied to ordinary application roles.

## Scope classification

| Scope | Examples | Enforcement |
|---|---|---|
| Global reference | permission definitions, schema catalog | Explicit read grants; no implicit global scope |
| Tenant | tenant, membership, role, support grant, audit export | `tenant_id`, RLS, tenant-aware keys |
| Tenant + environment | configuration, policy, capability exposure, service identity, event | `tenant_id` + `environment_id`, RLS, composite FKs |
| Engineering repository | Codex workflow/audit SQLite records | Separate `tooling/codex-hitl` trust domain |

## Identity and tenancy

### `users` (global identity profile)

| Field | Type | Rules |
|---|---|---|
| `id` | UUIDv7 | Primary key |
| `auth_subject` | text | Unique Supabase Auth subject; never reused |
| `locale` | text | BCP 47 language tag |
| `timezone` | text | IANA timezone |
| `status` | enum | `active`, `suspended`, `disabled` |
| `created_at`, `updated_at` | timestamptz | UTC |
| `version` | integer | Optimistic concurrency |

`users` is globally keyed but never directly enumerable by tenant members.
Tenant-visible profile data is projected only through authorized memberships.

### `tenants`

| Field | Type | Rules |
|---|---|---|
| `id` | UUIDv7 | Primary key |
| `name` | text | Normalized, non-empty; uniqueness is not global |
| `type` | enum | `individual`, `team`, `coaching`, `enterprise`, `hermes_operator`, `hybrid`, `platform_internal` |
| `status` | enum | `provisioning`, `active`, `suspended`, `closed` |
| `default_timezone` | text | IANA timezone |
| `base_currency` | text | ISO currency code or configured asset identifier |
| `created_by` | UUID | User responsible for creation |
| `created_at`, `updated_at` | timestamptz | UTC |
| `version` | integer | Optimistic concurrency |

Creation is a single transaction that also creates an owner membership, default
environment, active baseline capability/config versions, audit event, and outbox
event. If mandatory audit/outbox persistence fails, no tenant row commits.

### `environments`

| Field | Type | Rules |
|---|---|---|
| `id`, `tenant_id` | UUIDv7 | Composite tenant ownership |
| `code` | text | Unique within tenant; initial value `sandbox` |
| `kind` | enum | `sandbox`, `paper`, `staging`, `production`, `custom` |
| `execution_mode` | enum | Phase 1 defaults to `observe`; future modes remain representable |
| `status` | enum | `active`, `suspended`, `archived` |
| `created_at`, `updated_at`, `version` | standard | |

Tenant logical environments are distinct from deployment environments such as
CI, preview, development, staging, and production.

### `tenant_members`

| Field | Type | Rules |
|---|---|---|
| `id`, `tenant_id`, `user_id` | UUIDv7/UUID | Unique `(tenant_id, user_id)` active relationship |
| `status` | enum | `invited`, `active`, `suspended`, `removed` |
| `joined_at`, `suspended_at`, `removed_at` | timestamptz | State-dependent |
| `invited_by` | UUID | Tenant-scoped inviter |
| `version` | integer | Permission changes invalidate prior manifests |

### `membership_environment_access`

Maps a membership to an environment with `status`, optional start/end times, and
resource scope. A user may have different rights in every tenant/environment.

### `teams` and `team_members`

Teams are tenant-owned resource-scope groupings. Team membership never implies a
permission by itself; policy and role grants interpret team scope.

### `invitations`

Contains tenant, normalized invite target, intended environment/role scope,
requester, expiry, status, and a keyed token verifier. Plaintext invitation tokens
are never stored. Repeated invitations use a deterministic uniqueness rule and
return the existing active invitation rather than create duplicates.

## Roles, permissions, and decisions

### `permissions` (global allowlisted reference)

| Field | Type | Rules |
|---|---|---|
| `id` | UUIDv7 | Primary key |
| `code` | text | Stable unique `resource.action` identifier |
| `resource_type`, `action` | text | Canonical vocabulary |
| `sensitivity` | enum | `low`, `standard`, `high`, `critical` |
| `description` | text | No policy logic |

### `roles`

Tenant-owned custom roles or immutable system templates. Fields include name,
description, status, version, and optional `template_code`. Custom roles never
change canonical permission or resource identifiers.

### `role_permissions`

Links a role and permission with effect (`allow` or `deny`) and schema-validated
conditions. Deny takes precedence. Conditions may reference tenant environment,
resource scope, authentication strength, time window, and approval requirement;
unknown condition types fail closed.

### `member_roles`

Role assignment to a membership with environment, optional team/resource scope,
effective/expiry time, issuer, and status. Assignments cannot cross tenant keys.

### `authorization_decisions` (append-only)

Every protected decision records actor/principal, tenant, environment, permission,
resource, canonical input hash, membership/role/config/policy versions,
authentication strength, approval reference, matched rules, decision, reason
codes, correlation, trace, and time. It is linked to the corresponding audit event.

Decision values are exactly `allow`, `require_approval`, and `deny`. Any denial at
any enforcement layer stops the action.

### `capability_definitions` and `capability_exposures`

Definitions are stable global capability identifiers with route/action metadata
and required permission codes. Exposures are immutable tenant/environment versions
with policy conditions. A signed capability manifest is derived from current
authoritative membership, exposure, policy, and configuration versions; it is not
an authorization token.

## Sessions and service identities

### `session_records`

Records platform session ID, Supabase Auth session reference hash, user, issued/
last-seen/revoked time, authentication method/strength, device metadata class,
tenant/environment selection, and revocation reason. Raw access or refresh tokens
are never stored.

### `service_identities`

Tenant/environment-scoped machine principals with status, resource/action scopes,
owner, credential reference, last rotation metadata, and expiry. Human sessions
cannot be attached to service identities.

### `api_credentials`

Contains public prefix, keyed verifier, issue/expiry/revocation metadata, maximum
scope, and last-used time. Plaintext credentials are shown only at issuance and
never logged or placed in AI context.

## Runtime policy, approvals, and support access

### `policy_sets`, `policy_versions`, and `policy_rules`

- `policy_sets` identify a tenant/environment policy family and active version.
- `policy_versions` are immutable, schema-versioned publications with author,
  review/approval, effective time, content hash, and source reference.
- `policy_rules` contain stable rule IDs, priority, effect, condition AST, reason
  code, and optional approval requirements.

Publication lifecycle: `draft -> in_review -> approved -> scheduled -> effective
-> superseded -> retired`. Invalid or incompatible versions never become active.
Atomic activation updates only the active pointer after all checks and required
approval evidence succeed.

### `approval_requests` and `approval_actions`

Requests bind tenant, environment, actor, exact action/resource version, canonical
request hash, policy version/hash, reason, expiry, required approver scope, and
status. Actions are append-only approve/deny/request-change/revoke/expire records.
Material request changes invalidate earlier approvals.

### `support_access_grants`

Contains platform-support principal, customer tenant/environment/resource scope,
explicit reason, step-up authentication evidence reference, issuer, start, expiry,
revocation, and lifecycle audit reference. Expiry is evaluated authoritatively on
every request; no cached grant can extend it.

## Configuration and secret references

### `configuration_sets` and `configuration_versions`

Configuration families are tenant/environment scoped. Versions are immutable and
contain schema identifier/version, canonical JSON, content hash, author, validation
result, compatibility result, approval state, effective time, and supersession
link. Only a validated compatible version can become active atomically.

### `secret_references`

Stores opaque provider, vault path identifier, purpose, owner, classification,
rotation/revocation metadata, and environment. It never stores or returns secret
material. Constraints prevent a production reference from being activated in a
lower tenant environment.

## Audit, events, delivery, and idempotency

### `audit_events` (append-only)

Required fields:

- `id`, `tenant_id`, `environment_id`, `occurred_at`
- actor type/ID and session/service identity reference
- action, resource type/ID/version, reason
- correlation ID and trace ID
- authorization decision and policy version/hash
- request hash, outcome, stable reason/error code
- protected before/after snapshot references where applicable
- schema version and sanitized metadata

The table denies ordinary update/delete, uses an insert-only repository, and is
included in backup, export, integrity, and tenant-isolation tests.

### `outbox_events` (append-only payload)

Stores the event envelope and delivery state. The payload is immutable; lease,
attempt, publication, and reconciliation metadata are separate mutable columns or
child records. State is `pending`, `leased`, `published`, `uncertain`, or
`dead_letter`. A crash after publish but before acknowledgement is reconciled by
idempotency key rather than silently marked successful.

### `inbox_receipts`

Unique `(consumer, tenant_id, idempotency_key)` receipt containing event ID,
payload hash, first/last seen, result reference, and processing status. A duplicate
with the same hash returns the prior logical result; a conflicting hash fails.

### `idempotency_records`

Unique `(tenant_id, environment_id, principal_id, command_type, key)` with request
hash, result reference, expiry, and state. Reuse with a different canonical request
returns `IDEMPOTENCY_CONFLICT`.

### `delivery_attempts`

Append-only attempt records containing target/consumer, attempt number, timing,
outcome, sanitized error, trace context, and next retry. Uncertain delivery remains
visible until reconciled.

## Evidence and exports

### `evidence_manifests`

Tenant/environment/repository scoped manifest with source revision, dirty-tree
classification, policy/config/lockfile hashes, generator version, start/end time,
check inventory, warnings, failures, artifact references/checksums, and final
result. Readiness can be derived only from a complete passing manifest.

### `audit_exports`

Contains tenant filter, requested/produced time, requester, row count, schema
version, artifact reference, checksum, integrity metadata, classification, expiry,
and audit event. Export jobs re-check caller scope and never include unrelated
tenant rows.

### `architecture_decision_records`

ADRs are repository documents rather than application rows in Phase 1. A generated
index records ID, status, owner, review date, content checksum, and linked PF/SC
requirements for traceability.

## Operations and observability records

### `jobs` and `job_attempts`

Jobs contain tenant/environment, type/version, payload reference/hash, unique key,
priority, state, lease, progress, correlation/trace, and scheduling metadata.
Attempts are append-only. Workers verify tenant context before loading payloads.

### `deployment_records`

Records deployment environment, source revision, artifact digest, configuration/
migration versions, actor/CI identity, start/end, health result, rollback/forward-
recovery reference, and evidence manifest. Phase 1 permits local/preview/development
records only; production activation is out of scope.

### Telemetry

Logs, metrics, and traces live in their purpose-built stores and use pseudonymous
tenant identifiers when permitted. They never replace `audit_events`. Correlation,
trace, service version, environment, and error code connect the two evidence types.

## State transitions

### Membership

```text
invited -> active -> suspended -> active
                    |             |
                    +-----------> removed
active --------------------------------> removed
```

`removed` is terminal. Reinstituting access creates a new membership lifecycle or
an explicit reviewed reactivation according to policy; history is never erased.

### Invitation

```text
pending -> accepted
pending -> expired
pending -> revoked
```

Only one active invitation per tenant/normalized target/scope fingerprint exists.

### Policy/configuration version

```text
draft -> in_review -> approved -> scheduled -> effective -> superseded -> retired
  |          |           |
  +-------> rejected <----+
```

Activation is fail-closed and atomic. `effective` content is immutable.

### Outbox delivery

```text
pending -> leased -> published
             |           |
             v           v
          pending     reconciled
             |
             v
          uncertain -> reconciled | dead_letter
```

### Evidence manifest

```text
collecting -> complete_pass
collecting -> complete_fail
collecting -> incomplete
```

Only `complete_pass` may support a readiness claim, and only when bound to the
reviewed source revision and documented working-tree state.

## Required database invariants

1. Tenant-owned tables enable and force RLS before application use.
2. No tenant-owned foreign key can resolve across tenant or environment.
3. Sensitive mutation functions fail if audit or outbox insertion fails.
4. Published policy/configuration and audit/event payloads are immutable.
5. Active version pointers reference only validated, approved, compatible rows.
6. Invitation, command, event, and job idempotency keys reject hash conflicts.
7. Production secret references cannot be activated in lower environments.
8. Support access must be unexpired, customer-scoped, reasoned, step-up verified,
   and audited at each use.
9. Every request/job/event carries tenant context or an allowlisted global scope.
10. Database owners and service roles are excluded from ordinary runtime paths.

## Migration and recovery rules

- All migrations are forward-only and checksum-tracked.
- Every migration is tested from an empty schema and a representative prior
  schema, including RLS/grants and rollback or forward-fix behavior.
- Expand-and-contract changes preserve rolling compatibility.
- Destructive cleanup is a later separately approved migration after archival,
  backfill, verification, and compatibility windows.
- A migration without safe rollback must ship a tested forward-recovery script and
  an operator decision point before application.
