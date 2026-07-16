# ADR-0005: Transactional Outbox and Idempotent Inbox

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Platform Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-019, PF-020, PF-032

## Context

Sensitive state, audit evidence, and asynchronous facts cannot diverge. Phase 1
needs reliable delivery without selecting and operating an external event-bus
vendor before throughput evidence exists.

## Alternatives

1. Publish directly after commit: simple, but a crash loses the event.
2. Publish before commit: can emit facts for state that later rolls back.
3. Change-data capture: powerful, but hides domain event intent and adds
   infrastructure complexity.
4. External bus transaction: vendor-specific and still difficult to make atomic
   with Postgres.

## Decision

Write canonical state, mandatory audit, idempotency result, and immutable outbox
event in one Postgres transaction. Workers lease rows using `FOR UPDATE SKIP
LOCKED`, publish at least once through a transport port, and record attempts.
Consumers store inbox receipts keyed by consumer, tenant, and idempotency key.

Crash-after-publish is `uncertain` until reconciled; duplicate same-hash delivery
returns the prior logical result, and a conflicting hash fails visibly.

## Consequences

- Atomicity is strong with minimal Phase 1 infrastructure.
- Delivery throughput is bounded by Postgres polling until an external transport
  is justified.
- Consumers must be idempotent and reconciliation is a first-class operation.

## Security impact

The envelope includes tenant/environment, producer, subject, actor, correlation,
causation, trace, idempotency, schema version, and sanitized payload. Workers verify
tenant context on every message.

## Rollback and migration

The transport port allows an external bus without changing event contracts. During
migration, dual publication is observed and reconciled before cutover; the outbox
remains authoritative until evidence proves safe transition.

## Validation

T107-T109 and T123-T124 test atomicity, leases, duplicates, conflicts, crashes,
retries, dead letters, tenant context, and reconciliation.
