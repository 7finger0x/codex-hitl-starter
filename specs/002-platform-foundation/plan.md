# Implementation Plan: Platform Foundation

**Feature Branch**: `002-platform-foundation` (planned; current checkout remains `master`)  
**Date**: 2026-07-10  
**Spec**: [spec.md](spec.md)  
**Status**: Approved for task validation; implementation is not authorized

**Approval**: The user explicitly approved this Platform Foundation plan for task validation on 2026-07-10. The approval does not authorize implementation or any HCP checkpoint; HCP-01 through HCP-08 remain pending.

**Input**: Approved Phase 1 feature specification and hash-verified Final Production
Paper v3. Planning approval does not authorize dependency installation, public
contract adoption, persistence changes, infrastructure changes, execution-policy
changes, or deployment.

## Summary

Transform the existing Python Codex HITL starter into the Phase 1 foundation of
the Unified AI Trading Operating System and Hermes Protocol. Deliver a
TypeScript-first modular monolith with a Next.js platform shell, authoritative
Fastify API, asynchronous workers, Supabase Postgres/Auth/Storage, real RLS,
deterministic RBAC/ABAC, immutable configuration and policy versions,
append-only audit evidence, transactional outbox/inbox delivery, tenant-aware
cache, OpenTelemetry observability, repeatable local/development deployment, and
commit-bound verification evidence.

The existing Python engineering control plane is moved behind
`tooling/codex-hitl` without changing its command or import identity, then upgraded
to satisfy HITL-001 through HITL-018. Phase 1 does not implement journal, trading,
risk, market, AI-agent, broker/exchange, or Hermes liquidity workflows, but its
canonical identifiers, tenancy, policy, event, audit, configuration, capability,
integration, and evidence contracts support those phases without re-platforming.

## Technical Context

**Language/Version**: Node.js 24 LTS; TypeScript; Next.js 16; Python 3.11-3.13 for `codex-hitl`; SQL/PLpgSQL for Postgres  
**Primary Dependencies**: pnpm workspaces, Turborepo, Next.js/React, Fastify, TypeBox/JSON Schema, node-postgres, Supabase Auth/Storage clients, OpenTelemetry, structured JSON logging, Valkey client, Vitest, Playwright, pgTAP, accessibility and security tooling; all additions are proposed under HCP-01  
**Storage**: Supabase Postgres source of truth with real RLS; Supabase Storage for tenant objects/evidence; Valkey-compatible non-authoritative cache; Postgres outbox/inbox; local SQLite remains exclusive to `codex-hitl`  
**Testing**: Vitest unit/component/contract tests, real Postgres/RLS integration tests, pgTAP, Playwright E2E/accessibility, Python `unittest`, container/recovery/security/dependency/performance checks, JSON Schema/OpenAPI validation  
**Target Platform**: Linux containers for CI/preview/development; WSL/Linux/macOS developer hosts; production topology is designed but production activation is out of scope  
**Project Type**: TypeScript/Python monorepo with web application, API, workers, shared packages, SQL migrations, developer tooling, and infrastructure definitions  
**Performance Goals**: Authenticated non-analytical reads p95 below 500 ms; transactional writes p95 below 750 ms excluding external-provider time; at least 95% of representative landing-state runs below 2 seconds; authorization and audit/outbox overhead measured separately with regression budgets  
**Constraints**: Tenant context on every scoped artifact; fail-closed sensitive audit; no raw secrets; no stale authorization; exact idempotency; rolling-compatible forward-only migrations; keyboard-accessible critical paths; deterministic policy; no architecture-level capability caps  
**Scale/Scope**: Phase 1 verification profile includes at least 10 tenants, 1,000 memberships, 200 concurrent sessions, and 1,000,000 audit/outbox records. These are evidence fixtures, not product caps; capacity is configuration and infrastructure policy.

## Constitution Check - Pre-Design Gate (Re-evaluated under v2.0.0)

| Article | Evidence | Result |
|---|---|---|
| I. Specification before implementation | Approved spec, plan, research, model, contracts, quickstart, and validated tasks precede product implementation | PASS |
| II. Full capability without arbitrary architecture limits | PF-030-PF-031 and the representative extension test prohibit hidden vendor/product caps | PASS |
| III. Deterministic control before generative judgment | Authorization, state, policy, idempotency, and command boundaries are deterministic and fail closed | PASS |
| IV. Human authority for governed actions | GOV-01 and HCP-01-HCP-08 stop every identified protected effect; approvals never carry over | PASS |
| V. Safe command execution | HITL-008-HITL-009 require argv-only, shell-false, bounded process-tree execution and evidence | PASS |
| VI. Traceability | T007, T137, and T166 cover PF-001-PF-033, SC-001-SC-014, HITL-001-HITL-018, source, tests, acceptance, and evidence | PASS |
| VII. Evidence before completion | The evidence manifest and readiness tasks reject failed, skipped, degraded, truncated, or unavailable mandatory checks | PASS |
| VIII. Tenant, secret, and data isolation | Forced RLS, composite tenant keys, secret references, redaction, and cross-tenant matrices cover platform surfaces | PASS |
| IX. Reversible delivery | Migrations, configuration, workers, cache, applications, and deployment define rollback or tested forward recovery | PASS |
| X. No silent bypass | Policy, audit, verification, traceability, checkpoint, and readiness failures remain visible and fail closed | PASS |

No constitution violation is accepted. Implementation must stop if any gate loses
its evidence.

### Governance prerequisites before implementation (GOV-01)

Plan approval does not waive these prerequisites:

1. Constitution 2.0.0 and its dependent templates are approved under GOV-01 and
   synchronized by T004.
2. Select the official Spec Kit 0.12.9 baseline, or a newer official release with
   compatibility evidence, under GOV-01. Installing or replacing the tool also
   requires HCP-01 dependency approval.
3. T005 reconciled the 28 spurious Windows-mount mode reports with the reversible
   repository-local core.filemode=false setting and retained a documented-dirty
   path/size/mode/hash inventory. It did not claim a clean baseline.
4. Restore or replace the missing Spec Kit agent-context updater, then verify that
   durable repository instructions match the approved toolchain and commands.

The generated Spec Kit integration contains setup and prerequisite scripts but no
agent-context update script. No hand edit to AGENTS.md is treated as a substitute.

## Source Authority

Final Production Paper v3 is the normative product/architecture authority. Its
local PDF and DOCX hashes were independently verified during research. Before
implementation acceptance, HCP-06 must choose one of these repository-owned
forms:

1. commit both controlled source artifacts under `docs/authority/`; or
2. commit a manifest containing controlled organization artifact URIs, immutable
   versions, both hashes, effective date, access classification, and verification
   instructions.

Repository copies and a verifier currently exist as unaccepted pre-existing
artifacts. They remain preserved but cannot satisfy PF-033 or support a completion
claim unless HCP-06 is explicitly approved and their hashes and governance
metadata are revalidated.

A local Downloads path is not durable project authority and cannot satisfy
PF-033 by itself.

## Architecture

### Runtime boundaries

```text
Browser
  -> apps/web (Next.js UI/session/BFF)
  -> apps/api (authoritative commands, queries, authz, transactions)
       -> Supabase Postgres/Auth/Storage
       -> Valkey-compatible cache (non-authoritative)
       -> state + audit + outbox in one transaction
  -> apps/workers (outbox dispatch, exports, evidence jobs)
       -> inbox/idempotency + projections + telemetry

Repository-changing work
  -> tooling/codex-hitl (separate Python policy/approval/execution trust domain)
```

The API/domain system is a modular monolith. Extraction is permitted only when
load, availability, cadence, or ownership evidence justifies it and only through
unchanged contracts.

### Domain packages

| Package | Ownership |
|---|---|
| `packages/core` | Opaque IDs, time, correlation, errors, canonical hashes, shared schema primitives |
| `packages/identity` | Users, tenants, memberships, teams, environments, sessions, service identities |
| `packages/policy` | Runtime RBAC/ABAC inputs, deterministic evaluator, approvals, support access |
| `packages/config` | Immutable configuration/policy publication and capability exposure |
| `packages/audit` | Append-only audit model, fail-closed transactional writer, search/export |
| `packages/events` | Event envelope, outbox/inbox, leases, retries, reconciliation |
| `packages/observability` | Correlation, redaction, logs, metrics, traces, health |
| `packages/ui` | Accessible shell and shared components; consumes API view models only |
| `packages/testing` | Factories, RLS attack matrix, contract, telemetry, evidence helpers |

Dependency direction is `apps -> domain packages -> core`. Domain packages never
import apps, UI, integration SDKs, or vendor clients. Cross-package cycles and
unapproved imports fail CI.

### Request and mutation flow

1. Validate bearer/service credential, input schema, headers, idempotency key,
   tenant/environment selection, correlation, and expected version.
2. Resolve fresh membership, role/resource scope, authentication strength,
   configuration, policy, and exact approval evidence.
3. Evaluate deterministic authorization. Any deny stops processing and records the
   required decision evidence without disclosing target existence.
4. Begin a database transaction and set verified request context transaction-
   locally for a non-owner, non-`BYPASSRLS` role.
5. Load tenant-owned state through repositories, validate invariants, and apply the
   expected-version guard.
6. Persist state, mandatory audit evidence, idempotency result, and outbox events
   atomically. If audit/outbox persistence fails, roll back.
7. Return version, correlation ID, audit reference, and warnings.
8. Workers lease outbox rows, publish/consume at least once, deduplicate in inbox,
   and keep uncertain delivery visible until reconciliation.

### Tenant isolation

- Shared-schema Postgres with `tenant_id` on every owned table and
  `environment_id` on environment-scoped tables.
- Composite keys/FKs prevent cross-tenant relationships.
- RLS is enabled and forced; owners and bypass roles are excluded from runtime.
- API, storage, cache, events, jobs, realtime contracts, exports, audit, vectors,
  and future analytics use tenant/environment namespaces and verification.
- The real cross-tenant test matrix covers select/insert/update/delete/functions,
  storage, cache, events/jobs, subscriptions, exports, audit, support paths, and
  service identities.

### Configuration and policy

Configuration and runtime policy are immutable, schema-versioned,
environment-scoped publications. Activation is a separate atomic action governed
by authorization and, when high impact, exact approval evidence. Unknown schema
versions, unsupported condition types, incompatible capabilities, and production
secret references in lower environments fail closed.

Product policy and engineering policy share stable decision/audit vocabulary but
not tokens, database records, or authorization. A `codex-hitl` approval can never
authorize a tenant or financial action.

## Proposed Public Contracts

Planning contracts live under `contracts/`:

- `foundation-api.openapi.json`: incomplete proposed REST v1 draft covering
  health, session/context, tenant creation, invitations, role assignment,
  capabilities, configuration, and audit search/export.
- `domain-event.schema.json`: PF-019-complete event envelope.
- `capability-manifest.schema.json`: signed discovery artifact that explicitly is
  not an authorization token.
- `platform-configuration.schema.json`: versioned configuration with opaque secret
  references only.
- `evidence-manifest.schema.json`: exact-revision machine-readable verification.
- `traceability.schema.json`: PF/HITL/SC relationship graph.

`openapi.yaml` and `event-envelope.schema.json` are superseded planning
sketches retained so the out-of-sequence concurrent write is not silently
deleted. They are not implementation authority. HCP-02 must review their
differences and approve removal or reconciliation.

Before HCP-02 approval, the contract review must add or explicitly disposition
custom-role management, service-identity lifecycle, environment management,
support-access lifecycle, and evidence-run operations required by the approved
specification and task plan.

HCP-02 approval is required before these become implementation authority. Any
breaking revision after approval requires a versioned replacement, migration path,
updated tests, and an approved deviation/ADR.

## Data and Migration Plan

[data-model.md](data-model.md) defines the proposed Phase 1 entities, relationships,
states, and invariants. Implementation order after HCP-03:

1. Bootstrap schemas, extensions, non-owner runtime roles, request-context
   functions, grants, and migration ledger.
2. Add global identity/permission references and tenant/environment/membership
   tables with composite keys.
3. Add roles, grants, sessions, service identities, policy/configuration versions,
   approvals, support access, and capability exposure.
4. Add append-only audit, idempotency, outbox/inbox/delivery, jobs, evidence, and
   export tables.
5. Enable/force RLS and append-only triggers in the same migration series before
   any runtime grant.
6. Seed only deterministic synthetic local/CI data.
7. Test from empty and representative prior schemas, verify rolling compatibility,
   and produce forward-recovery evidence.

No migration may be applied to a non-disposable database under planning approval.
Destructive cleanup is out of scope.

## Security and Privacy Plan

- Supabase Auth supplies human identity; application membership remains tenant-
  scoped and authoritative.
- MFA/passkey/SSO-ready session records and step-up evidence are represented
  without changing user identity.
- Service identities use separate short-lived/scoped credentials or hashed API
  keys; human sessions are rejected for workloads.
- Secrets are accepted only as opaque references and are redacted from UI, AI,
  logs, traces, errors, analytics, exports, fixtures, and ordinary records.
- Support access uses a separate role, reason, step-up, customer/resource scope,
  short expiry, immediate revocation, and complete audit.
- File/object access uses tenant storage policy and quarantine before processing.
- Threat modeling covers tenant confusion, RLS bypass, connection-context leakage,
  stale authorization, approval replay, audit suppression, idempotency conflict,
  cache collision, event spoofing, injection, SSRF, secret leakage, and supply chain.
- CI gates include secret, SAST, dependency, license, container, and SBOM checks;
  unaccepted critical findings block evidence `pass`.

## Observability and Operations Plan

- OpenTelemetry spans and metrics propagate through HTTP, SQL, outbox, worker,
  cache, storage, and export work.
- Structured JSON logs include service/version, deployment environment,
  pseudonymous tenant where permitted, correlation, trace, event/job, stable error
  code, and redacted fields.
- Audit evidence remains separate from technical telemetry.
- `/health/live` reports process liveness; `/health/ready` reports required
  dependencies; degraded optional dependencies are explicit.
- Phase 1 alerts cover tenant-isolation test failure, audit persistence failure,
  database unavailability, outbox age/uncertainty, authentication error spikes,
  configuration activation failure, secret-scan detection, and deployment health.
- Each alert has owner, severity, threshold/window, dedupe key, escalation, and
  linked runbook.
- Development topology provides Prometheus, Loki, Tempo, Grafana, and an OTEL
  Collector through HCP-04-approved container definitions.

## Test and Evidence Strategy

### Test layers

| Layer | Required evidence |
|---|---|
| Unit/property | IDs, hashes, policy precedence, role/resource conditions, state machines, idempotency, serialization |
| Component | Domain services with real repositories or isolated ports; fail-closed audit |
| Integration/RLS | Real Postgres/Auth/Storage/cache/outbox with multi-tenant attack matrix |
| Contract | OpenAPI, JSON Schema, errors, events, configuration, capability, evidence |
| E2E | Five independent user stories through UI and API |
| Accessibility | Keyboard journeys, focus/status/labels, responsive layouts, automated axe; manual review recorded |
| Security | Authentication, authorization, RLS, injection, abuse, secrets, supply chain, containers |
| Performance | SC-005 plus API/policy/outbox budgets and million-row audit fixtures |
| Recovery | migration reset/upgrade, outbox replay, dependency failure, rollback/forward recovery |
| HITL | All HITL-001-HITL-018 acceptance vectors and container/CI evidence |

Tests are written before their corresponding implementation behavior and must
demonstrate the expected failure before implementation. Critical deterministic
packages target at least 90% statement coverage, meaningful branch coverage, and
mutation tests. Coverage alone never establishes acceptance.

### Traceability

The validator parses normative paper/HITL, PF, and SC identifiers and enforces:

```text
paper requirement -> feature requirement -> task -> source/migration
                  -> automated test -> acceptance item -> evidence -> revision
```

It fails on missing, duplicated, malformed, unknown, or dangling links; critical
requirements without automated tests; completed tasks with unchecked acceptance;
nonexistent artifacts; protected source changes without tasks; mismatched revision,
policy, or dependency lock; and skipped mandatory checks.

### Single verification command

`scripts/verify.sh` remains the root entry point and `codex-hitl verify --json`
orchestrates bounded, shell-free checks and emits JSON plus readable evidence. It
must distinguish local results from unavailable remote CI/deployment evidence.

## Delivery and Deployment Plan

### Environments

Local, CI, preview, development, staging, and production deployment environments
are distinct from tenant sandbox/paper/production contexts. Phase 1 implementation
may prepare local/CI/preview/development definitions after HCP-04. Staging and
production activation remain future governed release decisions.

### CI

Pull-request CI uses locked dependencies and runs generated-artifact verification,
format/lint/type, unit/component/contract/integration/RLS/E2E as affected,
migration checks, security/secret/dependency/container scans, SBOM, non-root
container smoke, `codex-hitl verify`, traceability, and evidence publication.

Protected-branch CI adds the full integration/E2E/accessibility/performance/recovery
suite and release-candidate artifacts. CI configuration must target the actual
protected branch; the current `main`-only push trigger while the repository is on
`master` is a known planning defect. HCP-08 must approve the exact remote, branch,
candidate revision, transmitted content, and push/PR/CI operations before any
repository content is sent to external CI.

### Development deployment

Only CI-built immutable artifacts may support SC-007. Three deployments from the
same approved revision must produce equivalent migration, configuration, health,
and evidence results. Local rebuilds are not equivalent evidence.

### Rollback and forward recovery

- Application: redeploy the previous signed artifact.
- Feature/capability: atomically select the prior approved exposure version.
- Configuration/policy: atomically select the prior compatible immutable version.
- Workers: pause new leases, drain/cancel safely, then replay idempotently.
- Database: roll back only additive reversible work; otherwise execute the tested
  forward fix within the compatibility window.
- Cache: invalidate by tenant/environment/version; correctness does not depend on
  preserving cache state.
- Evidence: never rewrite prior manifests; a new run supersedes with explicit link.

## Human Checkpoints

| ID | Trigger | Impact if approved | Required review/evidence |
|---|---|---|---|
| GOV-01 | Before constitution amendment, Spec Kit selection, durable agent-context change, or working-tree normalization | Aligns repository governance and establishes a trustworthy baseline | Exact constitution diff, official tool version/provenance, generated-file inventory, repeatability tests, mode-change disposition, recovery |
| HCP-01 | Before dependency/tool installation or lockfile creation | Introduces Spec Kit replacement, Node, test, scanner, Supabase, telemetry, and cache packages/tools | Dependency inventory, licenses, provenance, support status, vulnerability baseline, rollback |
| HCP-02 | Before implementing proposed API/event/config/evidence contracts | Establishes public and cross-service compatibility surface | Contract diff, versioning policy, threat model, consumer review, compatibility tests |
| HCP-03 | Before creating/applying persistence migrations | Establishes canonical schema, roles, RLS, append-only triggers | Data review, RLS matrix, empty/prior migration tests, backup/forward recovery; disposable local target identified |
| HCP-04 | Before infrastructure/development deployment definitions or application | Adds containers, cache, telemetry, network and deployment behavior | Threat/cost/port/volume review, IaC plan, rollback, target environment; production explicitly excluded |
| HCP-05 | Before changing `policy.toml` or `codex-hitl` approval/execution semantics | Changes engineering command authorization | Exact policy diff, test vectors, migration, recovery, security review |
| HCP-06 | Before committing external authority artifacts/manifest | Makes source paper durable project authority | Ownership/license/classification, immutable URI or binaries, verified hashes |
| HCP-07 | Any production deployment or activation | Externally visible operational impact | Separate explicit production authorization and all production readiness gates; out of Phase 1 |
| HCP-08 | Before push, pull-request submission, or remote CI transmission | Transmits repository content and creates externally visible CI/repository state | Exact remote, branch, revision, transmitted-content classification, operation, workflow inventory, credential method names, artifacts, and rollback; no secret access in the approval record |

Tasks must place a visible stop immediately before each applicable checkpoint. A
single approval may cover multiple listed tasks only when its exact scope and
artifacts are identified.

## Architecture Decisions and Deviations

The following ADRs are required before their corresponding implementation tasks
complete. Each ADR records context, alternatives, decision, consequences, security
impact, rollback/migration, owner, and review date.

| ADR | Decision | Owner | Review date |
|---|---|---|---|
| ADR-0001 | Modular monolith, separate API, extraction criteria | Platform Architecture | 2026-10-10 |
| ADR-0002 | Shared-schema tenancy, request context, and RLS | Security Architecture | 2026-10-10 |
| ADR-0003 | REST/OpenAPI/JSON Schema authority and versioning | API Architecture | 2026-10-10 |
| ADR-0004 | UUIDv7 canonical identifiers | Data Architecture | 2026-10-10 |
| ADR-0005 | Postgres outbox/inbox and future transport port | Platform Architecture | 2026-10-10 |
| ADR-0006 | Immutable policy/configuration activation | Security and Product Policy | 2026-10-10 |
| ADR-0007 | Valkey-compatible cache namespace/invalidation | Platform Architecture | 2026-10-10 |
| ADR-0008 | OpenTelemetry and development observability topology | SRE | 2026-10-10 |
| ADR-0009 | Python HITL boundary, audit migration, and compatibility | Engineering Security | 2026-10-10 |
| ADR-0010 | Source-authority preservation | Product Architecture | 2026-10-10 |

Material deviation from this plan requires a new/updated ADR and changes to the
specification, tasks, tests, and evidence before acceptance.

## Project Structure

### Feature documentation

```text
specs/002-platform-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── foundation-api.openapi.json
│   ├── domain-event.schema.json
│   ├── capability-manifest.schema.json
│   ├── platform-configuration.schema.json
│   ├── evidence-manifest.schema.json
│   └── traceability.schema.json
├── checklists/
│   └── requirements.md
└── tasks.md                 # generated only after plan approval
```

### Target repository layout

```text
AGENTS.md
.specify/
specs/
policies/
apps/
├── web/
├── api/
└── workers/
packages/
├── core/
├── identity/
├── policy/
├── config/
├── audit/
├── events/
├── observability/
├── ui/
└── testing/
tooling/
└── codex-hitl/
    ├── pyproject.toml
    ├── src/codex_hitl/
    └── tests/
supabase/
├── migrations/
├── seed/
└── tests/
infra/
├── modules/
├── environments/
└── policies/
docs/
├── authority/
├── architecture/
├── adr/
├── api/
├── runbooks/
├── security/
├── threat-models/
└── evidence/                 reviewed evidence guidance and durable indexes
evidence/                     generated machine-readable run and release artifacts
scripts/
.github/workflows/
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
turbo.json
Dockerfile
```

Only `apps/web`, `apps/api`, and `apps/workers` are runtime applications created
in Phase 1. Future Hermes, admin, realtime, webhook, scheduler, connector, quant,
trading, risk, journal, market, AI, and analytics applications/packages are added
when used; empty shells do not count as extensibility.

## Requirement-to-Workstream Map

| Requirements | Primary design/workstream | Acceptance focus |
|---|---|---|
| PF-001-PF-006 | Identity, tenancy, environments, sessions, service identities | US1, real multi-tenant lifecycle |
| PF-007-PF-012 | Policy, RBAC/ABAC, capability shell, support access | US1-US2, consistency and stale-access denial |
| PF-013-PF-018 | Audit, immutable configuration, approvals, secret references | US3, fail-closed and isolated export |
| PF-019-PF-021 | Events, inbox/idempotency, error catalog | US4, duplicate/uncertain delivery and safe errors |
| PF-022-PF-025 | Observability, deployment/recovery, migrations, accessible shell | US4, clean init/failure/recovery/evidence |
| PF-026-PF-029 | `codex-hitl`, traceability, verification manifests | US4, HITL-001-HITL-018 exact-revision evidence |
| PF-030-PF-033 | Capability registry, extension test, ADRs, source authority | US5, no contract fork or permanent cap |

## Constitution Check - Post-Design Gate

| Gate | Post-design evidence | Result |
|---|---|---|
| Approved scope retained | All 33 PF requirements and five stories have an architecture/test/evidence owner; later capabilities are supported, not implemented early | PASS |
| Ambiguity resolved | Research contains concrete choices and alternatives; no unresolved clarification remains | PASS |
| Irreversible/high-impact effects controlled | GOV-01 plus eight explicit HCP checkpoints precede every prohibited class | PASS |
| Verification proportionate | Real RLS, layered tests, security/performance/accessibility/recovery, HITL, and traceability are mandatory | PASS |
| Backward compatibility | CLI/import identity and root verify entry point preserved; migrations use expand/contract | PASS |
| Deviations visible | ADR and change-set requirements are explicit | PASS |

The plan is approved for task validation. GOV-01 and T001-T005 are complete.
The tasks.md and proposed ADRs do not authorize product implementation, and
HCP-01 through HCP-08 remain pending until separately approved.

## Complexity Tracking

| Complexity | Why required | Simpler alternative rejected because |
|---|---|---|
| TypeScript applications plus preserved Python tooling | Normative product stack and separate engineering trust domain | A single-language rewrite would either violate the product baseline or risk controller regressions |
| Defense-in-depth authorization (API/domain/RLS/storage/cache/event) | PF-007-PF-012 require every enforcement boundary and full tenant isolation | Query filters or UI checks cannot prevent cross-tenant access |
| State + audit + outbox transaction | PF-004/PF-013/PF-019 require attributable evidence and reliable events | Best-effort logging/publication permits state/evidence divergence |
| Local observability stack | PF-022 and Phase 1 exit evidence require correlated logs, metrics, traces, alerts, and recovery | Console logs cannot prove cross-service diagnosis |
| Full HITL upgrade during foundation | PF-026-PF-029 and SC-011 make HITL-001-HITL-018 an acceptance gate | Preserving the ten-test starter alone would falsely claim compliance |
