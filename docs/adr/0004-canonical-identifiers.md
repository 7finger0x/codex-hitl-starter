# ADR-0004: UUIDv7 Canonical Identifiers

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Data Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-003, PF-019, PF-032

## Context

Canonical identifiers must remain stable across APIs, events, storage, audit,
evidence, and future extracted services. They must not expose tenant-local sequence
counts and should preserve practical database index locality.

## Alternatives

1. UUIDv4: portable and simple, but random write locality is less favorable.
2. Prefixed text IDs such as `ten_...`: readable, but enlarge every index and
   require custom generation semantics.
3. Numeric sequences: compact, but disclose cardinality and are unsafe as global
   public identifiers.

## Decision

Use application-generated UUIDv7 values stored as native Postgres `uuid` and
exposed as opaque UUID strings. TypeScript branded types prevent accidental entity
substitution. Do not add a second public-ID column in Phase 1.

Permission codes use stable `resource.action`, events use
`domain.past_fact.vN`, and errors use `UPPER_SNAKE_CASE`. Identifiers are never used
as authorization proof.

## Consequences

- Time ordering improves index locality while retaining global uniqueness.
- A reviewed UUIDv7 implementation is a dependency under HCP-01.
- Human-readable type context comes from schemas and views rather than ID prefixes.

## Security impact

UUIDs reduce trivial enumeration but do not replace authorization or RLS. Logs and
telemetry apply classification and pseudonymization rules to tenant identifiers.

## Rollback and migration

Before persistence, switch algorithms by updating this ADR and contracts. After
data exists, keep UUID columns stable; any external display alias is additive and
must never replace the canonical ID or create authorization ambiguity.

## Validation

T047 provides uniqueness, ordering, serialization, round-trip, cross-type, and
database tests. Contract tests ensure UUID formatting remains opaque.
