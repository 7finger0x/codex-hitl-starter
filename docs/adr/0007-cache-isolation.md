# ADR-0007: Tenant-Aware Non-Authoritative Cache

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Platform Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-010, PF-011, PF-032

## Context

PF-011 and SC-001 require cache isolation to be tested, while PF-009 and PF-010
forbid stale access data from authorizing the next request. A real multi-process
cache is needed for evidence, but it cannot become a source of truth.

## Alternatives

1. No cache: simplest correctness, but does not exercise the required cache
   isolation contract and may not meet performance goals.
2. Process memory only: cannot prove cross-process namespace or invalidation.
3. Cache authorization as authority: rejected because revocation would be stale.

## Decision

Use a Redis-protocol port with Valkey in local/development after HCP-04. Every key
includes deployment environment, tenant, tenant environment, resource type/ID,
and applicable policy/config/resource version. Central builders prevent ad hoc key
construction. Values carry classification and bounded TTL.

Cache misses and outages are correctness-neutral. Authorization revalidates fresh
membership/revocation state; cached capability manifests are display artifacts,
not authorization tokens. Version changes invalidate or orphan old keys safely.

## Consequences

- Cross-process isolation and performance can be tested realistically.
- A cache service and client add dependency/operations cost.
- Version-rich keys use more memory but make stale state visibly non-current.

## Security impact

No secrets, raw tokens, or unredacted evidence enter cache. Tenant collision tests,
key inspection controls, TLS/auth in non-local environments, bounded retention, and
fail-closed authorization paths are mandatory.

## Rollback and migration

Disable cache reads/writes and fall back to canonical stores. Flush only explicitly
scoped disposable/local namespaces; production deletion requires approval. A later
provider implements the same port and key contract.

## Validation

T049, T057, and T078 test namespace collisions, invalidation, outages, stale
authority, and cross-tenant denial.
