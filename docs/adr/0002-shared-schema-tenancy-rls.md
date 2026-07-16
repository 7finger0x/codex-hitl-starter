# ADR-0002: Shared-Schema Tenancy with Forced Row-Level Security

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Security Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-003, PF-011, PF-032

## Context

Every tenant-scoped record, request, object, cache entry, job, event, export, and
evidence artifact must carry explicit tenant context. Query filters alone cannot
provide the required cross-tenant defense in depth.

## Alternatives

1. Database per tenant: strong physical isolation, but excessive provisioning,
   migration, analytics, and operational cost for Phase 1.
2. Application query filters: simple, but one missed predicate leaks data.
3. JWT-only database policy: useful identity input, but insufficient for current
   membership, environment, resource, authentication, policy, and approval state.

## Decision

Use shared-schema Supabase Postgres. Every tenant-owned table includes `tenant_id`;
environment-scoped tables also include `environment_id`. Composite keys and foreign
keys prevent cross-tenant relationships. The API validates identity, resolves fresh
access context, and sets transaction-local database context for a non-owner,
non-`BYPASSRLS` role. Tenant tables enable and force RLS before runtime grants.

Global tables are explicitly allowlisted. Storage, cache, events, jobs, realtime,
exports, audit, future vectors, and analytics retain tenant/environment namespace.

## Consequences

- Shared operations and migrations remain manageable.
- Policy design and real database attack tests become mandatory for every table.
- Connection pooling must prove transaction-local context cannot leak.
- Exceptional service access requires narrow functions, review, and audit.

## Security impact

The cross-tenant matrix exercises select, insert, update, delete, functions,
storage, cache, jobs, subscriptions, exports, audit, and service/support paths.
Opaque denial responses do not reveal whether another tenant's resource exists.

## Rollback and migration

RLS is never disabled as rollback. Faulty policy changes use forward migrations or
revert to the last verified policy while affected capabilities fail closed. A later
database-per-tenant option requires dual validation and unchanged canonical IDs.

## Validation

T037-T042 establish the schema controls. T055-T056 and the final security evidence
must show zero prohibited cross-tenant disclosure.
