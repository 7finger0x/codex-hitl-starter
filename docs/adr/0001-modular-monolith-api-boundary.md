# ADR-0001: Modular Monolith and Authoritative API Boundary

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Platform Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-031, PF-032

## Context

Phase 1 must establish identity, tenancy, authorization, audit, configuration,
events, evidence, UI, and operations without forcing premature distributed
transactions. The normative paper permits an initial modular monolith while
requiring stable extraction boundaries and a separate engineering control plane.

## Alternatives

1. Microservices from Phase 1: independent scaling, but materially more deployment,
   consistency, and incident surface before load or ownership justifies it.
2. Next.js-only application: fewer runtimes, but no independent authoritative API
   for workers, SDKs, integrations, and non-web clients.
3. Extend the Python controller into the product backend: fewer languages, but
   violates the TypeScript-first product baseline and mixes trust domains.

## Decision

Use `apps/web`, `apps/api`, and `apps/workers`. `apps/api` is the authoritative
command/query and transaction boundary; `apps/web` is an accessible UI and
session-aware consumer; `apps/workers` processes asynchronous work. Domain logic
lives in packages with enforced ownership and dependency direction. Preserve the
Python engineering controller under `tooling/codex-hitl`.

Extract a service only when measured load, availability, deployment cadence, or
team ownership warrants it. Extraction must retain public contracts, tenant
enforcement, audit semantics, event envelopes, and idempotency.

## Consequences

- Sensitive state, audit, and outbox writes can share one Postgres transaction.
- Package boundaries require CI enforcement to avoid a distributed monolith later.
- API and worker runtimes add operational cost compared with Next.js alone.
- Future services can be extracted behind existing ports without client redesign.

## Security impact

Browser code cannot mutate sensitive tables directly. Authentication,
authorization, request context, audit, idempotency, and validation remain in the
API/domain boundary. The engineering controller cannot authorize product actions.

## Rollback and migration

Before production data, rollback removes unused runtime scaffolding while retaining
contracts and packages. After data exists, packages remain in the monolith until a
tested extraction uses the outbox, dual-read verification, and reversible routing.

## Validation

T025 establishes boundaries. Dependency-cycle, contract, integration, and
representative-extension tests prove packages can be consumed without direct table
mutation or source forks. Final evidence is recorded during T166-T168.
