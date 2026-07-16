# Phase 0 Research: Platform Foundation

**Feature**: `002-platform-foundation`  
**Date**: 2026-07-10  
**Status**: Planning baseline; implementation approval is not implied

## Authority and method

The following local source artifacts were located and independently hashed. Both
hashes exactly match the approved specification:

| Artifact | SHA-256 |
|---|---|
| `AI_Trading_OS_Hermes_Final_Production_Paper_v3.pdf` | `9d075a82a6088ef446442a1113f59a6023196fd5304c12a4e7eaefdedee66a61` |
| `AI_Trading_OS_Hermes_Final_Production_Paper_v3.docx` | `72a37bb2aec0cde1d103d98b292b4f1073f4373bf1e96a270a473438b4ecc4dc` |

The PDF rendering toolchain was unavailable and dependencies were not installed
because dependency additions require approval. The hash-equivalent DOCX package
was extracted read-only for research. Before implementation acceptance, PF-033
requires the controlled artifacts or a resolvable manifest to be committed under
`docs/authority/`.

Current official references used to avoid stale toolchain assumptions:

- [Next.js installation and runtime requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase environment and migration workflow](https://supabase.com/docs/guides/deployment/managing-environments)
- [Fastify TypeScript and JSON Schema](https://fastify.dev/docs/latest/Reference/TypeScript/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Playwright accessibility testing](https://playwright.dev/docs/next/accessibility-testing)

## Decision 1: Delivery architecture

**Decision**: Start Phase 1 as a TypeScript-first modular monolith with three
runtime applications: `apps/web`, `apps/api`, and `apps/workers`. Preserve the
Python engineering controller as `tooling/codex-hitl`. Domain code lives in
packages with enforced dependency directions and can be extracted without
changing public contracts.

**Rationale**: The production paper expressly permits a modular monolith for the
initial deployment. It minimizes distributed-transaction and operational risk
while tenant, authorization, audit, configuration, and event boundaries mature.

**Alternatives considered**:

- Microservices from Phase 1: rejected because it increases deployment and
  consistency risk without a demonstrated scaling or ownership need.
- Next.js-only backend: rejected because the authoritative public API, workers,
  and non-web clients need an independent trust and deployment boundary.
- Extending the existing Python package into the product backend: rejected
  because the normative product stack is TypeScript/Node and the Python package
  is a separate engineering trust domain.

## Decision 2: Supported runtimes and workspace

**Decision**: Use Node.js 24 LTS, TypeScript, Next.js 16, pnpm workspaces, and
Turborepo orchestration. Retain the existing Python 3.11-3.13 support matrix for
`codex-hitl`; use Python 3.12 or later for future quant workers when introduced.
Exact package versions are locked only after dependency approval.

**Rationale**: Node 24 is an active LTS line on the planning date, while the
previous Node 20 line is no longer a safe new-production baseline. The normative
paper names a TypeScript-first monorepo, pnpm workspace, and Turborepo layout.

**Alternatives considered**:

- Node 26 Current: rejected for Phase 1 production planning because LTS is the
  repository standard for production runtimes.
- npm workspaces only: viable, but inconsistent with the normative reference
  monorepo and less explicit about the intended workspace layout.
- Nx: viable but adds a broader framework and migration surface than needed.

## Decision 3: API and schema source of truth

**Decision**: Use a separate Fastify API with complete JSON Schema validation,
TypeBox-backed TypeScript types, OpenAPI 3.1 publication, and stable REST v1
commands/resources. The Next.js application is a session-aware UI/BFF consumer;
it is not the authoritative mutation boundary.

**Rationale**: This keeps runtime validation, generated documentation, SDK types,
and contract tests derived from one schema family. Fastify supports complete JSON
Schema validation and typed providers without requiring an ORM or GraphQL.

**Alternatives considered**:

- GraphQL authority: deferred to an optional read facade; mutation semantics,
  idempotency, error codes, and external integration are clearer in REST.
- Zod-only schemas: viable but requires an additional translation path to
  OpenAPI/JSON Schema.
- OpenAPI generated from handwritten handlers: rejected because drift would be
  too easy and PF-028 requires exact traceability.

## Decision 4: Canonical identifiers

**Decision**: Store canonical entity identifiers as UUIDv7 values and expose them
as opaque strings with branded TypeScript types. Stable permission identifiers
use `resource.action`; event types use `domain.past_fact.vN`; errors use
`UPPER_SNAKE_CASE`. Do not create a second public-ID column in Phase 1.

**Rationale**: UUIDv7 is globally unique, time-ordered for index locality, and
does not reveal tenant-local sequence counts. Branded types prevent accidental
cross-entity substitution without enlarging database indexes with prefixes.

**Alternatives considered**:

- UUIDv4: simpler but has poorer write locality at sustained scale.
- Prefixed text identifiers such as `ten_...`: highly readable but larger in
  every index and dependent on custom generation.
- Numeric sequences: rejected because they disclose cardinality and are unsafe
  as globally unique public identifiers.

## Decision 5: Transactional data and migrations

**Decision**: Supabase Postgres is the source of truth. Use SQL-first, forward-only
migrations and explicit tenant-aware repositories through `node-postgres`; do not
introduce an ORM in Phase 1. Supabase Auth supplies human identity, and Supabase
Storage supplies tenant-owned objects. All sensitive mutations write canonical
state, mandatory audit evidence, and outbox events in one transaction.

**Rationale**: SQL-first migrations make RLS, grants, triggers, constraints, and
transaction boundaries inspectable. An ORM must not become a path around RLS or
hide tenant keys.

**Alternatives considered**:

- Prisma or Drizzle: useful type tooling, but neither removes the need for
  first-class SQL migrations and real policy tests. Reconsider after Phase 1.
- Direct browser writes: prohibited for sensitive commands because application
  authorization, audit, and outbox atomicity must remain authoritative.
- Database-per-tenant: stronger physical isolation but disproportionate Phase 1
  operational cost and inconsistent with the shared-schema normative baseline.

## Decision 6: Tenant and authorization context

**Decision**: Authenticate with Supabase Auth, validate tokens at the API, and set
verified user, tenant, environment, authentication-strength, and correlation
context transaction-locally for a non-owner, non-`BYPASSRLS` database role. Apply
RBAC plus deterministic ABAC before domain commands and again through RLS. Never
authorize from UI visibility or a stale cache.

**Rationale**: Defense in depth is required by PF-007 through PF-012. Transaction-
local context avoids connection-pool leakage. Composite tenant/environment keys
and foreign keys prevent cross-tenant references even when code is defective.

**Alternatives considered**:

- Query filters only: rejected by PF-011 and the normative paper.
- JWT-only authorization in RLS: insufficient for current membership, resource
  scope, policy version, step-up authentication, and approval evidence.
- Authorization cache as authority: rejected because stale permissions must not
  authorize the next request.

## Decision 7: Runtime policy, configuration, and approvals

**Decision**: Runtime policy and configuration are immutable version records with
schema version, attribution, effective window, and an atomic active-version
pointer. The deterministic evaluator combines membership, roles, explicit grants
and denials, resource/environment scope, authentication strength, policy version,
and exact approval evidence. The product policy package and `codex-hitl` policy
engine share conventions but remain separate trust domains.

**Rationale**: This satisfies PF-007, PF-015, PF-016, and PF-030 without confusing
repository approval with financial or tenant administration approval.

**Alternatives considered**:

- Mutable JSON settings: rejected because prior decisions would not be
  reproducible.
- Environment variables as tenant configuration: rejected because they are not
  tenant-scoped, attributable, reviewable, or safely publishable.
- Reusing engineering approval tokens for product actions: explicitly prohibited
  by the normative paper.

## Decision 8: Events, retries, and cache

**Decision**: Phase 1 uses a Postgres transactional outbox, a leased dispatcher
using `FOR UPDATE SKIP LOCKED`, and consumer inbox/idempotency records. The event
transport is a port so a durable external bus can be added without changing the
envelope. Use a Redis-protocol cache with Valkey for local/development tests;
cache keys always include tenant, environment, resource, and policy/config
version, and cache misses are correctness-neutral.

**Rationale**: The outbox preserves state/evidence/event atomicity without adding
an external broker before throughput demands it. A real cache in Phase 1 allows
PF-011/SC-001 isolation tests rather than treating cache isolation as theoretical.

**Alternatives considered**:

- Immediate external event bus: deferred because vendor and operational cost are
  not justified for Phase 1; the port and envelope preserve migration.
- In-memory-only cache: rejected as inadequate evidence for cross-process tenant
  namespace and invalidation behavior.
- Caching authorization decisions across requests: rejected unless the key binds
  all authoritative versions and the next request revalidates revocation state.

## Decision 9: Observability and development deployment

**Decision**: Instrument API and workers with OpenTelemetry traces/metrics,
structured JSON logs with redaction, correlation propagation, and separate audit
events. The local/development topology uses containers for web, API, workers,
Supabase, Valkey, an OpenTelemetry Collector, Prometheus, Loki, Tempo, and Grafana.
Health endpoints distinguish liveness, readiness, and dependency degradation.

**Rationale**: PF-022 and the Phase 1 exit evidence require health, logs, metrics,
traces, alerts, ownership, and recovery guidance. OpenTelemetry keeps production
backends replaceable.

**Alternatives considered**:

- Console-only telemetry: insufficient for trace correlation and alert evidence.
- Vendor-specific agents in application code: rejected because they would couple
  the platform to one observability provider.
- Browser OpenTelemetry as a gate: deferred because official browser support is
  still experimental; server spans and explicit client correlation are Phase 1.

## Decision 10: Verification and evidence

**Decision**: Root `scripts/verify.sh` remains the single entry point and invokes
locked install verification, formatting, lint, TypeScript type checking, Python
compilation/tests, unit/component/contract/integration/RLS/E2E/accessibility tests,
security and secret scans, dependency audit, container smoke, performance budgets,
traceability validation, and evidence-manifest generation. Local verification
must not claim remote CI status. CI publishes commit-bound evidence separately.

**Rationale**: The existing verifier passes only ten legacy tests and eight legacy
requirements. PF-027 through PF-029 require all HITL-001 through HITL-018 plus the
33 PF requirements to link to real artifacts and exact-source evidence.

**Alternatives considered**:

- Preserve the current three-command verifier unchanged: rejected as materially
  below the approved acceptance standard.
- Infer CI green from local tests: prohibited because remote workflow state is a
  separate evidence source.
- Store only Markdown reports: rejected; JSON is authoritative and human-readable
  Markdown is generated from the same result.

## Decision 11: Testing strategy

**Decision**: Use Vitest for TypeScript unit/component tests, Playwright for E2E
and automated accessibility checks, pgTAP and integration fixtures for real RLS,
Python `unittest` for the preserved controller, contract tests generated from
OpenAPI/JSON Schema, and k6-compatible performance scenarios. Critical policy,
state, tenant, audit, idempotency, and event code targets at least 90% statement
coverage plus meaningful branch and mutation testing.

**Rationale**: The normative paper requires layered unit, component, integration,
contract, E2E, performance, security, accessibility, and recovery evidence.

**Alternatives considered**:

- Mocked database authorization: rejected; SC-001 requires a real cross-tenant
  matrix.
- E2E-only verification: rejected because deterministic policy and state-machine
  defects need fast exhaustive tests.
- Coverage percentage as the sole quality gate: rejected by the normative paper.

## Decision 12: Engineering control-plane migration

**Decision**: Move the current Python package and its tests to
`tooling/codex-hitl` while preserving the `codex-hitl` command and Python import
name. Upgrade it in place to meet HITL-001 through HITL-018: canonical requests,
deny precedence, keyed approval verifiers, full persisted state machine,
append-only SQLite, bounded concurrent output, process-group timeouts, JSON and
Markdown traceability/evidence, and production-adapter gap documentation.

**Rationale**: PF-026 requires no behavioral regression, while PF-027 requires the
larger normative starter standard. A separate directory makes the trust boundary
and ownership explicit.

**Alternatives considered**:

- Leave the controller at repository root indefinitely: rejected because it
  blurs product and engineering dependencies.
- Rewrite it in TypeScript: rejected because it creates unnecessary behavior and
  audit migration risk.
- Freeze it unchanged: rejected because the current implementation lacks most
  mandatory HITL evidence.

## Human approval gates produced by research

Planning resolves the technical direction but does not authorize these changes:

| Gate | Approval required before |
|---|---|
| HCP-01 Dependencies | Adding Node/pnpm packages, Supabase CLI, scanners, or test tools |
| HCP-02 Public contracts | Treating proposed REST, event, error, capability, or evidence schemas as implementation authority |
| HCP-03 Persistence | Creating or applying Postgres migrations, roles, functions, triggers, or RLS policies |
| HCP-04 Infrastructure | Adding or applying container, cache, telemetry, or development deployment definitions |
| HCP-05 Engineering policy | Changing `policy.toml` semantics or approval/execution behavior |
| HCP-06 Source authority | Committing the external PDF/DOCX or an organization-resolvable controlled manifest |
| HCP-07 Deployment | Any production deployment; production activation remains out of Phase 1 |
| HCP-08 External CI/publication | Pushing repository content, submitting a pull request, or transmitting the candidate revision to remote CI |

No unresolved clarification markers remain in this planning research. Approval gates
are authorization boundaries, not unresolved design questions.
