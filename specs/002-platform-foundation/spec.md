# Feature Specification: Platform Foundation

**Feature Branch**: 002-platform-foundation (not created; no before_specify hook is configured)

**Created**: 2026-07-10

**Status**: Approved for planning

**Approval**: User approval recorded in the Codex task on 2026-07-10. This approval authorizes planning only; implementation and the high-impact actions identified below remain separately governed.

**Input**: Transform the current Codex HITL starter into the foundation of the Unified AI Trading Operating System and Hermes Protocol, preserve the engineering control plane as a dedicated tool boundary, and use Final Production Paper v3 as the normative product and acceptance authority.

**Source Authority**:

- Final Production Paper v3, effective 2026-07-10, supersedes the earlier product charter and architecture where they conflict.
- PDF SHA-256: 9d075a82a6088ef446442a1113f59a6023196fd5304c12a4e7eaefdedee66a61.
- DOCX SHA-256: 72a37bb2aec0cde1d103d98b292b4f1073f4373bf1e96a270a473438b4ecc4dc.
- This feature covers Phase 1 only. Later product capabilities remain architecturally supported but are not delivered by this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish an Isolated Organization (Priority: P1)

A tenant administrator creates an organization, selects an operating environment, invites members, and assigns roles and resource scope without exposing any other tenant's data or permissions.

**Why this priority**: Every later trading, coaching, risk, AI, and Hermes workflow depends on trustworthy identity, tenancy, and isolation.

**Independent Test**: Create two organizations with overlapping users and resource names, exercise allowed and denied operations with real authorization context, and prove that neither organization can observe or mutate the other's records.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no organization, **When** the user creates an organization, **Then** an active tenant, owner membership, default environment, and attributable audit record are created together.
2. **Given** an organization administrator, **When** the administrator invites a member and assigns a role, **Then** the member receives only the capabilities granted for that organization and environment.
3. **Given** a user who belongs to two organizations, **When** the user changes active organization, **Then** data, permissions, configuration, and navigation are recalculated for the selected context.
4. **Given** a valid user from another organization, **When** the user attempts any cross-tenant read or mutation, **Then** the operation is denied without revealing whether the target resource exists and the attempt is auditable.

---

### User Story 2 - Access Only Authorized Capabilities (Priority: P1)

An authenticated user enters a capability-aware platform shell that exposes only the actions allowed by membership, role, resource scope, environment, authentication strength, and current policy.

**Why this priority**: Hiding controls is not authorization; the foundation must make correct access decisions before product modules are added.

**Independent Test**: Exercise the same protected actions across representative roles, environments, resources, and authentication states, and verify that user-visible capabilities and authoritative decisions remain consistent.

**Acceptance Scenarios**:

1. **Given** an active membership, **When** the user opens the platform, **Then** the user sees the correct organization, environment, and permitted capability set.
2. **Given** a user who lacks permission for an action, **When** the user calls the action directly rather than through the interface, **Then** the action is denied with a stable error and correlation identifier.
3. **Given** a high-risk administrative action, **When** policy requires stronger authentication or approval, **Then** the action remains blocked until the required evidence is present.
4. **Given** a membership, role, or policy change, **When** the user makes the next request, **Then** stale permissions cannot authorize an action.

---

### User Story 3 - Review Complete Operational Evidence (Priority: P1)

A security, compliance, or operations reviewer can reconstruct who changed a sensitive resource, under which tenant and environment, why it changed, what policy applied, and whether the change succeeded.

**Why this priority**: Evidence-based governance and incident response are mandatory system invariants, not later reporting enhancements.

**Independent Test**: Perform representative identity, authorization, configuration, and administrative changes, then reconstruct each decision using only retained audit and evidence records.

**Acceptance Scenarios**:

1. **Given** a sensitive change, **When** it succeeds or fails, **Then** the evidence records actor, tenant, environment, resource, action, reason, correlation, decision, policy reference, outcome, and time.
2. **Given** an attempted change whose mandatory audit record cannot be persisted, **When** the action is evaluated, **Then** the sensitive mutation fails closed.
3. **Given** a reviewer scoped to one organization, **When** the reviewer searches or exports audit evidence, **Then** unrelated organizations' evidence is not disclosed.
4. **Given** a privileged support action, **When** temporary access expires, **Then** further access is denied and the complete access lifecycle remains reviewable.

---

### User Story 4 - Operate a Verifiable Development Foundation (Priority: P2)

A platform operator can prepare a development environment, apply validated configuration and data changes, observe service health, diagnose failures, and produce evidence tied to the exact source revision.

**Why this priority**: A repeatable, observable foundation is required before feature teams can safely deliver trading or Hermes modules.

**Independent Test**: Starting from a clean environment, initialize the platform, validate configuration and migrations, deploy to development, induce a controlled failure, diagnose it from telemetry, recover, and generate a verification manifest.

**Acceptance Scenarios**:

1. **Given** a clean supported development environment, **When** initialization is run, **Then** prerequisites, configuration, schema state, and service health are validated with actionable output.
2. **Given** an invalid or unknown configuration version, **When** startup or publication is attempted, **Then** activation is rejected without partial application.
3. **Given** a failed data change or deployment, **When** recovery is initiated, **Then** the system returns to a documented consistent state or reports that forward recovery is required.
4. **Given** a verification run, **When** all mandatory checks pass, **Then** the evidence identifies the exact source revision, policy versions, checks, warnings, and results.

---

### User Story 5 - Extend the Platform Without Re-platforming (Priority: P2)

A product or integration team can add a tenant-scoped capability while reusing the foundation's identity, authorization, policy, audit, event, configuration, and evidence contracts.

**Why this priority**: Phase sequencing must not create a domain-model dead end or turn temporary delivery choices into permanent product limitations.

**Independent Test**: Define a representative tenant-scoped capability and prove it can participate in the standard contracts without changing their canonical identifiers or bypassing controls.

**Acceptance Scenarios**:

1. **Given** a new capability, **When** it is registered, **Then** its exposure can vary by tenant, role, environment, resource, and policy without a source-code fork.
2. **Given** a new sensitive action, **When** it is introduced, **Then** authorization, audit, error, event, observability, and evidence requirements apply consistently.
3. **Given** a future broker, provider, chain, model, or asset module, **When** it is added, **Then** the foundation does not impose an undocumented architecture-level cap or exclusive vendor assumption.

### Edge Cases

- A user belongs to multiple tenants and has different roles or environment access in each.
- A membership is suspended, removed, or changed while sessions and background jobs are active.
- Two administrators concurrently invite the same user or update the same role assignment.
- A request has a missing, malformed, stale, or conflicting tenant or environment context.
- A service identity attempts to reuse a human session or operate outside its assigned scope.
- An authorization cache disagrees with the current membership or policy version.
- Mandatory audit persistence, event publication, or evidence generation becomes unavailable.
- A retry delivers the same event or job more than once.
- Configuration is syntactically valid but references an unavailable capability or incompatible version.
- Production secrets or live account identifiers are accidentally supplied to a lower environment.
- A migration succeeds partially, fails during verification, or cannot be reversed safely.
- Telemetry is delayed or incomplete during an incident.
- A platform administrator needs temporary customer support access.
- A future capability needs a new resource type without weakening existing tenant isolation.

## Requirements *(mandatory)*

### Scope Boundaries

**In scope**:

- Organization, user, membership, environment, role, permission, and service-identity foundations.
- Tenant isolation, capability discovery, conditional authorization, audit, configuration, events, evidence, observability, development deployment, security baseline, and architecture decisions.
- Preservation and acceptance-hardening of the existing Codex HITL engineering control plane.
- An accessible platform shell sufficient to exercise identity, tenancy, authorization, configuration, and operator health flows.

**Out of scope for Phase 1**:

- Trade journaling, risk calculations, market briefings, AI coaching, broker or exchange execution, market-data analytics, and Hermes liquidity workflows.
- Production activation, real customer migration, real financial accounts, live credentials, or live financial exposure.
- Jurisdiction-specific certification, billing, commercial packaging, and enterprise identity rollout.

These exclusions control delivery order only. They must not become permanent architecture restrictions or require redesign of canonical tenancy, policy, event, audit, evidence, or integration contracts when later phases begin.

### Functional Requirements

#### Identity, Tenancy, and Environments

- **PF-001**: The platform MUST support individual, team, coaching, enterprise, Hermes operator, hybrid, and explicitly privileged internal tenant models through the same tenant boundary.
- **PF-002**: A user MUST be able to hold independent memberships, roles, teams, resource scopes, and statuses in multiple tenants.
- **PF-003**: Every tenant-scoped request, record, event, job, cache entry, stored object, and evidence artifact MUST carry an explicit tenant context or be declared globally scoped.
- **PF-004**: Tenant environments MUST independently scope membership access, configuration, policy, integrations, secrets references, and capability exposure.
- **PF-005**: Human authentication MUST support secure session creation, revocation, history, stronger authentication for high-risk actions, and future enterprise federation without changing user identity.
- **PF-006**: Non-human workloads MUST use distinct service identities with explicit tenant, environment, resource, and action scope.

#### Authorization and Isolation

- **PF-007**: Authorization MUST combine stable role bundles with resource, environment, authentication, policy, and approval conditions.
- **PF-008**: Administrators MUST be able to define custom roles and permission bundles without changing canonical identity or resource contracts.
- **PF-009**: Every protected action MUST be denied unless all applicable authorization and policy conditions allow it; a denial at any enforcement boundary MUST stop the action.
- **PF-010**: User-visible capabilities MUST be derived from current authoritative access context, while direct action requests remain independently authorized.
- **PF-011**: Tenant isolation MUST cover reads, writes, functions, stored objects, realtime delivery, background work, caches, exports, audit search, and future analytical retrieval.
- **PF-012**: Privileged platform support access MUST require a separate role, explicit reason, stronger authentication, limited duration, customer scope, and complete audit evidence.

#### Audit, Configuration, and Secrets

- **PF-013**: Every sensitive mutation and authorization decision MUST produce an append-only evidence record with actor, tenant, environment, resource, action, reason, correlation, policy reference, before/after references where applicable, outcome, and time.
- **PF-014**: Audit evidence MUST be tenant-isolated, searchable, exportable with integrity metadata, and protected from ordinary update or deletion paths.
- **PF-015**: Configuration and policy MUST be schema-validated, versioned, attributable, environment-scoped, and rejected atomically when invalid or incompatible.
- **PF-016**: High-impact configuration changes MUST be auditable and capable of requiring review or approval before activation.
- **PF-017**: Secrets and credentials MUST be represented by opaque references, excluded from user interfaces, AI context, logs, traces, exceptions, analytics, exports, fixtures, and ordinary application records.
- **PF-018**: Production secrets and live account identifiers MUST NOT propagate automatically to development, test, preview, or sandbox environments.

#### Events, Errors, and Operations

- **PF-019**: Domain events MUST identify tenant, environment, event type and version, producer, subject, correlation, causation, time, idempotency key, trace context, and a schema-valid payload.
- **PF-020**: Retried or duplicate event and job delivery MUST NOT produce duplicate logical effects, and uncertain delivery MUST remain visible until reconciled.
- **PF-021**: User-visible and integration errors MUST include a stable code, correlation identifier, actionable explanation, and retry guidance without disclosing sensitive or cross-tenant information.
- **PF-022**: Operators MUST have health, logs, metrics, traces, alerts, ownership, and runbook guidance sufficient to detect, diagnose, and recover from foundation failures.
- **PF-023**: Environment initialization, configuration validation, data changes, deployment, rollback, and forward recovery MUST be repeatable and produce machine-readable evidence.
- **PF-024**: Data changes MUST preserve compatibility across rolling transitions, verify both clean and representative existing states, and require an explicit forward-recovery path when reversal is unsafe.
- **PF-025**: The user-facing foundation MUST support keyboard operation, responsive layouts, accessible names and status, and localization-ready content.

#### Engineering Governance and Extensibility

- **PF-026**: The existing Codex HITL engineering controls MUST remain operational without behavioral regression during repository restructuring.
- **PF-027**: Phase 1 MUST NOT be accepted until the engineering control plane provides evidence for HITL-001 through HITL-018 from the exact source revision under review.
- **PF-028**: Every mandatory Phase 1 requirement MUST trace to approved tasks, implementation, automated tests, acceptance checks, and retained evidence with no missing, duplicate, or dangling mandatory links.
- **PF-029**: Completion and readiness claims MUST be generated only from machine-readable evidence tied to an identified source revision and an explicitly clean or documented working-tree state.
- **PF-030**: Product capability exposure, operational thresholds, and future execution modes MUST be configurable by tenant, environment, resource, role, and policy rather than embedded as permanent architecture exclusions.
- **PF-031**: A representative new tenant-scoped capability MUST be addable without changing canonical identity, tenancy, authorization, audit, event, configuration, or evidence contracts.
- **PF-032**: Material architecture choices MUST record context, alternatives, decision, consequences, security impact, rollback or migration path, owner, and review date.
- **PF-033**: The source paper and its verified hashes MUST be preserved as version-controlled project authority or through a version-controlled manifest that resolves to controlled artifacts before implementation acceptance.

### Key Entities

- **Tenant**: An isolated customer, operator, coaching, enterprise, hybrid, or internal organization boundary.
- **User**: A human identity that may participate in multiple tenants.
- **Membership**: A tenant-specific relationship containing status, roles, teams, environment access, and resource scope.
- **Role and Permission Grant**: Stable capability bundles and explicit grants or denials evaluated within tenant and environment context.
- **Environment**: A logical operating context that scopes policy, configuration, credentials, data exposure, and allowed capabilities.
- **Service Identity**: A non-human actor with short-lived, narrowly scoped authority.
- **Capability Manifest**: The current user-visible capability set derived from authoritative access and policy context.
- **Configuration Version**: An attributable, validated, environment-scoped set of operational values.
- **Policy Version**: The effective rules used to evaluate access, approval, and capability exposure.
- **Audit Event**: Append-only evidence for security-sensitive decisions and mutations.
- **Domain Event**: A versioned, tenant-aware fact used for reliable downstream processing.
- **Delivery Record**: Retry, idempotency, progress, and reconciliation state for asynchronous work.
- **Evidence Manifest**: A source-revision-bound inventory of checks, policies, artifacts, warnings, failures, and outcomes.
- **Architecture Decision**: A reviewed record of a material choice and its operational consequences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The complete cross-tenant test matrix denies 100% of prohibited reads, writes, functions, stored-object access, realtime access, background work, exports, and audit searches with zero disclosed target data.
- **SC-002**: 100% of tested protected actions produce the same allow or deny outcome across user-visible capability checks and authoritative action enforcement.
- **SC-003**: A tenant administrator can create an organization, select an environment, invite a member, and assign a role in under 10 minutes without platform-operator intervention.
- **SC-004**: 100% of tested sensitive mutations either persist complete audit evidence or fail without applying the mutation.
- **SC-005**: For at least 95% of representative interactive test runs, authorized users receive their tenant-scoped landing state or an actionable error within 2 seconds.
- **SC-006**: A clean supported development environment can be initialized, validated, and made ready for feature work in under 15 minutes using documented steps.
- **SC-007**: Three consecutive development deployments complete successfully from the same approved source revision and produce equivalent configuration, migration, health, and evidence results.
- **SC-008**: During controlled failure exercises, an operator can identify the affected component and locate its owner and recovery procedure within 5 minutes.
- **SC-009**: Every mandatory PF requirement has at least one linked acceptance scenario, automated test target, and evidence target; the traceability report contains zero mandatory gaps or dangling links.
- **SC-010**: Verification reports zero unaccepted critical security or tenant-isolation findings and zero detected secret disclosures.
- **SC-011**: The engineering control plane passes all HITL-001 through HITL-018 acceptance checks without skipped mandatory checks before any Phase 1 completion statement is allowed.
- **SC-012**: A representative tenant-scoped capability can be registered and exercised without modifying the canonical identity, tenancy, authorization, audit, event, configuration, or evidence contracts.
- **SC-013**: All critical foundation user journeys are keyboard-operable and have no critical automated accessibility violations.
- **SC-014**: Every material architecture decision required for Phase 1 has an approved decision record, named owner, and review date before implementation acceptance.

## Assumptions

- Final Production Paper v3 is the normative authority; the shorter June 28 charter and architecture are supporting sources only where consistent.
- The current repository will become the unified platform repository, and the existing Codex HITL starter will remain a dedicated engineering-control component.
- Phase 1 targets local, continuous-integration, preview, and development environments. Production activation is a later governed release decision.
- Phase 1 uses synthetic or sandbox data and credentials; no real customer, production secret, or live financial account is required.
- Live trading and Hermes operations are not exposed in Phase 1, but their future contracts cannot require redesign of the foundation.
- Technology and vendor selections from the normative paper will be confirmed in the implementation plan and architecture decisions; this specification defines outcomes rather than implementation.
- New dependencies, public contracts, persistence schemas, destructive changes, and external deployments require separate explicit approval during planning or implementation.
- Existing Git history will be preserved; force-push, history rewrite, and production deployment are outside this feature.
- The current working-tree mode changes and generated Spec Kit files must be reconciled before a clean baseline or completion claim is created.
- The normative paper or a controlled artifact manifest must be brought into version-controlled project context before implementation acceptance.

### Requirement-to-Acceptance Map

| Requirement group | Primary user stories | Measurable outcomes |
|---|---|---|
| PF-001 - PF-006 | Story 1 | SC-001, SC-003 |
| PF-007 - PF-012 | Stories 1-2 | SC-001, SC-002, SC-005 |
| PF-013 - PF-018 | Story 3 | SC-004, SC-010 |
| PF-019 - PF-025 | Story 4 | SC-005 - SC-008, SC-013 |
| PF-026 - PF-029 | Story 4 | SC-009, SC-011 |
| PF-030 - PF-033 | Story 5 | SC-012, SC-014 |
