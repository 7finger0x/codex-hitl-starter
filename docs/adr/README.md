# Architecture Decision Record Index

Architecture decisions for Platform Foundation follow the repository constitution
and PF-032. Proposed records describe the planning direction under review but do not
fabricate the designated owner review required by SC-014.

| ADR | Decision | Status | Owner | Review date | Requirements | SHA-256 |
|---|---|---|---|---|---|---|
| [ADR-0001](0001-modular-monolith-api-boundary.md) | Modular monolith and separate API boundary | Proposed | Platform Architecture | 2026-10-10 | PF-031, PF-032 | Pending evidence phase |
| [ADR-0002](0002-shared-schema-tenancy-rls.md) | Shared-schema tenancy and forced RLS | Proposed | Security Architecture | 2026-10-10 | PF-003, PF-011, PF-032 | Pending evidence phase |
| [ADR-0003](0003-rest-json-schema-contracts.md) | REST/OpenAPI/JSON Schema authority | Proposed | API Architecture | 2026-10-10 | PF-021, PF-031, PF-032 | Pending evidence phase |
| [ADR-0004](0004-canonical-identifiers.md) | UUIDv7 canonical identifiers | Proposed | Data Architecture | 2026-10-10 | PF-003, PF-019, PF-032 | Pending evidence phase |
| [ADR-0005](0005-transactional-outbox-inbox.md) | Transactional outbox/inbox | Proposed | Platform Architecture | 2026-10-10 | PF-019, PF-020, PF-032 | Pending evidence phase |
| [ADR-0006](0006-policy-configuration-versioning.md) | Immutable policy/configuration versions | Proposed | Security and Product Policy | 2026-10-10 | PF-007, PF-015, PF-016, PF-032 | Pending evidence phase |
| [ADR-0007](0007-cache-isolation.md) | Tenant-aware non-authoritative cache | Proposed | Platform Architecture | 2026-10-10 | PF-010, PF-011, PF-032 | Pending evidence phase |
| [ADR-0008](0008-observability-topology.md) | OpenTelemetry observability topology | Proposed | SRE | 2026-10-10 | PF-022, PF-032 | Pending evidence phase |
| [ADR-0009](0009-codex-hitl-boundary.md) | Separate Python HITL trust boundary | Proposed | Engineering Security | 2026-10-10 | PF-026, PF-027, PF-032 | Pending evidence phase |
| [ADR-0010](0010-source-authority.md) | Normative source preservation | Accepted for implementation | Product Architecture | 2026-10-10 | PF-033, SC-014 | Pending evidence phase |

## Record requirements

Every ADR contains context, evaluated alternatives, decision, consequences,
security impact, rollback or migration path, owner, review date, requirement links,
and validation evidence. Material changes require an updated or superseding ADR;
history is not rewritten.

During T167, the verifier computes each approved ADR checksum, compares the index
to the implemented architecture, and records the result in
`evidence/architecture/adr-review.json`.
