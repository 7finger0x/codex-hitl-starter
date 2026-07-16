# ADR-0003: REST, OpenAPI, and JSON Schema Contract Authority

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: API Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-021, PF-031, PF-032

## Context

Web, worker, SDK, integration, and future service consumers need one stable,
runtime-validated vocabulary for commands, resources, errors, events,
configuration, capabilities, traceability, and evidence.

## Alternatives

1. GraphQL as the authority: flexible reads, but weaker fit for command idempotency,
   explicit resource versions, stable external errors, and event interoperability.
2. Zod-only schemas: productive TypeScript validation, but adds translation paths
   for JSON Schema and OpenAPI consumers.
3. Handwritten handlers and documentation: rejected because drift is not
   detectable enough for PF-028.

## Decision

Versioned REST commands/resources are authoritative. JSON Schema is the portable
validation contract, TypeBox-backed types serve TypeScript, and OpenAPI 3.1 is
generated/published from the same schemas. Fastify validates complete request and
response schemas. GraphQL may later provide a read-only facade.

Mutations carry authentication, tenant/environment context, idempotency,
correlation, and expected version. Responses carry version, correlation, audit
reference, and warnings. Errors use stable uppercase codes, safe details, retry
classification, and guidance.

## Consequences

- Cross-language consumers share explicit contracts and contract tests.
- Schema generation becomes a protected build step.
- Flexible internal reads may require view-specific endpoints until an optional
  read facade is justified.

## Security impact

All external input is validated at the boundary with unknown properties rejected
where appropriate. Errors and examples are scanned for secrets and cross-tenant
disclosure. Sensitive mutations never rely on UI visibility.

## Rollback and migration

Backward-compatible additions remain in v1. Breaking changes require a new major
contract, migration window, consumer inventory, dual support where necessary, and
approved ADR. Generated output is reproducible from the prior approved schema.

## Validation

HCP-02 approves the exact contracts. T033-T035 establish generation and
compatibility tests; each story adds contract/E2E evidence.
