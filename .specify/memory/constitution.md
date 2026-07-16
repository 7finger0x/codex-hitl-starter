<!--
Sync Impact Report
- Version change: unversioned seven-article baseline -> 2.0.0
- Modified principles:
  - Specification precedes implementation -> I. Specification before implementation
  - Human judgment controls irreversible decisions -> IV. Human authority for governed actions
  - Verification is mandatory -> VII. Evidence before completion
  - Scope is traceable -> VI. Traceability
  - Deviations are explicit -> X. No silent bypass and Governance
  - Context is repository-owned -> I, VI, and Governance
  - Autonomy increases through evidence -> VII and Governance
- Added principles:
  - II. Full capability without arbitrary architecture limits
  - III. Deterministic control before generative judgment
  - V. Safe command execution
  - VIII. Tenant, secret, and data isolation
  - IX. Reversible delivery
  - X. No silent bypass
- Removed principles: none; all prior obligations are preserved or strengthened
- Dependent templates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ .specify/templates/checklist-template.md
  - ✅ .specify/templates/constitution-template.md remains generic scaffolding
  - ✅ .specify/templates/commands/ contains no files
- Runtime guidance:
  - ✅ README.md is compatible and already names the approved official Spec Kit pin
  - ✅ Existing AGENTS.md rules remain compatible and in force
  - ⚠ AGENTS.md managed context synchronization is deferred to T024/T027 after HCP-01
- Deferred placeholders: none
-->
# Unified AI Trading OS and Codex HITL Constitution

## Core Principles

### I. Specification before implementation

Material behavior MUST be defined in an approved specification with measurable
acceptance criteria and an implementation plan before implementation begins.
Durable context MUST live in version-controlled repository artifacts rather than
only in an agent transcript. Every change MUST remain within the approved feature
or an explicitly recorded defect or technical necessity.

### II. Full capability without arbitrary architecture limits

The architecture MUST support the approved product scope without hidden,
hard-coded exclusions or undocumented vendor, asset, provider, model, chain, or
execution caps. Operational exposure MUST be controlled through tenant,
environment, resource, role, configuration, approval, and policy boundaries.
Delivery phases MAY defer capabilities but MUST NOT make the deferral a permanent
architecture restriction.

### III. Deterministic control before generative judgment

Authorization, policy precedence, state transitions, risk limits, token
validation, tenant boundaries, idempotency, and command admission MUST be
deterministic, schema-validated, side-effect controlled, and fail closed.
Generative or probabilistic output MUST NOT replace these controls or invent
their inputs, decisions, approvals, or evidence.

### IV. Human authority for governed actions

Destructive, externally visible, security-sensitive, financially material,
scope-expanding, or explicitly checkpointed actions MUST have attributable human
approval for the exact action, target, and reviewed artifact state. An agent MUST
NOT invent, infer, reuse outside scope, or self-issue approval. Silence and broad
permission to continue MUST NOT approve an unrelated checkpoint.

### V. Safe command execution

Commands MUST use structured argument arrays and shell=False semantics whenever a
subprocess API is used. Execution MUST validate the executable, paths, working
directory, input, and allowlisted environment; bound time, output, and resources;
terminate the process tree on timeout or cancellation; and retain sanitized
results. Raw environment variables, credentials, and unbounded child processes
MUST NOT cross the execution boundary.

### VI. Traceability

Every mandatory requirement MUST link to approved tasks, implementation
artifacts, automated tests, acceptance checks, evidence, and the exact source
revision. Missing, duplicate, malformed, unknown, or dangling mandatory links
MUST block completion. Material deviations MUST record their rationale, impact,
owner, recovery, and validation before acceptance.

### VII. Evidence before completion

Success, readiness, and completion claims MUST derive from objective,
machine-readable checks bound to source, policy, configuration, dependency, and
working-tree identity. Failed, skipped, degraded, truncated, unavailable, or
approval-gated checks MUST NOT be reported as passing. Autonomy MAY increase only
through an explicit policy change supported by repeated successful evidence and
human review.

### VIII. Tenant, secret, and data isolation

Every platform and engineering boundary MUST preserve tenant, environment,
identity, credential, and data classification. Secrets and raw environment values
MUST NOT enter logs, traces, errors, AI context, analytics, exports, fixtures, or
ordinary application records. Development tooling MUST NOT bypass platform
privacy, tenancy, row-level security, or credential controls.

### IX. Reversible delivery

Every material change MUST include rollback or tested forward recovery
proportional to its impact. Compatibility MUST be preserved across rolling
changes unless an approved specification permits a break. Destructive,
irreversible, public-contract, persistence-schema, and production changes MUST
receive their separate approval and recovery evidence before execution.

### X. No silent bypass

Failures, exceptions, policy overrides, degraded verification, truncation,
unavailable dependencies, unsupported claims, and temporary deviations MUST be
visible in output and durable evidence. Tests, scanners, policy gates, approval
checks, audit persistence, and tenant controls MUST NOT be silently disabled,
weakened, skipped, or treated as successful.

## Engineering and Security Constraints

- External input MUST be validated at the boundary before it reaches domain,
  policy, persistence, execution, or integration logic.
- Policy evaluation MUST remain deterministic and side-effect free.
- Every behavior change MUST include proportionate automated tests; documentation-
  only changes MUST include objective inspection or validation evidence.
- Backward compatibility MUST be preserved unless the approved specification and
  migration plan explicitly permit a break.
- Logs and evidence MUST contain stable correlation identifiers and sanitized
  reason codes without secrets or cross-tenant disclosure.
- Dependencies, public contracts, persistence schemas, infrastructure, engineering
  policy, repository publication, and deployment MUST stop at their applicable
  human checkpoints.

## Delivery and Review Workflow

1. Read this constitution, AGENTS.md, and the active specification, plan, and tasks.
2. Confirm that requested work maps to an approved requirement, defect, or
   documented technical necessity.
3. Identify ambiguity, scope expansion, irreversible impact, trust boundaries,
   checkpoint requirements, and recovery before changing implementation.
4. Write failing or otherwise objective verification before the corresponding
   behavior when the task plan requires test-first delivery.
5. Stop at every human checkpoint until its exact scope is explicitly approved.
6. Run the repository verifier and task-specific checks after each material change.
7. Report results against acceptance criteria without inferring unavailable
   evidence, remote CI status, deployment state, or completion.

## Governance

This constitution is the repository's highest engineering-governance authority.
Specifications, plans, tasks, templates, policies, and runtime guidance MUST
comply. A conflict MUST be resolved by changing the dependent artifact, not by
silently weakening or reinterpreting this constitution.

Amendments require a proposed version, rationale, impact assessment, migration
plan, dependent-template review, and explicit human approval. Semantic versioning
applies: MAJOR for incompatible principle removal or redefinition, MINOR for new
principles or materially stronger guidance, and PATCH for non-semantic
clarification. Amendment history MUST NOT be rewritten.

Every feature plan MUST perform a constitution check before research and after
design. Every task plan MUST include applicable governance, verification,
security, traceability, recovery, and checkpoint work. Readiness review MUST
confirm compliance and record any permitted, time-bounded deviation with owner,
expiry, compensating controls, and evidence.

**Version**: 2.0.0 | **Ratified**: 2026-07-10 | **Last Amended**: 2026-07-10
