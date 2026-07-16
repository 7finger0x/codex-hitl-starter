# ADR-0006: Immutable Policy and Configuration Versions

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Security and Product Policy  
**Review date**: 2026-10-10  
**Requirements**: PF-007, PF-015, PF-016, PF-032

## Context

Authorization and operational decisions must be reproducible from attributable,
schema-valid inputs. Mutable settings or environment-only tenant configuration
cannot explain historical decisions or support safe review/canary/rollback.

## Alternatives

1. Mutable JSON rows: easy edits, but historical decisions become unreproducible.
2. Environment variables: appropriate for deployment bootstrapping, not tenant,
   environment, attribution, approval, or publication lifecycle.
3. Reuse the engineering policy engine/tokens: rejected because repository and
   product actions are separate trust domains.

## Decision

Policy and configuration content is immutable after publication. Versions include
schema version, content hash, author, validation/compatibility results, review and
approval evidence, effective window, and supersession. Activation changes one
tenant/environment active pointer atomically after all checks.

Policy evaluation is deterministic and uses exactly `allow`,
`require_approval`, or `deny`; deny wins. Unknown schema/condition/version or
unavailable authority fails closed. Product and engineering approval records,
keys, stores, and authorization remain separate.

## Consequences

- Historical decisions remain reproducible and auditable.
- Version storage and lifecycle management add operational complexity.
- Rollback is a new attributable pointer change, not history mutation.

## Security impact

High-impact activation can require exact resource-version approval and step-up
authentication. Secret material is prohibited; only classified opaque references
may appear. Production references cannot activate in lower environments.

## Rollback and migration

Select the prior approved compatible version atomically. Incompatible changes need
an expand/contract window and tested forward recovery. Published content is never
edited or deleted through ordinary paths.

## Validation

T074-T079 and T094-T103 verify determinism, precedence, schema compatibility,
approval binding, secret boundaries, atomic activation, and stale-access denial.
