# HCP-03: Phase 1 Persistence Foundation

**Status**: `approved_with_conditions`
**Prepared**: 2026-07-13
**Tasks**: T036-T042
**Requirements**: PF-003, PF-009, PF-011, PF-013, PF-024
**Protected action**: creating or applying PostgreSQL schemas, migrations,
roles, grants, functions, triggers, tables, constraints, or RLS policies

## Decision boundary

T036 prepares this review record only. It creates no database object, migration,
seed, connection, container, backup, or destructive action. T037 must record an
explicit decision for the exact inventory and disposable target below before
T038-T042 begin.

HCP-03 cannot authorize a dependency or database-tool addition, package or
lockfile change, image pull, container/infrastructure change, secret access,
remote connection, production action, or repository-content transmission. The
current HCP-01 approval explicitly defers PostgreSQL/Supabase clients, Supabase
CLI, pgTAP, Testcontainers, and container tooling. The current WSL environment
has no usable `psql`, Supabase CLI, or Docker integration. Migration creation may
be approved independently, but target provisioning and execution remain blocked
until their separately governed tools and origins are approved and available.

## Exact migration series

Only these forward-only files may be created under an Option A decision. Their
order, ownership, and object inventory are fixed; any additional migration,
rename, drop, type narrowing, object, extension, or data rewrite invalidates the
approval.

| Order | File                                                                   | Sole ownership                                                                                                                               |
| ----- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 001   | `supabase/migrations/202607100001_foundation_bootstrap.sql`            | Schemas, role groups, grants, migration ledger, request-context helpers, and common trigger functions                                        |
| 002   | `supabase/migrations/202607100002_identity_tenancy_foundation.sql`     | Identity, tenant, environment, membership, team, invitation, session, service-identity, credential, permission, and role tables              |
| 003   | `supabase/migrations/202607100003_control_and_evidence_foundation.sql` | Authorization, policy, approval, support, configuration, capability, audit, idempotency, event, job, evidence, export, and deployment tables |

All objects live in `platform` except the migration ledger and privileged helper
functions, which live in `platform_private`. No object is added to, removed from,
or granted through Supabase-managed `auth`, `storage`, `realtime`, `extensions`,
or `supabase_migrations` schemas. No PostgreSQL extension is added: UUIDv7 values
are application-generated and stored in the built-in `uuid` type, canonical
hashes are supplied and verified by application code, and the built-in `plpgsql`
language is the only procedural prerequisite.

## Exact role and grant inventory

The migrations create only group roles; they create no login, password, secret,
superuser, database, or remote credential.

| Role                       | Attributes and use                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform_owner`           | `NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`; owns the two schemas and their objects; never granted to a runtime login                                                                                   |
| `platform_migrator`        | `NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`; may `SET ROLE platform_owner` only for the reviewed migration transaction; an external disposable-target executor must be separately provisioned |
| `platform_runtime`         | `NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`; common schema usage and function execution only                                                                                                  |
| `platform_api`             | `NOLOGIN NOINHERIT NOBYPASSRLS`; member of `platform_runtime`; receives table privileges by the mutation matrix below and never owns an object                                                                                      |
| `platform_worker`          | `NOLOGIN NOINHERIT NOBYPASSRLS`; member of `platform_runtime`; receives leased job/outbox/inbox privileges only after setting one verified tenant/environment context                                                               |
| `platform_evidence_reader` | `NOLOGIN NOINHERIT NOBYPASSRLS`; member of `platform_runtime`; read-only access to tenant-scoped audit/evidence/export views under RLS                                                                                              |

`PUBLIC` loses `CREATE` on `public` and has no privilege on the new schemas.
`platform_runtime` receives `USAGE` on `platform` and execute only on allowlisted
context accessors. Runtime roles receive no `USAGE` on `platform_private`, no
role-management privilege, no DDL, no `TRUNCATE`, no trigger disablement, no
sequence ownership, and no direct privilege on the migration ledger. Default
privileges owned by `platform_owner` revoke access from `PUBLIC` before granting
the exact runtime rights.

## Exact function inventory

| Function                                                        | Schema             | Security and effect                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `set_request_context(uuid, uuid, text, uuid, uuid, text, uuid)` | `platform_private` | `SECURITY DEFINER`, fixed safe `search_path`; validates principal type and non-null UUID/text shapes, then uses transaction-local `set_config(..., true)` for user, principal, principal type, tenant, environment, authentication strength, and correlation ID; executable only by API/worker roles |
| `clear_request_context()`                                       | `platform_private` | Clears only the seven transaction-local platform settings; test/migrator use only                                                                                                                                                                                                                    |
| `current_user_id()`                                             | `platform`         | `STABLE`, returns nullable UUID from the local setting and fails on malformed content                                                                                                                                                                                                                |
| `current_principal_id()`                                        | `platform`         | `STABLE`, returns the verified principal UUID                                                                                                                                                                                                                                                        |
| `current_principal_type()`                                      | `platform`         | `STABLE`, returns exactly `user`, `service`, `support`, or `system`                                                                                                                                                                                                                                  |
| `current_tenant_id()`                                           | `platform`         | `STABLE`, returns the verified tenant UUID                                                                                                                                                                                                                                                           |
| `current_environment_id()`                                      | `platform`         | `STABLE`, returns the verified environment UUID                                                                                                                                                                                                                                                      |
| `current_authentication_strength()`                             | `platform`         | `STABLE`, returns the bounded authentication-strength value                                                                                                                                                                                                                                          |
| `current_correlation_id()`                                      | `platform`         | `STABLE`, returns the request correlation UUID                                                                                                                                                                                                                                                       |
| `require_request_context()`                                     | `platform_private` | Fails closed unless principal, tenant, environment, authentication strength, and correlation settings are all present in the current transaction                                                                                                                                                     |
| `tenant_matches(uuid)`                                          | `platform_private` | `STABLE LEAKPROOF` is not claimed; returns true only for a non-null exact current tenant match                                                                                                                                                                                                       |
| `environment_matches(uuid, uuid)`                               | `platform_private` | Returns true only when both current tenant and environment match                                                                                                                                                                                                                                     |
| `touch_versioned_row()`                                         | `platform_private` | Trigger function that requires `OLD.version`, sets `NEW.version = OLD.version + 1`, and sets `updated_at = transaction_timestamp()`; never accepts a caller-selected version                                                                                                                         |
| `reject_row_mutation()`                                         | `platform_private` | Trigger function that raises on update or delete of append-only rows                                                                                                                                                                                                                                 |
| `protect_outbox_payload()`                                      | `platform_private` | Allows lease/delivery-state updates but rejects changes to tenant, environment, event ID/type/version, payload, payload hash, idempotency, correlation, causation, actor, subject, or occurrence time                                                                                                |
| `protect_published_version()`                                   | `platform_private` | Rejects update/delete of effective/superseded/retired policy or configuration content; active pointers change only through later reviewed application commands                                                                                                                                       |
| `protect_completed_evidence()`                                  | `platform_private` | Rejects changes after an evidence manifest reaches a complete terminal state                                                                                                                                                                                                                         |
| `guard_secret_reference_environment()`                          | `platform_private` | Rejects activation of a production-classified reference in a non-production tenant environment; never resolves or reads secret material                                                                                                                                                              |

These are guard and context functions, not public API or business mutation
procedures. T039-T041 add no tenant-bypassing `SECURITY DEFINER` query, generic SQL
executor, cross-tenant reporting function, or support-access bypass. Application
authorization and transaction orchestration remain later tasks; direct table
grants stay minimal until those paths exist.

## Exact table inventory and classification

The approved field/state/relationship definitions in `data-model.md` are binding.
Standard mutable records add only `created_at`, `updated_at`, and `version` where
that model declares the standard set. Every tenant-owned key and foreign key
includes `tenant_id`; every environment-scoped relationship includes both
`tenant_id` and `environment_id`. Text, JSON, array, and metadata fields are
bounded with check constraints; unknown lifecycle values fail closed.

Classification values are: `internal` (repository/platform metadata),
`confidential` (tenant business/security metadata), and `restricted` (identity,
credential verifier, support, secret-reference, or security evidence metadata).
No table may hold a plaintext password, invitation token, API credential, session
token, secret value, private key, customer production identifier, or raw provider
response.

### Migration 001 — bootstrap

| Table                                          | Scope           | Classification | Key controls                                                                                                             |
| ---------------------------------------------- | --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `platform_private.foundation_migration_ledger` | Database global | internal       | Migration ID primary key, source SHA-256, applied time/executor/tool version; owner/migrator read only; no runtime grant |

### Migration 002 — identity and tenancy

| Table                           | Scope                                        | Classification | Key controls                                                                                              |
| ------------------------------- | -------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `users`                         | Global identity                              | restricted     | UUIDv7 PK; unique immutable auth-subject hash/reference; self-only RLS; not enumerable                    |
| `permissions`                   | Global allowlist                             | internal       | Stable unique `resource.action`; runtime read only; migrator-owned writes                                 |
| `tenants`                       | Tenant root (`id` is tenant key)             | confidential   | Forced RLS on `id = current_tenant_id()`; no global name uniqueness                                       |
| `environments`                  | Tenant                                       | confidential   | PK/unique keys include tenant; unique `(tenant_id, code)`                                                 |
| `tenant_members`                | Tenant                                       | restricted     | Unique `(tenant_id, user_id)` lifecycle; removed terminal; composite FKs                                  |
| `membership_environment_access` | Tenant + environment                         | confidential   | Composite membership/environment keys; bounded resource scope                                             |
| `teams`                         | Tenant                                       | confidential   | Tenant key and tenant-local unique normalized name                                                        |
| `team_members`                  | Tenant                                       | confidential   | Composite team/member tenant keys; no permission implication                                              |
| `invitations`                   | Tenant                                       | restricted     | Normalized target, scope fingerprint, keyed verifier only; one pending invitation per fingerprint         |
| `roles`                         | Tenant                                       | confidential   | Tenant-local name; immutable system template code; optimistic version                                     |
| `role_permissions`              | Tenant                                       | confidential   | Composite role/permission key; effect exactly allow/deny; bounded validated condition document            |
| `member_roles`                  | Tenant + optional environment                | confidential   | Composite tenant membership/role/environment keys, issuer, effective/expiry/status                        |
| `session_records`               | Global user with selected tenant/environment | restricted     | Session reference hash only; self-only forced RLS; revocation/history retained                            |
| `service_identities`            | Tenant + environment                         | restricted     | Explicit owner/resource/action scope, status, expiry, version; no human session field                     |
| `api_credentials`               | Tenant + environment                         | restricted     | Public prefix and keyed verifier only; issue/expiry/revocation/last-use metadata; no plaintext credential |

### Migration 003 — control and evidence

| Table                     | Scope                                           | Classification | Key controls                                                                                                   |
| ------------------------- | ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `authorization_decisions` | Tenant + environment                            | restricted     | Append-only exact input/version/hash/decision evidence; decision allow/require_approval/deny                   |
| `capability_definitions`  | Global allowlist                                | internal       | Stable capability/route/action/permission metadata; runtime read only                                          |
| `capability_exposures`    | Tenant + environment                            | confidential   | Immutable versioned selection with policy/config references; never authority                                   |
| `policy_sets`             | Tenant + environment                            | confidential   | Family and active-version pointer; pointer guarded                                                             |
| `policy_versions`         | Tenant + environment                            | restricted     | Immutable publication content/hash/author/review/effective/supersession metadata                               |
| `policy_rules`            | Tenant + environment                            | restricted     | Version/rule composite key; deterministic bounded condition AST and reason code                                |
| `approval_requests`       | Tenant + environment                            | restricted     | Exact action/resource/request/policy hashes, reason, approver scope, expiry, status                            |
| `approval_actions`        | Tenant + environment                            | restricted     | Append-only approve/deny/request-change/revoke/expire evidence                                                 |
| `support_access_grants`   | Tenant + environment                            | restricted     | Support principal, customer/resource scope, reason, step-up reference, issuer, start/expiry/revocation         |
| `configuration_sets`      | Tenant + environment                            | confidential   | Family and guarded active-version pointer                                                                      |
| `configuration_versions`  | Tenant + environment                            | restricted     | Immutable schema/canonical JSON/hash/validation/compatibility/approval metadata; secret references only        |
| `secret_references`       | Tenant + environment                            | restricted     | Opaque provider/path reference and lifecycle metadata; no secret material                                      |
| `audit_events`            | Tenant + environment                            | restricted     | Append-only actor/action/resource/reason/correlation/policy/request/outcome evidence                           |
| `idempotency_records`     | Tenant + environment                            | restricted     | Unique principal/command/key, request hash/result/expiry/state; conflicting hash rejected                      |
| `outbox_events`           | Tenant + environment                            | restricted     | Immutable canonical event envelope/payload; mutable lease/delivery state separated and guarded                 |
| `inbox_receipts`          | Tenant + environment                            | restricted     | Unique consumer/tenant/key, payload hash/result/status; conflicting duplicate rejected                         |
| `delivery_attempts`       | Tenant + environment                            | restricted     | Append-only target/attempt/timing/outcome/sanitized error/trace/retry evidence                                 |
| `jobs`                    | Tenant + environment                            | confidential   | Type/version/payload reference+hash/unique key/lease/progress/correlation; no raw secret payload               |
| `job_attempts`            | Tenant + environment                            | restricted     | Append-only attempt, timing, outcome, sanitized error, trace, result reference                                 |
| `evidence_manifests`      | Tenant/environment or explicit repository scope | restricted     | Source/worktree/policy/config/lock/check/artifact hashes; terminal completion invariant                        |
| `audit_exports`           | Tenant                                          | restricted     | Tenant filter/requester/count/schema/artifact checksum/classification/expiry/audit reference                   |
| `deployment_records`      | Deployment global                               | internal       | Local/preview/development only; revision/digest/migration/config/health/recovery/evidence; no production state |

The series creates exactly 38 tables: one migration ledger, 15 identity/tenancy
tables, and 22 control/evidence tables. `architecture_decision_records` remains a
repository-document index and is not a database table in Phase 1.

## Exact trigger inventory

Trigger names are `<table>__<control>` and are created in the same transaction as
their table before any runtime grant.

| Control                                                | Tables                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `touch_version` before update                          | `users`, `tenants`, `environments`, `tenant_members`, `teams`, `invitations`, `roles`, `session_records`, `service_identities`, `api_credentials`, `policy_sets`, `approval_requests`, `support_access_grants`, `configuration_sets`, `secret_references`, `idempotency_records`, `outbox_events`, `inbox_receipts`, `jobs` |
| `append_only` before update or delete                  | `authorization_decisions`, `approval_actions`, `audit_events`, `delivery_attempts`, `job_attempts`                                                                                                                                                                                                                          |
| `published_immutable` before update or delete          | `policy_versions`, `policy_rules`, `configuration_versions`, `capability_exposures` after publication/effectiveness                                                                                                                                                                                                         |
| `outbox_payload_immutable` before update or delete     | `outbox_events`                                                                                                                                                                                                                                                                                                             |
| `completed_evidence_immutable` before update or delete | `evidence_manifests` after `complete_pass`, `complete_fail`, or `incomplete`                                                                                                                                                                                                                                                |
| `secret_environment_guard` before insert or update     | `secret_references`, `configuration_versions`                                                                                                                                                                                                                                                                               |

Ordinary runtime roles have no `DELETE` or `TRUNCATE` grant on any table. Terminal
lifecycle state replaces physical deletion for tenant/member/invitation/role/
service/support/configuration records. No cascade may delete audit, decision,
approval, delivery-attempt, job-attempt, published-version, or completed-evidence
history.

## Exact RLS and privilege matrix

RLS is enabled and forced in the creating migration, before grants. Policies are
split by command; no policy uses `FOR ALL`, `USING (true)`, caller-supplied tenant
text, session JWT claims without API verification, or a table-owner runtime path.

| Family               | Tables                                                       | SELECT                                                                      | INSERT                                                                                | UPDATE                                                                      | DELETE |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Self identity        | `users`, `session_records`                                   | Current verified user only                                                  | API for current verified user only                                                    | API for current verified user, with protected auth/session fields immutable | none   |
| Global allowlist     | `permissions`, `capability_definitions`                      | API/worker read only                                                        | none                                                                                  | none                                                                        | none   |
| Tenant root          | `tenants`                                                    | `id = current_tenant_id()`                                                  | API only with `id = current_tenant_id()`                                              | same tenant plus version guard                                              | none   |
| Tenant               | Every table above scoped `Tenant`                            | Exact non-null `tenant_id = current_tenant_id()`                            | same `WITH CHECK`                                                                     | same `USING` and `WITH CHECK`, plus version/immutability guards             | none   |
| Tenant + environment | Every table above scoped `Tenant + environment`              | Exact non-null tenant and environment match                                 | same `WITH CHECK`                                                                     | same `USING` and `WITH CHECK`, plus version/immutability guards             | none   |
| Repository evidence  | `evidence_manifests` rows explicitly marked repository scope | `platform_evidence_reader` only with no tenant context and repository scope | controlled evidence worker only                                                       | terminal guard; collecting rows only                                        | none   |
| Deployment global    | `deployment_records`                                         | evidence reader for non-production records only                             | controlled evidence worker only, environment constrained to local/preview/development | none                                                                        | none   |
| Private ledger       | `foundation_migration_ledger`                                | migrator only                                                               | migrator only in migration transaction                                                | none                                                                        | none   |

`platform_api` receives select/insert/update only where the matrix allows.
`platform_worker` receives select/update on `jobs` and `outbox_events`, insert on
`inbox_receipts`, `delivery_attempts`, `job_attempts`, `audit_events`, and
`evidence_manifests`, and no cross-tenant scan. It must set and verify one tenant/
environment context before leasing work. `platform_evidence_reader` receives
select on tenant audit/evidence/export records only through forced RLS. Support
access never disables RLS; later support application logic must set the customer
tenant/environment context after validating the exact active grant.

## Empty and representative-prior test plan

T038 must create both named test files and capture the intended RED result before
any migration exists. No skipped or parser-only substitute can satisfy the real
PostgreSQL checks.

### `supabase/tests/000_foundation_migration_test.sql`

1. Assert the three exact migration ledger entries and checksums.
2. Assert the two schemas, six group roles, 18 functions, and 38 tables; reject
   any unreviewed object.
3. Assert role attributes: no login, superuser, createdb, createrole,
   replication, bypass-RLS, ownership, or public schema creation path.
4. Assert tenant/environment composite primary, unique, and foreign keys and
   reject cross-tenant/environment inserts for every relationship family.
5. Assert RLS enabled and forced on all scoped tables, command-specific policies,
   exact role grants, and no owner/bypass path.
6. Under two synthetic overlapping tenants, exercise select/insert/update/delete
   and prove every cross-tenant attempt fails without returning target data.
7. Assert update/delete rejection for append-only and published/terminal records,
   outbox payload immutability, version increments, idempotency hash conflicts,
   and secret-environment guards.
8. Assert missing, malformed, cleared, and leaked pooled request context fails
   closed.

### `tests/integration/migrations/foundation-migrations.test.ts`

1. **Empty state**: connect only after the disposable guard passes; apply 001,
   002, and 003 transactionally; run the SQL suite and record schema/role/policy
   digests.
2. **Representative prior state**: start from a fresh Supabase-compatible
   PostgreSQL database containing managed schemas plus an unrelated
   `public.platform_foundation_prior_probe` table with two synthetic rows and an
   unrelated role with no platform grants. Apply all three migrations and prove
   the probe table/rows/role and managed schemas are unchanged.
3. **Interrupted series**: commit 001-002, inject failure before 003 commit,
   verify 003 leaves no partial object, then apply the unchanged 003 and pass the
   complete suite.
4. **Rolling compatibility**: after each migration, verify all earlier objects
   remain valid and no drop, rename, type narrowing, `NOT NULL` without safe
   default/backfill, or runtime grant precedes RLS.
5. **Context leakage**: reuse one pooled connection across tenant A, cleared
   context, and tenant B transactions; prove no setting or row crosses the
   transaction boundary.
6. **Forward recovery**: simulate a post-commit verification failure, preserve
   evidence/backup, refuse an unreviewed down migration, and require a separately
   reviewed forward-fix checksum before proceeding.

The prior-state fixture is synthetic and contains no customer, production,
credential, or secret data. T038 must fail for missing migrations before T039;
T039-T041 then make the same unchanged tests pass. T042 seed work is separately
limited to deterministic synthetic identities and attack fixtures.

## Disposable target and safety guard

The only proposed application target is a user-provisioned, local, disposable
PostgreSQL 17/Supabase-compatible database with this exact identity:

| Property                                 | Required value                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Host                                     | literal loopback `127.0.0.1`                                                                               |
| Port                                     | `55432`                                                                                                    |
| Database                                 | `platform_foundation_hcp03`                                                                                |
| Database comment                         | `DISPOSABLE:002-platform-foundation:HCP-03`                                                                |
| Data                                     | synthetic test data only                                                                                   |
| Remote/project link                      | none                                                                                                       |
| Production/staging/customer connectivity | prohibited                                                                                                 |
| Connection input                         | `HCP03_DATABASE_URL`, supplied out of band; never printed, logged, committed, or read before authorization |

Before every schema, migration, backup, reset, or teardown command, a guard must
connect without echoing the URL and verify all of the following: exact database
name and comment; loopback server address; server version major 17; not in
recovery; no replication slots or subscriptions; no foreign servers; no
non-synthetic platform rows; and no environment marker matching staging or
production. Any mismatch stops all action.

No such target currently exists in the accessible environment. HCP-03 approval
does not provision it. If provisioning requires a PostgreSQL client, Supabase
CLI, image download, Docker integration, package, network origin, or container
definition, the exact operation remains blocked by HCP-01 and, when applicable,
HCP-04. T038 may be authored after approval, but no database command may run
until the target exists, the guard facts are recorded, and every required tool
has separate approval.

## Backup, application, rollback, and forward recovery

The executable paths and tool versions are intentionally unset because no
database tool is approved or usable. After a separate HCP-01 amendment, its exact
approved paths replace `<approved-pg17-bin>` without changing the arguments below.
No shell interpolation or pipeline is permitted; subprocess execution uses argv
arrays with `shell=False`.

1. Guard: `<approved-pg17-bin>/psql`, `--no-psqlrc`, `--set=ON_ERROR_STOP=1`,
   `--dbname=$HCP03_DATABASE_URL`, `--file=<guard.sql>`.
2. Backup before the first migration and before each retry:
   `<approved-pg17-bin>/pg_dump`, `--format=custom`, `--no-owner`, `--no-acl`,
   `--file=<repository-external-temp-path>`, `$HCP03_DATABASE_URL`; record the
   dump SHA-256 and guarded target facts without retaining credentials.
3. Apply each reviewed migration separately with `psql --single-transaction
--set=ON_ERROR_STOP=1 --file=<exact-reviewed-file>` and insert its source
   SHA-256 into the private ledger in the same transaction.
4. Verify after every commit with the unchanged T038 SQL and TypeScript suites;
   stop on the first failure and preserve sanitized output.
5. A failure before commit rolls back that migration transaction. A failure
   after commit never edits the applied file and never runs an invented down
   migration. Restore is permitted only to a newly created exact disposable
   target after the guard passes; otherwise create a separately reviewed
   forward-only recovery migration under a new HCP-03 amendment.
6. Teardown may drop only the exact guarded database
   `platform_foundation_hcp03` after evidence hashes are retained. This is a
   destructive action and is included in the requested HCP-03 decision only for
   that disposable target; no cluster, role outside the target inventory,
   volume, remote project, or other database may be deleted.

## Threats and review findings

| Threat                                | Required control                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Wrong-target or production connection | Literal loopback/name/comment/version guard; no remote link; fail before secret read or DDL                             |
| Runtime owner/BYPASSRLS escape        | NOLOGIN group roles, separate owner, forced RLS, catalog tests, no runtime membership in owner/migrator                 |
| Cross-tenant FK or query leak         | Composite tenant/environment keys plus command-specific forced RLS and two-tenant attack matrix                         |
| Pooled context leak                   | Transaction-local settings, clear/missing-context denial, reused-connection test                                        |
| Audit/evidence deletion               | No delete/truncate grant, append-only triggers, no cascades into evidence                                               |
| Secret/token persistence              | Verifier/hash/reference metadata only; constraints and scans reject plaintext-shaped values                             |
| Partial or incompatible migration     | One transaction per migration, ledger checksum, empty/prior/interrupted/rolling tests                                   |
| Unsafe reversal                       | No down migration; repository-external backup plus separately reviewed forward recovery                                 |
| Approval overreach                    | HCP-03 excludes tools, dependencies, image/network pulls, infrastructure, production, secrets, and later unrelated work |

## Expected effects and irreversible impact

If approved and later executed on the guarded target, the series creates the
reviewed schemas, roles, functions, triggers, policies, tables, indexes,
constraints, and grants. Migration ledger entries and append-only test evidence
are intentionally not rewritten. No customer data exists, no production system
is connected, and no public contract changes.

The migrations are additive and forward-only. Physical deletion is not a normal
rollback. Any post-commit defect is recovered on a fresh disposable target or by
an exact forward-fix amendment; this avoids pretending destructive reversal is
safe.

## Decision options

### Option A — approve exact scope

Approve the three-file migration series, 38-table inventory, six group roles, 18
functions, trigger/RLS/grant matrix, test plan, recovery rules, and exact guarded
disposable target above for T038-T042. This permits repository creation of the
reviewed tests, migrations, and synthetic seed only. Database application and
teardown occur only after the target facts and separately approved tool paths are
recorded. No change outside this exact scope is permitted.

### Option B — request changes

Keep HCP-03 pending and identify the exact table, role, function, trigger, policy,
classification, test, target, backup, rollback, or recovery change required.
T038-T042 remain blocked.

### Option C — deny

Do not create or apply the Phase 1 persistence foundation. T038-T042 and every
dependent database task remain blocked.

## Requested approval language

"Approve HCP-03 Option A and authorize T038-T042 exactly as recorded in
HCP-03-persistence.md, including the three forward-only migration files, exact
38-table/six-role/18-function/trigger/RLS/grant inventory, classification and
empty/prior/interrupted/forward-recovery tests, and the guarded local disposable
target at 127.0.0.1:55432/platform_foundation_hcp03. I understand that this does
not authorize a dependency or tool addition, image or network pull, container or
infrastructure change, secret access, repository-content upload, remote or
production database connection, public-contract change, or any application or
teardown until the target guard and separately approved tool paths are recorded."

## Decision record

- **Decision**: `approved_with_conditions` — Option A.
- **Approver**: User in Codex task.
- **Decision time**: 2026-07-13T03:45:11-07:00.
- **Approval statement**: "Approve HCP-03 Option A and authorize T038-T042
  exactly as recorded in HCP-03-persistence.md."
- **Conditions**: All recorded Option A boundaries remain binding. Repository
  creation of the exact T038-T042 tests, three migrations, and synthetic seed is
  authorized. Database application or teardown remains prohibited until the
  exact guarded target facts and separately approved database-tool paths are
  recorded. The decision grants no dependency/tool addition, image/network
  pull, container/infrastructure change, secret access, repository-content
  upload, remote or production database connection, public-contract change, or
  action outside T038-T042.
- **Rationale**: The user selected the exact reviewed Option A without an
  amendment.
- **Evidence**: `evidence/persistence/t036-hcp03-review.json` and
  `evidence/persistence/t037-hcp03-decision.json`.

## Invalidation conditions

Approval is invalidated by any migration filename/order/hash change; unlisted
schema, extension, role, grant, function, trigger, table, column family, index,
constraint, or RLS policy; changed classification or secret boundary; changed
test/recovery semantics; target host/port/name/comment/version/remote status;
tool path/version/origin change; destructive action outside the exact disposable
database; or any production/customer/live-data involvement.

## T038 RED result and grant-matrix amendment request

**Recorded**: 2026-07-13
**Amendment status**: `approved_with_conditions`
**Task boundary**: T039 bootstrap migration only

T038 is authored before any migration. The host Node.js 22.23.0 RED run executed
five tests: the attributable approval and SQL-suite completeness tests passed;
the other three failed on the exact missing migration inventory. No test was
skipped, no target attestation exists, and the guarded test failed before reading
`HCP03_DATABASE_URL` or starting a database command.

The real PostgreSQL test design exposed an internally inconsistent grant pair in
the approved record:

1. `platform_private.set_request_context(...)` is required to be executable by
   `platform_api` and `platform_worker`; and
2. the role/grant section says runtime roles receive no `USAGE` on
   `platform_private`.

PostgreSQL requires `USAGE` on a function's schema as well as `EXECUTE` on the
function for a direct qualified call. The exact approved pair therefore cannot
be implemented or pass the required runtime-role test. T039 must not silently
move the function, grant public access, use owner credentials, or omit the test.

### Proposed minimal amendment

For T039 only, replace the absolute private-schema `USAGE` prohibition with this
exact allowlist:

- grant `USAGE` on schema `platform_private` directly to `platform_api`,
  `platform_worker`, and `platform_evidence_reader`; keep it revoked from
  `PUBLIC`, `platform_runtime`, and every other role;
- grant `EXECUTE` on
  `platform_private.set_request_context(uuid,uuid,text,uuid,uuid,text,uuid)`
  directly to `platform_api` and `platform_worker`, but not to
  `platform_evidence_reader`;
- grant `EXECUTE` on `require_request_context()`, `tenant_matches(uuid)`, and
  `environment_matches(uuid,uuid)` directly to those three concrete roles for
  forced-RLS evaluation; and
- keep `CREATE`, all private table/sequence privileges, `clear_request_context`,
  and every trigger/immutability guard function unavailable to runtime roles.

This changes no schema, role attribute, table, function, trigger, RLS predicate,
dependency, target, command, or task. All other Option A conditions remain in
force. The amendment is invalidated by any broader schema privilege, function
execution grant, role, or task scope.

### Requested amendment language

"Approve the HCP-03 T039 private-schema grant amendment exactly as recorded in
HCP-03-persistence.md: direct `USAGE` on `platform_private` only for
`platform_api`, `platform_worker`, and `platform_evidence_reader`; direct
`EXECUTE` on `set_request_context` only for API/worker; direct `EXECUTE` on
`require_request_context`, `tenant_matches`, and `environment_matches` for those
three roles; no `CREATE`, private-table/sequence access, clear-context access,
trigger-function access, dependency/tool action, database execution, secret
access, infrastructure change, or later-task authorization. Retain all other
HCP-03 Option A conditions."

### Amendment decision record

- **Decision**: `approved_with_conditions` for the exact T039 private-schema
  grant amendment above.
- **Approver**: User in Codex task.
- **Decision time**: 2026-07-13T04:04:06-07:00.
- **Approval statement**: "Approve the HCP-03 T039 private-schema grant
  amendment exactly as recorded in HCP-03-persistence.md. Retain all other
  HCP-03 Option A conditions."
- **Authorized effect**: T039 may grant direct `USAGE` on `platform_private`
  only to `platform_api`, `platform_worker`, and
  `platform_evidence_reader`; direct execution of `set_request_context` only
  to API/worker; and direct execution of `require_request_context`,
  `tenant_matches`, and `environment_matches` to those three roles.
- **Retained conditions**: No runtime `CREATE`, private-table/sequence access,
  clear-context access, or trigger/immutability-function execution. All other
  HCP-03 Option A inventory, target, testing, recovery, and invalidation rules
  remain binding. Database application and teardown remain prohibited pending
  the exact guarded-target facts and separately approved PostgreSQL tool paths.
  No dependency/tool action, network/image pull, infrastructure change, secret
  access, repository-content upload, production/remote database action, public-
  contract change, or later-task authorization is granted.
- **Evidence**:
  `evidence/persistence/t039-private-schema-grant-amendment.json`.

### T039 repository materialization result

Migration 001 now exists at the exact approved path with source SHA-256
`64ea2b0977d24e6a576f010d6427eed0d0f33ecbff3a7792f7dbc3e05baddd45`.
Its source audit reports the exact two schemas, six group roles, one private
ledger table, 18 functions, zero extensions, and the amended private-function
allowlist. The unchanged T038 series suite remains RED only because T040-T041
have not materialized migrations 002-003. No target attestation, connection
input, PostgreSQL command, application, backup, or teardown was accessed.
Implementation evidence is retained in
`evidence/persistence/t039-foundation-bootstrap.json`.

### T040 repository materialization result

Migration 002 now exists at the exact approved path with source SHA-256
`d9ddb9a94f5073f58660981a7dffb438b6c36970647332754bd907990b4e8e43`.
Its source audit reports the exact 15 identity/tenancy tables, 14 forced-RLS
tables, 42 command-specific policies, ten approved version triggers, one listed
pending-invitation uniqueness index, and no added extension, role, or function.
The unchanged T038 series suite remains RED only because T041 has not
materialized migration 003. No target attestation, connection input, PostgreSQL
command, application, backup, or teardown was accessed. Implementation evidence
is retained in `evidence/persistence/t040-identity-tenancy-foundation.json`.

### T041 repository materialization result

Migration 003 now exists at the exact approved path with source SHA-256
`b4240adeb1e970fa82cc99c71b95b64db2f904127813342e282d9bf543106225`.
Its source audit reports the exact 22 control/evidence tables, 20 forced-RLS
tables, 51 command-specific policies, all 22 approved triggers, and no added
extension, role, or function. The unchanged T038 series suite passes all four
repository-only assertions and stops at the absent guarded-target attestation
before reading a connection input or starting a database command. No migration,
backup, teardown, or other database action was attempted. Implementation evidence
is retained in `evidence/persistence/t041-control-and-evidence-foundation.json`.

### T042 repository materialization result

The deterministic seed now exists at the exact approved path with source
SHA-256 `3776130e9b8adc7dc52bd4322f0bc8b661957651f7ac21208e55493f0144c0ac`.
It contains three synthetic identities, two overlapping tenant/environment
fixtures, mirrored team/role/service names, a shared cross-tenant user, and fixed
UUIDv7 attack-target references. Its source audit found no live identifiers,
credential/session/invitation/secret-reference rows, production or staging
markers, destructive SQL, or lockfile change. The seed was not applied and no
target attestation, connection input, PostgreSQL command, backup, or teardown was
accessed. Implementation evidence is retained in
`evidence/persistence/t042-foundation-test-data.json`.

## T054 persistence-conformance amendment proposal

**Status**: `awaiting_decision` (source-conformance proposal only; no database,
secret, cache, container, migration, backup, or teardown action has occurred).

The T054 audit found that the existing T038 harness cannot yet produce the
approved HCP-03 evidence. It performs one empty-target run, guards only once,
does not hash the backup, and omits the required representative-prior,
interrupted-series, rolling-compatibility, and forward-recovery scenarios. Its
`inet_server_addr() = 127.0.0.1` assertion is incompatible with a host
connection through the approved Docker-published loopback port. The following
source-only repair is the exact amendment required before any application
decision can be made.

### Exact source repair scope

After explicit approval, only these files may be changed:

- `tests/integration/migrations/foundation-migrations.test.ts`: replace the
  single-run harness with four deterministic phases—empty, representative prior
  state, interrupted 001/002 then unchanged 003, and rolling/forward-recovery—
  while retaining `shell:false`, argv-only subprocesses, the exact database name,
  comment, major 17, local-only target, no-repository-content evidence, and the
  existing migration source hashes. Every schema, backup, reset, retry, and
  teardown operation must rerun the sanitized target guard. The harness must
  record exact `/usr/bin/psql` and `/usr/bin/pg_dump` versions and SHA-256s from
  the approved PostgreSQL image/tool adapter, hash every custom-format backup,
  assert no non-synthetic rows or staging/production markers, and stop without
  inventing a down migration after a post-commit verification failure.
- `supabase/tests/000_foundation_migration_test.sql`: change only the transport
  assertion that incorrectly equates the server-side address with host
  loopback. Loopback is proven by the exact HCP-04 published binding and target
  attestation; the SQL suite must instead assert the guarded database identity,
  comment, major version, recovery/replication/foreign-server state, and all
  existing schema/RLS/grant invariants. No table, role, function, policy,
  migration order, seed, or public contract may change.
- `evidence/persistence/t054-hcp03-conformance-repair.json`: a sanitized,
  source-revision-bound record containing the repair diff hash, scenario list,
  expected command argv, and an explicit `not_applied` result. It must not
  contain `HCP03_DATABASE_URL`, passwords, raw environment values, raw logs, or
  customer/production data.

No migration SQL, seed SQL, manifest, lockfile, Docker definition, database
target, role inventory, grant, RLS rule, or HCP-02 contract is in this amendment.
The required Postgres comment bootstrap and in-container tool adapter are
cross-referenced in the separate HCP-04 source amendment and must not be
silently introduced here.

### Exact target, command, rollback, and later-application boundary

The eventual application target remains the existing exact disposable identity:
`127.0.0.1:55432/platform_foundation_hcp03`, database comment
`DISPOSABLE:002-platform-foundation:HCP-03`, PostgreSQL major 17, synthetic data
only, no remote/project link, and no production/staging/customer connectivity.
The current proposal does not authorize connecting to it. `HCP03_DATABASE_URL`
remains an out-of-band value that is never read, printed, logged, committed, or
placed in evidence.

When a later, separately approved application amendment exists, its only
permitted tool adapter will invoke the exact PostgreSQL image's `/usr/bin/psql`
and `/usr/bin/pg_dump` through the approved Docker executable with argv arrays
and `shell:false`; SQL is supplied as stdin or an exact reviewed file, not a
shell pipeline. The required order is: local context/port/image guard; database
comment bootstrap; full guard; custom-format backup and SHA-256; migration 001,
002, and 003 one transaction at a time; the four scenarios and unchanged SQL
suite; Valkey/runtime/telemetry gates; sanitized evidence; and only then the
project-scoped ordinary teardown without volume deletion. A pre-commit failure
rolls back its transaction. A post-commit failure preserves the backup and
requires a newly reviewed forward-fix checksum or a fresh exact disposable
target; no down migration, reset of an unguarded target, seed reapplication, or
volume deletion is allowed.

The source-repair verification for this amendment is limited to the existing
Node 24.18.0/pnpm 11.11.0 environment, static SQL/TypeScript checks, the
repository migration test in its guarded `not_applied` mode, and
`./scripts/verify-authority.sh` plus `./scripts/verify.sh`. It must not invoke
Docker/Compose, psql, pg_dump, a database/cache/container, or any network
request.

### Compatibility with HCP-02

The repair preserves the approved canonical contract and changes no operation,
schema, security rule, header, generated binding, or error shape. T051 health
handlers remain `getLiveness` and `getReadiness`, with mandatory
`X-Correlation-Id`, the closed `Health`/`ErrorResponse` schemas, and no invented
service credential or version header. The current HCP-02 OpenAPI server URL
(`http://localhost:8080`) versus HCP-04's published API port 3001 is recorded as
an HCP-04 port amendment, not changed by HCP-03.

### Exact approval statement

> Approve the HCP-03 T054 persistence-conformance amendment exactly as recorded
> in HCP-03-persistence.md. Authorize only the listed source/test/evidence
> repair, with the exact four guarded scenarios, backup hashing, transport-safe
> loopback guard, argv-only `shell:false` rules, and sanitized `not_applied`
> evidence. Retain the exact disposable target, migration inventory, roles,
> grants, forced-RLS rules, synthetic-only data, forward-only rollback policy,
> disabled lifecycle scripts, HCP-02 contracts, and every stated exclusion. This
> does not authorize HCP03_DATABASE_URL or any secret, database/cache/container
> access, psql/pg_dump/Docker/Compose command, migration/seed application,
> backup/restore/teardown, manifest or lockfile change, repository-content upload,
> production resource, or T055 and later.

### Decision record

- **Decision**: `approved_with_conditions` for the exact source-conformance,
  test, evidence, command, rollback, and exclusion scope above.
- **Approver**: user in Codex task.
- **Decision time**: 2026-07-13; the user supplied no clock time.
- **Approval statement**: the exact approval statement above, supplied by the
  user. Runtime application remains separately unapproved.
- **Invalidation**: any source path/hash, scenario, SQL assertion, tool path,
  target, credential input, migration, rollback, evidence, command, or exclusion
  change. A separate exact application decision remains mandatory after this
  repair and HCP-04 discovery facts are recorded.

## T054 runtime-application amendment draft

**Status**: `awaiting_exact_user_decision`  
**Prepared**: 2026-07-13  
**Runtime application authorized**: no

The approved source repair is complete and retained in
`evidence/persistence/t054-hcp03-conformance-repair.json` at SHA-256
`a88aee6e7941d38a86bff277d1bfd81aec286d4d74ea7d5d2040d2b83090de15`.
Its exact repaired source hashes are:

- `tests/integration/migrations/foundation-migrations.test.ts`:
  `ff02da0ba7b2d61869d00293a69b88f77c9a5f4d4cbb4cfedabb027e8b4adb83`;
- `supabase/tests/000_foundation_migration_test.sql`:
  `793dafe2261cdf8843a0303db7537ad6df4c3bbd952fea08175e9cfed091a957`.

The only proposed database target remains
`127.0.0.1:55432/platform_foundation_hcp03`, comment
`DISPOSABLE:002-platform-foundation:HCP-03`, PostgreSQL major 17, synthetic data
only. The only proposed adapter is Docker executable
`/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe` at SHA-256
`7bc66b018b9da43fea986f893288bb93970d3d1217f5063201fd97c827f20732`,
container `platform-foundation-local-postgres-1`, user `postgres`, and in-image
tools `/usr/bin/psql`, `/usr/bin/pg_dump`, and `/usr/bin/sha256sum`.

If approved, the amendment will
authorize only: tool version/hash attestation; the full guard; repository-
external custom-format backup and SHA-256; migrations 001-003 one transaction
at a time; empty, representative-prior, interrupted-series, and rolling/
forward-recovery scenarios; the unchanged SQL RLS/grant/runtime-role suite; and
sanitized exact-revision evidence. A pre-commit failure rolls back. A
post-commit failure preserves target and backup and requires a reviewed
forward-fix or a fresh exact disposable target. No down migration, unguarded
reset, restore, seed reapplication, or volume deletion is allowed.

### Resolved facts and application-time attestation

1. Resolved by the separately approved HCP-04 bootstrap: the exact Postgres
   image is present at digest
   `sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`.
2. Resolved by isolated `--network none` attestations: `/usr/bin/psql` is
   PostgreSQL 17.6 at SHA-256
   `96577e53f4c3558b7f27c5747b533bc7180a4b22a232e8a71af7724257d7efcc`,
   and `/usr/bin/pg_dump` is PostgreSQL 17.6 at SHA-256
   `858f1d46d266b6d3aa514e8483cd4d8ca43ac792b72451b448fcd00903b48eb4`.
3. Resolved after preparation: the user supplied and created the absolute
   repository-external backup directory
   `C:\Users\brand\codex-hitl-backups\t054`; only its existence was checked,
   and its contents were not inspected.
4. `evidence/persistence/hcp03-target-attestation.json` cannot truthfully be
   created until the approved HCP-04 application creates the target. The HCP-03
   application approval below would authorize creation of that sanitized
   attestation only after the exact comment, database, version, loopback,
   synthetic-only, role, and tool-hash guards pass.

### Exact runtime-application approval statement

> Approve the HCP-03 T054 runtime-application amendment exactly as recorded in
> HCP-03-persistence.md. Authorize access only to
> `127.0.0.1:55432/platform_foundation_hcp03` with comment
> `DISPOSABLE:002-platform-foundation:HCP-03`, PostgreSQL major 17, and
> synthetic-only guards; the recorded Docker adapter and exact `/usr/bin/psql`
> and `/usr/bin/pg_dump` paths, versions, and SHA-256 values; creation and
> hashing of a custom-format backup only under
> `C:\Users\brand\codex-hitl-backups\t054`; migrations 001-003; the exact
> empty, representative-prior, interrupted-series, and rolling/forward-recovery
> scenarios; RLS isolation, grants, runtime-role, migration conformance, and
> sanitized exact-revision evidence. Preserve the approved contracts,
> migrations, manifests, lockfile, lifecycle restrictions, source hashes, and
> all exclusions. A pre-commit failure must roll back; a post-commit failure
> must preserve the target and backup for a reviewed forward fix or use a fresh
> guarded disposable target. This does not authorize an invented down
> migration, unguarded reset, restore, seed reapplication, volume deletion,
> secret disclosure, non-loopback or non-synthetic database, production,
> repository upload, or T055 and later.

### Runtime-application decision record

- **Decision**: `approved_with_conditions` for the exact runtime-application
  statement above, bound to the pre-decision checkpoint SHA-256
  `37633a164300a0dab11c4207c53d0b6b9810445599a17b33f5553d92ea507787`.
- **Approver/time**: user in the Codex task; 2026-07-13 (no clock time supplied).
- **Application result**: `stopped_before_application`; the approval-bound
  `pnpm-lock.yaml` precondition failed before database access, backup,
  migration, or suite execution. Expected SHA-256
  `aae4996d4e996fe77311f88beeedb5934dcc18d42136ec9de0efa62cf2cdf4d3`;
  observed SHA-256
  `6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa`.
- **Invalidation**: any target, comment, version, synthetic guard, adapter/tool
  path or hash, backup path, migration/scenario, suite, recovery rule, source
  hash, command, evidence field, or exclusion change.
