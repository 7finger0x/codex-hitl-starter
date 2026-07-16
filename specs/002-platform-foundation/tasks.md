# Tasks: Platform Foundation

**Input**: Approved design documents in `specs/002-platform-foundation/`  
**Prerequisites**: Approved spec.md and plan.md; research.md, data-model.md, contracts/, and quickstart.md are planning inputs.  
**Status**: Validated task plan; implementation, GOV-01, and HCP-01 through HCP-08 are not authorized

All tasks start unchecked. Pre-existing or concurrently generated artifacts must
be inspected and accepted through the applicable task and checkpoint; their
presence alone is not completion evidence.

**Tests**: Required. Tests precede the behavior they validate and must demonstrate
the expected failure before implementation.

**Traceability**: Every task names its primary PF, SC, or HITL requirement. The
final graph must link each mandatory requirement to scenario, task, source or
migration, automated test, checklist item, evidence, and exact source revision.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: May run in parallel because it affects different files and has no
  dependency on another incomplete task in the phase.
- **[US1]`-`[US5]**: Maps to the five approved user stories.
- **HUMAN CHECKPOINT**: Stop. Do not begin any later task that depends on the
  checkpoint until the user approves the exact inventory/diff/target recorded in
  the named checkpoint artifact.
- A checkpoint approval is never inferred from approval of the specification,
  plan, tasks, or another checkpoint.

---

## Phase 1: Setup and Governance

**Purpose**: Establish durable authority, approvals, workspace boundaries, and
backward-compatible repository structure before product behavior changes.

- [x] T001 Inventory the current constitution gap, Spec Kit 0.12.10.dev0 installation, missing agent-context updater, mode-only/untracked files, all checkpoint records, and pre-existing checkpoint-tagged artifacts without treating any HCP as approved (PF-023, PF-028, PF-029) in `specs/002-platform-foundation/checkpoints/GOV-01-governance-baseline.md`
- [x] T002 Prepare the exact ten-article constitution amendment, official Spec Kit pin or approved official successor, supported agent-context update path, generated-file reconciliation, and clean/documented working-tree procedure with impact and recovery (PF-023, PF-028, PF-032) in `specs/002-platform-foundation/checkpoints/GOV-01-governance-baseline.md`
- [x] T003 HUMAN CHECKPOINT GOV-01: obtain and record explicit approval before amending the constitution, installing or replacing Spec Kit, changing durable agent context, or normalizing tracked/generated files (PF-023, PF-028, PF-032) in `specs/002-platform-foundation/checkpoints/GOV-01-governance-baseline.md`
- [x] T004 Apply the GOV-01-approved constitution amendment through speckit-constitution with version, rationale, impact, migration, template synchronization, and approval evidence (PF-028, PF-032) in `.specify/memory/constitution.md` and `.specify/templates/`
- [x] T005 Apply the GOV-01-approved working-tree reconciliation without installing or replacing tools: classify generated/mode-only files, preserve unaccepted HCP artifacts, run legacy verification, and retain the documented baseline (PF-023, PF-026, PF-029) in `specs/002-platform-foundation/checkpoints/GOV-01-governance-baseline.md` and `evidence/baseline/governance.json`
- [x] T006 Create the checkpoint decision ledger with scope, approver, exact artifacts, decision, time, expiry, and evidence fields for HCP-01 through HCP-08 (PF-016, PF-023, PF-028) in `specs/002-platform-foundation/checkpoints/README.md`
- [x] T007 [P] Create the requirement catalog for PF-001-PF-033, SC-001-SC-014, and HITL-001-HITL-018 with source locations and mandatory status (PF-027, PF-028) in `specs/002-platform-foundation/traceability/requirements.json`
- [x] T008 [P] Create the architecture-decision index with status, owner, review date, requirement links, and checksum fields (PF-032, SC-014) in `docs/adr/README.md`
- [x] T009 [P] Record ADR-0001 modular-monolith/API boundaries and extraction criteria with security impact and rollback (PF-031, PF-032) in `docs/adr/0001-modular-monolith-api-boundary.md`
- [x] T010 [P] Record ADR-0002 shared-schema tenancy, verified request context, composite keys, and forced RLS (PF-003, PF-011, PF-032) in `docs/adr/0002-shared-schema-tenancy-rls.md`
- [x] T011 [P] Record ADR-0003 REST/OpenAPI/JSON-Schema authority and compatibility rules (PF-021, PF-031, PF-032) in `docs/adr/0003-rest-json-schema-contracts.md`
- [x] T012 [P] Record ADR-0004 UUIDv7 identifiers and stable permission/event/error naming (PF-003, PF-019, PF-032) in `docs/adr/0004-canonical-identifiers.md`
- [x] T013 [P] Record ADR-0005 Postgres outbox/inbox delivery and future transport port (PF-019, PF-020, PF-032) in `docs/adr/0005-transactional-outbox-inbox.md`
- [x] T014 [P] Record ADR-0006 immutable policy/configuration activation and product-versus-engineering trust domains (PF-007, PF-015, PF-016, PF-032) in `docs/adr/0006-policy-configuration-versioning.md`
- [x] T015 [P] Record ADR-0007 cache tenant namespace, version binding, invalidation, and non-authoritative semantics (PF-010, PF-011, PF-032) in `docs/adr/0007-cache-isolation.md`
- [x] T016 [P] Record ADR-0008 OpenTelemetry signals and development observability topology (PF-022, PF-032) in `docs/adr/0008-observability-topology.md`
- [x] T017 [P] Record ADR-0009 Python HITL boundary, compatibility, audit migration, and production adapter path (PF-026, PF-027, PF-032) in `docs/adr/0009-codex-hitl-boundary.md`
- [x] T018 [P] Record ADR-0010 normative-source preservation choice, licensing/classification, and recovery path (PF-033, SC-014) in `docs/adr/0010-source-authority.md`
- [x] T019 Prepare the exact PDF/DOCX inventory, verified hashes, proposed repository paths or controlled immutable URIs, ownership, license, and classification for HCP-06 (PF-033) in `specs/002-platform-foundation/checkpoints/HCP-06-source-authority.md`
- [x] T020 HUMAN CHECKPOINT HCP-06: obtain and record explicit approval for the exact source-authority artifacts or resolvable manifest before copying or committing them (PF-033) in `specs/002-platform-foundation/checkpoints/HCP-06-source-authority.md`
- [x] T021 Preserve the HCP-06-approved normative artifacts or immutable controlled manifest and add deterministic hash verification (PF-033) in `docs/authority/final-production-paper-v3.manifest.json` and `scripts/verify-authority.sh`
- [x] T022 Build the exact dependency inventory with package purpose, version policy, license, provenance, maintenance status, vulnerability baseline, and removal path for HCP-01 (PF-023, PF-032) in `specs/002-platform-foundation/checkpoints/HCP-01-dependencies.md`
- [x] T023 HUMAN CHECKPOINT HCP-01: obtain and record explicit approval for the exact dependency and lockfile inventory before adding packages or tools (PF-023, PF-032) in `specs/002-platform-foundation/checkpoints/HCP-01-dependencies.md`
- [x] T024 Apply the GOV-01-selected and HCP-01-approved official Spec Kit pin, regenerate the supported integration and agent-context mechanism, and initialize the approved pnpm/Turborepo workspace with Node/Python engine constraints and deterministic scripts (PF-023, PF-026, PF-028, HITL-001, HITL-002) in `.specify/integration.json`, `.specify/scripts/`, `.agents/skills/`, `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and `.node-version`
- [x] T025 Create the Phase 1 runtime and package directory boundaries without empty future-application shells (PF-030, PF-031) in `apps/web/package.json`, `apps/api/package.json`, `apps/workers/package.json`, `packages/core/package.json`, `packages/identity/package.json`, `packages/policy/package.json`, `packages/config/package.json`, `packages/audit/package.json`, `packages/events/package.json`, `packages/observability/package.json`, `packages/ui/package.json`, and `packages/testing/package.json`
- [x] T026 [P] Add stricter directory instructions for API boundaries, migrations/RLS, infrastructure, and engineering policy without weakening root rules (HITL-002, PF-026) in `apps/api/AGENTS.md`, `supabase/AGENTS.md`, `infra/AGENTS.md`, and `tooling/codex-hitl/AGENTS.md`
- [x] T027 [P] Add no-clobber, supported-agent, active-feature, and repeated-run compatibility tests for the GOV-01-regenerated agent-context updater (HITL-001, HITL-002, PF-028) in `tests/compat/test_update_agent_context.py`
- [x] T028 [P] Update ignore rules for Node, Python, Supabase, coverage, Playwright, evidence, Terraform, containers, secrets, and generated artifacts without hiding controlled evidence (PF-017, PF-023) in `.gitignore`, `.dockerignore`, `.prettierignore`, and `.npmignore`
- [x] T029 Write a relocation compatibility test that imports `codex_hitl`, invokes the `codex-hitl` entry point, and runs the legacy ten-test baseline from the planned tool boundary (PF-026, HITL-011) in `tests/compat/test_codex_hitl_relocation.py`
- [x] T030 Move the Python package and tests into the dedicated engineering-control boundary while preserving import name, CLI name, policy path compatibility, and root verifier entry point (PF-026, HITL-016) in `tooling/codex-hitl/pyproject.toml`, `tooling/codex-hitl/src/codex_hitl/`, `tooling/codex-hitl/tests/`, and `scripts/verify.sh`
- [x] T031 Run the relocation compatibility and legacy suites and retain a baseline result that identifies the exact dirty-state classification without claiming Phase 1 completion (PF-026, PF-029, HITL-011) in `evidence/baseline/codex-hitl-relocation.json`

**Checkpoint**: Repository authority, governance, dependency approval, package
boundaries, and controller compatibility are established. No product schema,
public contract, or infrastructure implementation begins before Phase 2 gates.

---

## Phase 2: Foundational Controls (Blocking Prerequisites)

**Purpose**: Establish approved contracts, persistence/security foundations,
local infrastructure, shared primitives, and observable runtime skeletons.

**CRITICAL**: No user-story implementation begins until this phase passes.

- [x] T032 Prepare the proposed REST/event/configuration/capability/evidence/traceability contract diff; add or disposition custom-role, service-identity, environment-management, support-access, and evidence-run operations; reconcile the two superseded sketches; and document compatibility policy, consumers, threat model, and versioning review for HCP-02 (PF-006, PF-008, PF-012, PF-019, PF-021, PF-028, PF-031) in `specs/002-platform-foundation/checkpoints/HCP-02-public-contracts.md`
- [x] T033 HUMAN CHECKPOINT HCP-02: obtain and record explicit approval of the exact proposed public and cross-service contracts before treating them as implementation authority (PF-019, PF-021, PF-031) in `specs/002-platform-foundation/checkpoints/HCP-02-public-contracts.md`
- [x] T034 Write failing JSON Schema/OpenAPI completeness, compatibility, example, error-sanitization, and internal-reference tests covering every HCP-02-approved operation before publishing contract code (PF-006, PF-008, PF-012, PF-019, PF-021, PF-028) in `packages/testing/src/contracts/foundation-contracts.test.ts`
- [x] T035 Publish the HCP-02-approved schemas as the single contract source and generate typed API/event/config/evidence bindings without hand-edited generated output (PF-019, PF-021, PF-028) in `packages/core/src/contracts/`, `packages/core/src/generated/`, and `packages/core/scripts/generate-contracts.ts`
- [x] T036 Prepare the exact Phase 1 table/role/function/trigger/RLS migration inventory, data classification, empty/prior-state test plan, backup, rollback, forward recovery, and disposable target for HCP-03 (PF-003, PF-011, PF-013, PF-024) in `specs/002-platform-foundation/checkpoints/HCP-03-persistence.md`
- [x] T037 HUMAN CHECKPOINT HCP-03: obtain and record explicit approval for the exact persistence schema and disposable migration target before creating or applying migrations (PF-003, PF-011, PF-024) in `specs/002-platform-foundation/checkpoints/HCP-03-persistence.md`
- [x] T038 Write failing empty-schema, representative-prior-schema, runtime-role, forced-RLS, append-only, cross-tenant-FK, and forward-recovery tests before migrations (PF-003, PF-011, PF-013, PF-024) in `supabase/tests/000_foundation_migration_test.sql` and `tests/integration/migrations/foundation-migrations.test.ts`
- [x] T039 Implement the approved bootstrap schemas, migration ledger, extensions, owner/runtime roles, least-privilege grants, and request-context functions (PF-003, PF-009, PF-011, PF-024) in `supabase/migrations/202607100001_foundation_bootstrap.sql`
- [x] T040 Implement the complete Phase 1 identity, tenancy, permission, environment, membership, team, invitation, session, service-identity, API-credential, role, and assignment tables with composite tenant/environment keys, forced RLS, and no runtime owner/bypass path; this migration is the sole table owner for these entities (PF-001-PF-006, PF-011) in `supabase/migrations/202607100002_identity_tenancy_foundation.sql`
- [x] T041 Implement the complete Phase 1 append-only audit, idempotency, outbox/inbox, delivery, jobs, evidence, export, policy/configuration, approval, support-access, secret-reference, and capability tables with tenant/environment keys; this migration is the sole table owner for these entities (PF-012-PF-020, PF-029) in `supabase/migrations/202607100003_control_and_evidence_foundation.sql`
- [x] T042 Create deterministic synthetic local/CI seed identities, two overlapping tenants, environments, roles, service identities, and attack fixtures without live identifiers or secrets (PF-001, PF-002, PF-017, PF-018) in `supabase/seed/foundation-test-data.sql`
- [x] T043 Prepare the exact local/development container, ports, networks, volumes, Valkey, OTEL Collector, Prometheus, Loki, Tempo, Grafana, cost, security, teardown, and target inventory for HCP-04 (PF-022, PF-023) in `specs/002-platform-foundation/checkpoints/HCP-04-infrastructure.md`
- [x] T044 HUMAN CHECKPOINT HCP-04: obtain and record explicit approval for the exact infrastructure definitions and any local/development application target before creating or applying them (PF-022, PF-023) in `specs/002-platform-foundation/checkpoints/HCP-04-infrastructure.md`
- [x] T045 Implement the HCP-04-approved reproducible local container topology with named disposable volumes, non-root services, health checks, bounded resources, and no production credentials (PF-017, PF-018, PF-022, PF-023) in `compose.yaml`, `infra/environments/local/compose.override.yaml`, and `.env.example`
- [x] T046 [P] Configure vendor-neutral OTLP collection, metrics scraping, log ingestion, trace storage, redaction, dashboards, and alert rules (PF-013, PF-017, PF-022) in `infra/modules/observability/otel-collector.yaml`, `infra/modules/observability/prometheus.yaml`, `infra/modules/observability/loki.yaml`, `infra/modules/observability/tempo.yaml`, and `infra/modules/observability/grafana/`
- [x] T047 [P] Implement opaque UUIDv7 branded IDs, canonical serialization/hashing, UTC time, correlation, resource versions, and stable error primitives with property tests (PF-003, PF-019, PF-021) in `packages/core/src/ids.ts`, `packages/core/src/canonical-json.ts`, `packages/core/src/time.ts`, `packages/core/src/correlation.ts`, `packages/core/src/errors.ts`, and `packages/core/src/core.test.ts`
- [x] T048 [P] Implement structured logging, secret/credential redaction, trace/metric helpers, audit-versus-log separation, and health primitives with tests (PF-013, PF-017, PF-021, PF-022) in `packages/observability/src/index.ts`, `packages/observability/src/redaction.ts`, `packages/observability/src/health.ts`, and `packages/observability/src/observability.test.ts`
- [x] T049 [P] Implement tenant/environment/version namespaced Valkey cache ports, invalidation, collision protection, and fail-open-for-performance/fail-closed-for-authorization tests (PF-010, PF-011) in `packages/core/src/cache.ts` and `packages/testing/src/cache/cache-isolation.test.ts`
- [x] T050 Implement transaction-local verified request context, non-owner pooled database access, repository base class, expected-version guard, and pool-leakage tests (PF-003, PF-009, PF-011) in `apps/api/src/db/context.ts`, `apps/api/src/db/pool.ts`, `apps/api/src/db/repository.ts`, and `tests/integration/database/request-context.test.ts`
- [x] T051 Implement the Fastify API skeleton with complete schema validation, authentication hook, correlation, error mapping, idempotency hook, version headers, and `/health/live`/`ready` endpoints (PF-009, PF-021, PF-022) in `apps/api/src/app.ts`, `apps/api/src/plugins/authentication.ts`, `apps/api/src/plugins/request-context.ts`, `apps/api/src/plugins/errors.ts`, and `apps/api/src/routes/health.ts`
- [x] T052 [P] Implement the worker skeleton with tenant-context validation, leases, heartbeat, bounded retry, shutdown, and trace propagation (PF-003, PF-019, PF-020, PF-022) in `apps/workers/src/main.ts`, `apps/workers/src/worker.ts`, and `apps/workers/src/worker.test.ts`
- [x] T053 [P] Implement the accessible Next.js shell skeleton with authenticated/session states, tenant/environment banner, keyboard navigation, responsive landmarks, localization plumbing, and no static capability assumptions (PF-010, PF-025) in `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/platform-shell.tsx`, `apps/web/src/i18n/index.ts`, and `apps/web/src/styles/globals.css`
- [ ] T054 Run the complete foundational contract, migration, RLS, cache, runtime-role, health, telemetry, and legacy-controller gates and retain exact-revision evidence (PF-024, PF-026, PF-029) in `evidence/phases/phase-2-foundation.json`

**Checkpoint**: Approved contracts, real database isolation foundations, local
runtime services, observable API/worker/web shells, and exact baseline evidence
exist. User-story phases may now begin in priority order.

---

## Phase 3: User Story 1 - Establish an Isolated Organization (Priority: P1) MVP

**Goal**: An authenticated user creates or joins tenants and receives independent
membership, role, environment, resource, and service-identity scope with proven
cross-tenant isolation.

**Independent Test**: Create two organizations with overlapping users/resource
names; prove allowed operations work and every prohibited read/write/function/
storage/cache/job/export/audit path is denied without target disclosure.

### Tests for User Story 1

- [ ] T055 [P] [US1] Write failing contract tests for session, tenant creation/listing, context selection, invitations, and role-assignment endpoints (PF-001, PF-002, PF-004) in `tests/contract/api/identity-tenancy.contract.test.ts`
- [ ] T056 [P] [US1] Write failing real-Postgres RLS tests for tenants, users, memberships, environments, teams, roles, invitations, sessions, and service identities (PF-003, PF-011, SC-001) in `supabase/tests/010_identity_tenancy_rls_test.sql`
- [ ] T057 [P] [US1] Write failing cross-tenant matrix tests for select/insert/update/delete/function/storage/cache/job/export/audit access and opaque denial responses (PF-011, SC-001) in `packages/testing/src/tenancy/cross-tenant-matrix.test.ts`
- [ ] T058 [P] [US1] Write failing tenant-creation atomicity tests for tenant, owner, default environment, baseline config/capabilities, audit, and outbox rollback (PF-001, PF-013, SC-004) in `tests/integration/identity/create-tenant.test.ts`
- [ ] T059 [P] [US1] Write failing concurrent duplicate-invitation, token-hash, expiry, acceptance, and role-scope tests (PF-002, PF-007) in `tests/integration/identity/invitations.test.ts`
- [ ] T060 [P] [US1] Write failing multi-tenant context-switch and active-job/session invalidation tests (PF-002, PF-004, PF-010) in `tests/integration/identity/context-switch.test.ts`
- [ ] T061 [P] [US1] Write failing service-identity/API-credential tests for human-session rejection, tenant/environment/resource/action scope, hash, expiry, replay, and revocation (PF-005, PF-006, PF-017) in `tests/integration/identity/service-identities.test.ts`
- [ ] T062 [P] [US1] Write the failing keyboard-accessible tenant onboarding E2E journey with a ten-minute measured budget (PF-001, PF-025, SC-003, SC-013) in `tests/e2e/tenant-onboarding.spec.ts`

### Implementation for User Story 1

- [ ] T063 [US1] Add tenant-lifecycle transaction functions, story-specific RLS policies, invariants, indexes, and onboarding/role-assignment constraints against the foundational identity tables without recreating any table (PF-001-PF-006, PF-011) in `supabase/migrations/202607100010_identity_tenancy_workflows.sql`
- [ ] T064 [P] [US1] Implement identity/tenancy entity schemas, state transitions, invariants, and branded view models (PF-001-PF-006) in `packages/identity/src/model.ts`, `packages/identity/src/states.ts`, and `packages/identity/src/model.test.ts`
- [ ] T065 [US1] Implement tenant-aware repositories with composite keys, forced-RLS contexts, optimistic concurrency, and no cross-domain writes (PF-002, PF-003, PF-011) in `packages/identity/src/repositories.ts`
- [ ] T066 [US1] Implement atomic tenant creation with owner membership, default environment, baseline configuration/capability versions, mandatory audit, idempotency, and outbox event (PF-001, PF-013, PF-019, SC-004) in `packages/identity/src/create-tenant.ts`
- [ ] T067 [US1] Implement invitation creation/acceptance/revocation with normalized target, keyed verifier, expiry, duplicate handling, role/environment scope, and audit (PF-002, PF-007, PF-013) in `packages/identity/src/invitations.ts`
- [ ] T068 [US1] Implement authoritative session history/revocation, active tenant/environment selection, authentication-strength representation, and context recalculation (PF-002, PF-004, PF-005, PF-010) in `packages/identity/src/sessions.ts`
- [ ] T069 [US1] Implement distinct service identities and hashed scoped API credentials with expiry/revocation and secret-safe issuance (PF-006, PF-017) in `packages/identity/src/service-identities.ts`
- [ ] T070 [US1] Implement approved REST routes for session, tenants, context, invitations, memberships, environments, roles, and service identities with stable opaque errors (PF-001-PF-006, PF-021) in `apps/api/src/routes/identity.ts` and `apps/api/src/routes/tenancy.ts`
- [ ] T071 [P] [US1] Implement accessible organization creation, tenant/environment switcher, invitation, membership, and role-assignment UI using authoritative API view models (PF-002, PF-004, PF-025) in `apps/web/src/app/onboarding/`, `apps/web/src/app/admin/members/`, and `apps/web/src/components/tenant-switcher.tsx`
- [ ] T072 [US1] Implement tenant-isolated storage key/policy helpers and synthetic object-access fixtures for the cross-tenant matrix (PF-003, PF-011, PF-017) in `packages/identity/src/storage-scope.ts` and `supabase/tests/fixtures/storage.sql`
- [ ] T073 [US1] Pass all US1 contract, RLS, cross-tenant, concurrency, service-identity, integration, E2E, accessibility, and timing tests and retain the independent story evidence (SC-001, SC-003, SC-013) in `evidence/stories/us1-isolated-organization.json`

**Checkpoint**: User Story 1 is independently functional and accepted as the
Phase 1 MVP foundation. No other story evidence may substitute for its isolation
matrix.

---

## Phase 4: User Story 2 - Access Only Authorized Capabilities (Priority: P1)

**Goal**: The platform shell and every protected action use current membership,
role, resource, environment, authentication, approval, configuration, and policy
context, with stable fail-closed decisions.

**Independent Test**: Exercise the same actions across representative roles,
environments, resources, authentication strengths, and policy versions; verify UI
capability discovery and authoritative API enforcement agree exactly.

### Tests for User Story 2

- [ ] T074 [P] [US2] Write failing deterministic/property tests for allow/require_approval/deny, deny precedence, priority/lexical tie-breaking, unknown conditions, invalid policy, and canonical input hashes (PF-007, PF-009) in `packages/policy/src/evaluator.test.ts`
- [ ] T075 [P] [US2] Write failing authorization matrix tests for system/custom roles, explicit grants/denials, team/resource/environment scope, authentication strength, approval evidence, and membership status (PF-007, PF-008, PF-009, SC-002) in `packages/testing/src/authorization/authorization-matrix.test.ts`
- [ ] T076 [P] [US2] Write failing capability-manifest schema/signature/expiry tests and UI/API decision-consistency tests (PF-010, PF-030, SC-002) in `tests/contract/capability-manifest.contract.test.ts` and `tests/integration/authorization/capability-consistency.test.ts`
- [ ] T077 [P] [US2] Write failing direct-action denial tests for hidden actions, opaque cross-tenant targets, stable error/correlation/retry guidance, and decision audit (PF-009, PF-010, PF-021) in `tests/integration/authorization/direct-action-denial.test.ts`
- [ ] T078 [P] [US2] Write failing stale-role/membership/policy/configuration/capability/cache invalidation tests proving the next request cannot use revoked authority (PF-009, PF-010) in `tests/integration/authorization/stale-authority.test.ts`
- [ ] T079 [P] [US2] Write failing step-up and exact approval-binding tests for high-risk actions, changed resource versions, expiry, revocation, and replay (PF-005, PF-007, PF-016) in `tests/integration/authorization/step-up-approval.test.ts`
- [ ] T080 [P] [US2] Write the failing keyboard/responsive capability-aware shell E2E journey including direct API bypass attempts (PF-010, PF-025, SC-013) in `tests/e2e/capability-shell.spec.ts`

### Implementation for User Story 2

- [ ] T081 [US2] Add deterministic authorization-decision, approval-binding, capability-derivation, role/grant lookup functions, story-specific RLS policies, and performance indexes against the foundational control tables without recreating any table (PF-007-PF-010, PF-015, PF-016) in `supabase/migrations/202607100020_authorization_capability_workflows.sql`
- [ ] T082 [US2] Implement the pure deterministic RBAC/ABAC evaluator with canonical input, deny precedence, exact decision vocabulary, matched-rule evidence, policy hash, and fail-closed validation (PF-007, PF-009) in `packages/policy/src/evaluator.ts`, `packages/policy/src/schema.ts`, and `packages/policy/src/decision.ts`
- [ ] T083 [US2] Implement custom role/permission bundles, explicit denies, environment/team/resource scopes, and immutable assignment versioning (PF-007, PF-008) in `packages/policy/src/roles.ts` and `packages/policy/src/grants.ts`
- [ ] T084 [US2] Implement exact product approval requests/actions with version binding, step-up evidence, expiry, revocation, replay protection, and separation from engineering tokens (PF-007, PF-016) in `packages/policy/src/approvals.ts`
- [ ] T085 [US2] Implement signed capability derivation from current authoritative membership, role, exposure, policy, and configuration versions without granting authority (PF-010, PF-030) in `packages/policy/src/capabilities.ts`
- [ ] T086 [US2] Implement API authorization hooks and domain guards that independently re-evaluate every protected command and emit stable denial/audit evidence (PF-009, PF-010, PF-013, PF-021) in `apps/api/src/plugins/authorization.ts` and `apps/api/src/authorization/guard.ts`
- [ ] T087 [US2] Implement authorization-version cache keys, revocation invalidation, bounded TTL, and next-request freshness rules without caching approval as authority (PF-009, PF-010, PF-011) in `apps/api/src/authorization/cache.ts`
- [ ] T088 [US2] Implement approved role, permission, approval, authorization-evaluation, and capability endpoints with optimistic concurrency (PF-007-PF-010, PF-021) in `apps/api/src/routes/authorization.ts` and `apps/api/src/routes/capabilities.ts`
- [ ] T089 [P] [US2] Implement capability-generated navigation, action states, denial/correlation presentation, and step-up/approval workflow UI (PF-010, PF-025) in `apps/web/src/components/capability-navigation.tsx`, `apps/web/src/components/authorized-action.tsx`, and `apps/web/src/app/admin/roles/`
- [ ] T090 [US2] Pass the deterministic policy, authorization matrix, stale-access, direct-denial, capability consistency, E2E, accessibility, and latency suites and retain independent evidence (SC-002, SC-005, SC-013) in `evidence/stories/us2-authorized-capabilities.json`

**Checkpoint**: User Stories 1 and 2 work independently; visible capabilities and
authoritative decisions agree for the complete tested matrix.

---

## Phase 5: User Story 3 - Review Complete Operational Evidence (Priority: P1)

**Goal**: Reviewers reconstruct sensitive mutations and authorization decisions
from tenant-isolated, append-only, complete evidence; sensitive mutations fail
closed when mandatory audit persistence fails.

**Independent Test**: Perform identity, authorization, configuration, support, and
administrative changes, then reconstruct each decision using only retained audit
and evidence records.

### Tests for User Story 3

- [ ] T091 [P] [US3] Write failing append-only database tests for audit insert-only grants, update/delete rejection, protected snapshots, required fields, and restart durability (PF-013, PF-014, SC-004) in `supabase/tests/030_audit_append_only_test.sql`
- [ ] T092 [P] [US3] Write failing transaction fault-injection tests proving every sensitive mutation rolls back when audit or outbox persistence fails (PF-013, SC-004) in `tests/integration/audit/fail-closed-audit.test.ts`
- [ ] T093 [P] [US3] Write failing tenant-isolated audit search, cursor pagination, filter, export checksum/schema/lineage, and opaque-denial tests (PF-014, SC-001) in `tests/integration/audit/search-export.test.ts`
- [ ] T094 [P] [US3] Write failing configuration/policy version tests for schema validation, compatibility, attribution, approval, atomic activation, unknown versions, and unchanged active pointer on failure (PF-015, PF-016) in `tests/integration/config/configuration-publication.test.ts`
- [ ] T095 [P] [US3] Write failing secret-reference boundary tests across API/UI/log/trace/error/analytics/export/fixture/AI-context serializers and production-to-lower-environment rejection (PF-017, PF-018, SC-010) in `packages/testing/src/security/secret-boundaries.test.ts`
- [ ] T096 [P] [US3] Write failing privileged-support lifecycle tests for separate role, reason, step-up, customer/resource scope, expiry, revocation, next-request denial, and full audit (PF-012, PF-013) in `tests/integration/authorization/support-access.test.ts`
- [ ] T097 [P] [US3] Write the failing reviewer E2E journey for evidence reconstruction, tenant-isolated search/export, and expired support access (PF-012-PF-016) in `tests/e2e/operational-evidence.spec.ts`

### Implementation for User Story 3

- [ ] T098 [US3] Add append-only enforcement triggers, audit search/export functions, atomic configuration/policy activation, support-access expiry guards, secret-reference environment guards, story-specific RLS policies, and indexes against foundational tables without recreating any table (PF-012-PF-018) in `supabase/migrations/202607100030_audit_configuration_workflows.sql`
- [ ] T099 [US3] Implement mandatory transaction-bound audit writing with complete actor/tenant/environment/resource/action/reason/correlation/decision/policy/outcome/time fields and fail-closed errors (PF-013, SC-004) in `packages/audit/src/writer.ts` and `packages/audit/src/schema.ts`
- [ ] T100 [US3] Implement tenant-isolated audit query, opaque cursor pagination, integrity metadata, protected snapshots, and async export manifests (PF-014) in `packages/audit/src/query.ts`, `packages/audit/src/export.ts`, and `apps/workers/src/jobs/audit-export.ts`
- [ ] T101 [US3] Implement immutable schema-validated configuration versions, compatibility checks, exact approval binding, and atomic active-pointer changes (PF-015, PF-016) in `packages/config/src/versions.ts`, `packages/config/src/validation.ts`, and `packages/config/src/activation.ts`
- [ ] T102 [US3] Implement opaque secret-reference value objects, environment-classification guards, and universal redaction/serialization rejection (PF-017, PF-018) in `packages/config/src/secret-reference.ts` and `packages/observability/src/secret-redaction.ts`
- [ ] T103 [US3] Implement privileged support request/grant/use/revoke/expire services with fresh evaluation and immutable lifecycle audit (PF-012, PF-013) in `packages/policy/src/support-access.ts`
- [ ] T104 [US3] Implement approved configuration, policy publication, audit search/export, secret-reference metadata, and support-access API routes (PF-012-PF-018, PF-021) in `apps/api/src/routes/configuration.ts`, `apps/api/src/routes/audit.ts`, and `apps/api/src/routes/support-access.ts`
- [ ] T105 [P] [US3] Implement accessible configuration publication, audit explorer/export, decision timeline, and support-access UI with classification-safe rendering (PF-012, PF-014, PF-015, PF-025) in `apps/web/src/app/admin/configuration/`, `apps/web/src/app/operations/audit/`, and `apps/web/src/app/admin/support-access/`
- [ ] T106 [US3] Pass append-only, fault-injection, isolation/export, configuration, secret, support, E2E, accessibility, and security tests and retain independent evidence (SC-004, SC-010, SC-013) in `evidence/stories/us3-operational-evidence.json`

**Checkpoint**: Sensitive state cannot diverge from mandatory audit/outbox evidence,
and a tenant reviewer can reconstruct complete authorized history without leakage.

---

## Phase 6: User Story 4 - Operate a Verifiable Development Foundation (Priority: P2)

**Goal**: Operators initialize, validate, deploy, observe, diagnose, recover, and
produce exact-revision evidence for the platform and the preserved HITL controller.

**Independent Test**: From a clean environment, initialize the platform, validate
configuration and migrations, deploy to development, induce a controlled failure,
diagnose and recover from telemetry/runbooks, and generate a complete manifest.

### Tests for User Story 4 - Platform Operations

- [ ] T107 [P] [US4] Write failing event-envelope contract tests for every PF-019 field, schema compatibility, sanitized payloads, and stable event naming (PF-019) in `tests/contract/events/domain-event.contract.test.ts`
- [ ] T108 [P] [US4] Write failing outbox/inbox tests for atomic state/audit/event writes, leases, duplicate delivery, hash conflict, crash-after-publish uncertainty, reconciliation, retry, and dead letter (PF-019, PF-020) in `tests/integration/events/outbox-inbox.test.ts`
- [ ] T109 [P] [US4] Write failing tenant-aware job tests for unique keys, context verification, leases, heartbeat, cancellation, bounded retry, progress, and abandoned recovery (PF-003, PF-020, PF-023) in `tests/integration/workers/jobs.test.ts`
- [ ] T110 [P] [US4] Write failing health/log/metric/trace/alert correlation and redaction tests for API, transaction, event, worker, cache, and controlled dependency failures (PF-017, PF-021, PF-022) in `tests/integration/observability/correlation.test.ts`
- [ ] T111 [P] [US4] Write failing bootstrap/configuration/migration/deployment/recovery evidence tests for clean and representative prior states (PF-023, PF-024, SC-006) in `tests/recovery/foundation-lifecycle.test.ts`
- [ ] T112 [P] [US4] Write failing performance tests for SC-005 landing latency, API read/write budgets, authorization overhead, outbox age, and million-row audit queries (PF-022, SC-005) in `tests/performance/foundation.js`
- [ ] T113 [P] [US4] Write the failing operator E2E failure-diagnosis/recovery journey with owner/runbook discovery under five minutes (PF-022, PF-023, SC-008) in `tests/e2e/operator-recovery.spec.ts`

### Tests for User Story 4 - HITL-001 through HITL-018

- [ ] T114 [P] [US4] Write failing Spec Kit parse, checklist, requirement/task/source/test/evidence, duplicate/dangling, protected-source, and revision-mismatch traceability tests (PF-027, PF-028, HITL-001, HITL-010) in `tooling/codex-hitl/tests/test_traceability.py`
- [ ] T115 [P] [US4] Write failing AGENTS instruction-discovery and precedence tests for root/API/migration/infrastructure/tooling working directories (HITL-002) in `tooling/codex-hitl/tests/test_instructions.py`
- [ ] T116 [P] [US4] Write failing engineering-policy tests for canonical requests, invalid TOML/schema, allow/require_approval/deny, deny precedence, all matched rules, priority/lexical rationale, default, hashes, and deterministic repeats (HITL-003, HITL-004) in `tooling/codex-hitl/tests/test_policy_v2.py`
- [ ] T117 [P] [US4] Write failing approval tests for 256-bit generation, keyed verifier, constant-time compare, exact request/policy/repository/branch/actor binding, expiry, mismatch, revocation, replay, atomic concurrency, and redaction (HITL-005) in `tooling/codex-hitl/tests/test_approvals.py`
- [ ] T118 [P] [US4] Write failing persisted workflow tests for every normative state/transition, invalid transition immutability, sequence/version concurrency, retry linkage, restart durability, and audit (HITL-006) in `tooling/codex-hitl/tests/test_workflow.py`
- [ ] T119 [P] [US4] Write failing SQLite migration/audit tests for required tables, FKs, WAL/busy timeout, append-only update/delete rejection, sanitized export, backup/recovery, and production-adapter mapping (HITL-007, HITL-018) in `tooling/codex-hitl/tests/test_audit.py`
- [ ] T120 [P] [US4] Write failing executor tests for argv-only shell-false operation, executable/path/workspace/env validation, stdin policy, concurrent bounded streams, truncation hashes, timeout/grace/kill process group, cancellation, binary output, and descendants (HITL-008, HITL-009) in `tooling/codex-hitl/tests/test_executor_v2.py`
- [ ] T121 [P] [US4] Write failing CLI/evidence tests for the normative command surface, JSON plus readable verification, mandatory-check skip behavior, dirty-state classification, hashes, and false completion-claim rejection (HITL-016) in `tooling/codex-hitl/tests/test_cli_verify.py`
- [ ] T122 [P] [US4] Write failing Docker and sandbox-profile tests for a reproducible pinned non-root image, offline smoke, bounded runtime, and documented workspace-write/on-request defaults (HITL-013, HITL-017) in `tests/container/test_container_smoke.py` and `tooling/codex-hitl/tests/test_sandbox_profile.py`

### Implementation for User Story 4 - Events and Operations

- [ ] T123 [US4] Implement the approved immutable event envelope, outbox repository, leased dispatcher, inbox deduplication, delivery attempts, uncertainty reconciliation, and dead-letter visibility (PF-019, PF-020) in `packages/events/src/envelope.ts`, `packages/events/src/outbox.ts`, `packages/events/src/inbox.ts`, `packages/events/src/dispatcher.ts`, and `packages/events/src/reconciliation.ts`
- [ ] T124 [US4] Implement worker handlers for outbox publication, evidence generation, audit export, reconciliation, and retry with tenant context and trace propagation (PF-003, PF-020, PF-022) in `apps/workers/src/jobs/`
- [ ] T125 [US4] Implement versioned environment configuration validation and startup refusal for unknown/incompatible versions without partial activation (PF-015, PF-023) in `packages/config/src/environment.ts` and `apps/api/src/startup.ts`
- [ ] T126 [US4] Implement actionable health/readiness/dependency status, service catalog metadata, metrics, traces, JSON logs, alert links, and ownership endpoints (PF-021, PF-022) in `packages/observability/src/service.ts`, `apps/api/src/routes/operations.ts`, and `docs/operations/service-catalog.yaml`
- [ ] T127 [US4] Implement deterministic host bootstrap, locked install, local database reset/upgrade validation, seed, service start/stop, teardown guards, and machine-readable results (PF-023, SC-006) in `scripts/bootstrap.sh`, `scripts/environment.sh`, and `scripts/validate-environment.ts`
- [ ] T128 [P] [US4] Document and test database/app/config/worker/cache rollback and forward-recovery paths, including unsafe-reversal decision points (PF-023, PF-024) in `docs/runbooks/foundation-recovery.md` and `tests/recovery/runbook-contract.test.ts`
- [ ] T129 [P] [US4] Implement development deployment manifests that consume CI-built digests, schema/config versions, health gates, rollback metadata, and no embedded secrets (PF-017, PF-023) in `infra/environments/development/` and `scripts/deploy-development.ts`

### HUMAN CHECKPOINT and Implementation for User Story 4 - Engineering Control

- [ ] T130 [US4] Prepare the exact `policy.toml` schema/rule diff, canonical request format, approval verifier/migration, workflow/audit migration, executor bounds, compatibility, security review, and rollback for HCP-05 (PF-026, PF-027, HITL-003-HITL-009) in `specs/002-platform-foundation/checkpoints/HCP-05-engineering-policy.md`
- [ ] T131 [US4] HUMAN CHECKPOINT HCP-05: obtain and record explicit approval before changing engineering policy or approval/execution semantics (PF-026, PF-027) in `specs/002-platform-foundation/checkpoints/HCP-05-engineering-policy.md`
- [ ] T132 [US4] Implement canonical engineering action requests, deterministic TOML schema/evaluator, deny precedence, hashes, fail-closed validation, and full decision evidence (HITL-003, HITL-004) in `tooling/codex-hitl/src/codex_hitl/models.py`, `tooling/codex-hitl/src/codex_hitl/config.py`, `tooling/codex-hitl/src/codex_hitl/policy.py`, `policies/default.toml`, and `policies/schema.json`
- [ ] T133 [US4] Implement keyed, exact-request-scoped, expiring, revocable, atomically consumed approval requests/tokens with secure redaction and migration (HITL-005) in `tooling/codex-hitl/src/codex_hitl/approvals.py` and `tooling/codex-hitl/src/codex_hitl/migrations/002_approvals.sql`
- [ ] T134 [US4] Implement the normative persisted workflow state machine with one validator, optimistic concurrency, ordered transitions, retry linkage, and immutable audit (HITL-006) in `tooling/codex-hitl/src/codex_hitl/workflow.py` and `tooling/codex-hitl/src/codex_hitl/migrations/003_workflows.sql`
- [ ] T135 [US4] Implement SQLite migrations, required history tables, WAL/FKs/busy timeout, append-only triggers, sanitized export, backup/recovery, and Postgres production-adapter contract (HITL-007, HITL-018) in `tooling/codex-hitl/src/codex_hitl/audit.py`, `tooling/codex-hitl/src/codex_hitl/migrations/`, and `tooling/codex-hitl/src/codex_hitl/adapters/postgres.py`
- [ ] T136 [US4] Implement argv-only bounded execution with approved executable/path/workspace/env/input validation, concurrent capped streams, hashes, process-group timeout/cancel, resource metadata, and post-checks (HITL-008, HITL-009) in `tooling/codex-hitl/src/codex_hitl/executor.py`
- [ ] T137 [US4] Implement complete traceability parsing/validation and JSON plus Markdown reports across PF/HITL/SC, tasks, source, migrations, tests, checklists, evidence, policy/lock hashes, and revision (PF-028, HITL-001, HITL-010) in `tooling/codex-hitl/src/codex_hitl/traceability.py` and `scripts/validate-traceability.py`
- [ ] T138 [US4] Implement the normative `codex-hitl init/verify/policy evaluate/approval request/grant` CLI while preserving legacy aliases and refusing false PASS on skipped/unavailable mandatory evidence (HITL-016) in `tooling/codex-hitl/src/codex_hitl/cli.py`
- [ ] T139 [P] [US4] Document and verify repository instruction precedence, recommended Codex sandbox/approval mode, enterprise identity/audit/secrets/sandbox adapters, and local SQLite limitations (HITL-002, HITL-017, HITL-018) in `docs/security/codex-hitl-threat-model.md`, `docs/runbooks/codex-hitl-operations.md`, and `docs/architecture/codex-hitl-production-adapters.md`
- [ ] T140 [US4] Upgrade the root single verification command to run format/lint/type/unit/integration/RLS/contract/E2E/security/dependency/performance/accessibility/recovery/container/traceability checks and emit schema-valid evidence without hiding skips (PF-027-PF-029, HITL-011, HITL-016) in `scripts/verify.sh` and `tooling/codex-hitl/src/codex_hitl/verification.py`
- [ ] T141 [US4] Upgrade CI to actual protected-branch triggers, locked installs, full Python/Node/database/browser matrices, security/SBOM/container smoke, evidence upload, and no production deployment (HITL-012, PF-023, PF-029) in `.github/workflows/ci.yml`, `.github/workflows/security.yml`, and `.github/workflows/evidence.yml`
- [ ] T142 [US4] Replace the starter container with pinned reproducible non-root workspace verifier/runtime targets and an offline HITL smoke test (HITL-013) in `Dockerfile` and `scripts/container-smoke.sh`
- [ ] T143 [P] [US4] Update supported versions, vulnerability reporting, incident contacts/ownership, secret handling, and recovery guidance (HITL-014, PF-017, PF-022) in `SECURITY.md` and `docs/runbooks/security-incident.md`
- [ ] T144 [US4] Generate a schema-valid evidence manifest that binds exact revision, documented worktree state, policy/config/lock/schema hashes, all checks, warnings/failures, artifacts, and result (PF-029, HITL-015, HITL-016) in `evidence/verification.json` and `evidence/verification.md`
- [ ] T145 [US4] Execute three HCP-04- and HCP-08-approved development deployments from the same CI-built digest and retain equivalent migration/configuration/health/evidence results without local rebuilds (SC-007) in `evidence/deployments/development-three-run-manifest.json`
- [ ] T146 [US4] Pass all event/job/observability/recovery/performance/operator/HITL tests, all HITL-001-HITL-018 acceptance vectors, and retain independent story evidence (SC-005-SC-011) in `evidence/stories/us4-verifiable-foundation.json`

**Checkpoint**: A clean supported environment can be initialized and operated,
failures are diagnosable/recoverable, and both platform and controller evidence are
bound to the exact revision. Remote CI/deployment evidence is not inferred.

---

## Phase 7: User Story 5 - Extend the Platform Without Re-platforming (Priority: P2)

**Goal**: Add and exercise a representative tenant-scoped capability through the
canonical foundation without changing identity, tenancy, authorization, audit,
event, configuration, error, observability, or evidence contracts.

**Independent Test**: Register synthetic `research.notes`, vary exposure by tenant,
role, environment, resource, and policy, and prove no canonical contract fork or
vendor/asset/provider cap is introduced.

### Tests for User Story 5

- [ ] T147 [P] [US5] Write a failing extension contract test that snapshots canonical identity/tenancy/policy/audit/event/config/error/evidence schemas before and after representative capability registration (PF-031, SC-012) in `tests/contract/extensions/representative-capability.contract.test.ts`
- [ ] T148 [P] [US5] Write failing exposure tests varying tenant, role, environment, resource, policy, capability version, and disabled/incompatible configuration (PF-030, PF-031) in `tests/integration/extensions/capability-exposure.test.ts`
- [ ] T149 [P] [US5] Write failing adapter/registry tests proving provider, chain, model, broker, asset, and capability metadata accept extensions without exclusive-vendor or architecture-level caps (PF-030, PF-031) in `packages/testing/src/extensions/no-arbitrary-caps.test.ts`
- [ ] T150 [P] [US5] Write the failing accessible representative-capability E2E journey with audit, event, configuration, denial, and evidence drill-down (PF-025, PF-031, SC-012) in `tests/e2e/representative-capability.spec.ts`

### Implementation for User Story 5

- [ ] T151 [US5] Implement a schema-versioned capability registry and tenant/environment exposure service that references canonical permissions/routes/actions without source forks (PF-030, PF-031) in `packages/config/src/capability-registry.ts` and `packages/config/src/capability-exposure.ts`
- [ ] T152 [US5] Implement approved capability-definition registration and exposure endpoints with authorization, audit, outbox, idempotency, errors, and evidence links (PF-019, PF-021, PF-031) in `apps/api/src/routes/capability-definitions.ts`
- [ ] T153 [P] [US5] Implement the synthetic `research.notes` extension as a package-owned route/view using only public foundation ports and contracts (PF-031, SC-012) in `packages/testing/src/fixtures/research-notes-capability.ts` and `apps/web/src/app/extensions/research-notes/page.tsx`
- [ ] T154 [US5] Generate and verify the canonical-contract before/after checksums and architecture-cap scan for the representative extension (PF-030, PF-031, SC-012) in `evidence/extensions/representative-capability.json`
- [ ] T155 [US5] Pass extension contract/exposure/no-cap/E2E/accessibility tests and retain independent story evidence (SC-012, SC-013) in `evidence/stories/us5-extension-without-replatforming.json`

**Checkpoint**: The representative capability operates through the canonical
foundation without schema/contract forks or permanent vendor/product limitations.

---

## Phase 8: Polish, Documentation, and Phase 1 Readiness

**Purpose**: Close cross-cutting security, accessibility, performance,
documentation, traceability, CI, deployment, rollback, and acceptance evidence.

- [ ] T156 [P] Update the platform architecture, trust boundaries, data/event/request flows, future extraction criteria, and full-capability roadmap links (PF-030-PF-032) in `docs/architecture/overview.md` and `docs/architecture/platform-foundation.md`
- [ ] T157 [P] Create the baseline threat model with assets, actors, tenant-confusion/RLS/cache/event/audit/approval/secret/supply-chain threats, mitigations, owners, and verification links (PF-011-PF-018, SC-010) in `docs/threat-models/platform-foundation.md`
- [ ] T158 [P] Document service ownership, SLOs, health, dashboards, alerts, dependencies, deployment, rollback, recovery, and escalation (PF-022-PF-024, SC-008) in `docs/runbooks/platform-foundation-operations.md` and `docs/operations/service-catalog.yaml`
- [ ] T159 [P] Document local/CI/development bootstrap, configuration, migrations, testing, evidence, troubleshooting, and extension workflow without production secrets (PF-017, PF-023, PF-031) in `README.md`, `CONTRIBUTING.md`, and `docs/development/platform-foundation.md`
- [ ] T160 [P] Publish generated API/event/configuration/evidence references and contract compatibility policy (PF-019, PF-021, PF-031) in `docs/api/foundation-api.md` and `docs/api/compatibility.md`
- [ ] T161 [P] Create release notes and changelog entries that distinguish implemented Phase 1 from deferred product phases and list known accepted exceptions only (PF-029, PF-030) in `CHANGELOG.md` and `docs/releases/phase-1-platform-foundation.md`
- [ ] T162 Complete manual keyboard, screen-reader, responsive, localization, chart-alternative applicability, and automated accessibility review with zero critical violations (PF-025, SC-013) in `specs/002-platform-foundation/checklists/accessibility.md` and `evidence/accessibility/phase-1.json`
- [ ] T163 Run SAST, secret, dependency, license, container, SBOM, RLS, and tenant-isolation scans; disposition every finding without suppressing controls and require zero unaccepted critical findings (PF-017, SC-010) in `evidence/security/phase-1-security.json` and `evidence/security/sbom.spdx.json`
- [ ] T164 Run performance/load/spike/soak scenarios for landing state, API, policy, database, cache, events, workers, audit/export, and telemetry; record thresholds, regressions, and capacity assumptions (SC-005) in `evidence/performance/phase-1-performance.json`
- [ ] T165 Run empty/prior migration, rollback/forward-recovery, outbox replay, controlled dependency failure, configuration rollback, worker pause, and cache invalidation exercises (PF-023, PF-024) in `evidence/recovery/phase-1-recovery.json`
- [ ] T166 Generate the complete traceability graph and readable report with zero mandatory gaps, duplicates, unknowns, or dangling links across PF-001-PF-033, SC-001-SC-014, and HITL-001-HITL-018 (PF-027, PF-028, SC-009, SC-011) in `evidence/traceability/phase-1.json` and `evidence/traceability/phase-1.md`
- [ ] T167 Verify every ADR-0001 through ADR-0010 is approved, has an owner/review date, matches implemented decisions, and links to security/migration/evidence (PF-032, SC-014) in `evidence/architecture/adr-review.json`
- [ ] T168 Verify HCP-07 remains `no_go`/out of scope and that no production deployment, real customer migration, live secret, live account, or financial exposure occurred (PF-018, PF-029) in `specs/002-platform-foundation/checkpoints/HCP-07-production-deployment.md` and `evidence/releases/phase-1-scope-attestation.json`
- [ ] T169 Execute the root verifier from the exact candidate revision with clean or explicitly accepted working-tree evidence and retain all human-readable/machine-readable outputs (PF-027-PF-029, HITL-011-HITL-016) in `evidence/releases/phase-1-verification.json` and `evidence/releases/phase-1-verification.md`
- [ ] T170 Prepare the exact remote repository, branch, candidate revision, transmitted content classification, push or pull-request operation, CI workflows, authentication method names, expected artifacts, rollback, and no-secret attestation for HCP-08 without accessing credentials (PF-023, PF-029, HITL-012) in `specs/002-platform-foundation/checkpoints/HCP-08-external-ci-publication.md`
- [ ] T171 HUMAN CHECKPOINT HCP-08: obtain and record explicit approval before any repository content is pushed, submitted to a pull request, or transmitted to remote CI (PF-023, PF-029, HITL-012) in `specs/002-platform-foundation/checkpoints/HCP-08-external-ci-publication.md`
- [ ] T172 Confirm protected-branch CI is green for the exact candidate revision and link real workflow IDs/artifact digests without inferring remote status from local checks (HITL-012, PF-029) in `evidence/releases/phase-1-ci.json`
- [ ] T173 Complete the requirement, security, operations, deployment, rollback, documentation, and evidence acceptance checklist without marking any item from intent alone (PF-028, PF-029) in `specs/002-platform-foundation/checklists/acceptance.md`
- [ ] T174 Produce the Phase 1 readiness decision as `go`, `go_with_time_limited_exception`, or `no_go`, with owner/expiry/compensating controls for permitted exceptions and automatic no-go for critical isolation/secret/recovery gaps (PF-029, SC-010) in `evidence/releases/phase-1-readiness.json`

---

## Dependencies and Execution Order

### Phase dependencies

```text
Phase 1 Setup/Governance
  -> Phase 2 Foundational Controls
       -> US1 Isolated Organization (MVP)
       -> US2 Authorized Capabilities
       -> US3 Operational Evidence
       -> US4 Verifiable Development Foundation
       -> US5 Extension Without Re-platforming
            -> Phase 8 Readiness
```

- Phase 1 has no implementation dependency but stops first at GOV-01, then at
  HCP-06 and HCP-01 for their exact protected actions.
- Phase 2 depends on Phase 1 and stops at HCP-02, HCP-03, and HCP-04.
- All user stories depend on Phase 2.
- US1, US2, and US3 are all P1. Implement sequentially in that order because US2
  consumes US1 identity context and US3 consumes both authorization and tenant
  context; each remains independently testable through its own fixtures/contracts.
- US4 consumes all shared platform controls and stops at HCP-05 before engineering
  policy/approval/execution semantics change.
- US5 consumes the capability registry and complete canonical contracts so its
  no-replatforming proof is meaningful.
- Phase 8 depends on all five story evidence packages and all approved checkpoints.

### Human checkpoint dependency graph

| Checkpoint                                                 | Blocks                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| GOV-01 Constitution, Spec Kit, agent context, and baseline | T004-T005 and every implementation task                                                |
| HCP-01 Dependencies                                        | T024 and every dependency/lockfile/tool addition                                       |
| HCP-02 Public contracts                                    | T034 onward when schemas become implementation authority                               |
| HCP-03 Persistence                                         | T038 onward for migrations, roles, functions, triggers, or RLS                         |
| HCP-04 Infrastructure                                      | T045 onward for container/cache/telemetry/development definitions or application       |
| HCP-05 Engineering policy                                  | T132 onward for `policy.toml`, approval, workflow, audit, or executor semantic changes |
| HCP-06 Source authority                                    | T021 source artifact/manifest preservation                                             |
| HCP-07 Production                                          | No production task exists; T168 verifies the no-go boundary                            |
| HCP-08 External CI/publication                             | T172 and any push, pull-request submission, or remote CI transmission                  |

### Within each user story

1. Write contract/unit/integration/RLS/E2E tests and confirm the expected failure.
2. Apply only the exact HCP-approved migration/contract/dependency scope.
3. Implement model and repository behavior.
4. Implement services and authoritative API routes.
5. Implement accessible UI/worker integration.
6. Run the independent story suite and retain exact-revision evidence.

### Parallel opportunities

- ADR tasks T009-T018 are parallel after T008.
- Foundational contract, migration, infrastructure, and controller work are not
  parallel across their checkpoints; within an approved scope, T046-T049 and
  T052-T053 affect separate files and can proceed concurrently.
- Test-authoring tasks within each story marked `[P]` can run concurrently before
  implementation.
- UI work marked `[P]` can run with service implementation only after its contract
  and view models are stable.
- Phase 8 documentation tasks T156-T161 are parallel; evidence tasks that consume
  the same candidate revision run only after source freeze.

---

## Parallel Examples

### User Story 1

```text
T055 contract tests
T056 RLS tests
T057 cross-tenant matrix
T058 atomicity tests
T059 invitation concurrency
T060 context switch
T061 service identities
T062 onboarding E2E
```

All must exist and fail for the intended missing behavior before T063-T072.

### User Story 2

```text
T074 deterministic policy tests
T075 authorization matrix
T076 capability contracts/consistency
T077 direct denial
T078 stale authority
T079 step-up approval
T080 capability-shell E2E
```

### User Story 3

```text
T091 append-only database tests
T092 fail-closed fault injection
T093 audit search/export
T094 configuration publication
T095 secret boundaries
T096 support access
T097 reviewer E2E
```

### User Story 4

Platform tests T107-T113 and HITL tests T114-T122 may be authored in parallel.
Implementation remains ordered across HCP-05 and shared controller files.

### User Story 5

T147-T150 may be authored in parallel. T154 must compare canonical contract hashes
only after T151-T153 are complete.

---

## Implementation Strategy

### MVP first

1. Complete Phase 1 and all applicable approvals.
2. Complete Phase 2 and prove real tenant isolation foundations.
3. Complete US1 and retain its independent evidence.
4. Stop for MVP review. Do not call the overall Platform Foundation complete.

### Incremental delivery

1. US1 establishes tenancy and identity.
2. US2 adds authoritative access/capability behavior.
3. US3 adds complete operational evidence and immutable configuration.
4. US4 proves operations, recovery, deployment evidence, and HITL compliance.
5. US5 proves extensibility without canonical contract changes.
6. Phase 8 proves the complete Phase 1 acceptance decision.

### Completion rule

The feature is complete only when T001-T174 are checked, all checkpoint decisions
are attributable and in scope, every mandatory test/check passes, protected-branch
CI and approved development-deployment evidence are real, traceability has zero
mandatory gaps, documentation/ADRs are current, and readiness evidence supports the
decision. Production deployment remains separately governed and out of Phase 1.
