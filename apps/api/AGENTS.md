# API Directory Instructions

These instructions apply throughout `apps/api/` and supplement the root
`AGENTS.md`. All root instructions remain in force. If a local instruction and a
root instruction differ, obey the stricter rule and stop rather than weakening a
control.

## Checkpoint boundaries

- Stop and request exact approval under HCP-02 before treating a proposed public
  contract, event schema, error vocabulary, or cross-service shape as
  implementation authority.
- Stop at HCP-03 before adding or changing a database migration, role, function,
  trigger, grant, persistence schema, or RLS policy.
- Stop at HCP-01 before any dependency or lockfile change and at HCP-04 before
  infrastructure or deployment changes.

## API boundary rules

- `apps/api` is the authoritative command, query, authorization, and transaction
  boundary. Browser or worker code must not bypass it for protected mutations.
- Validate all external input at the HTTP, credential, header, identifier, and
  serialization boundary. Unknown or malformed input fails closed.
- Re-evaluate authentication, tenant and environment context, authorization,
  resource version, idempotency, and required approval for every protected
  command. Cached capability data is never authority.
- Persist sensitive state, mandatory audit evidence, and required outbox records
  atomically. If mandatory evidence cannot be written, roll back the mutation.
- Return stable opaque errors and correlation identifiers without disclosing
  another tenant's existence, policy internals, credentials, or raw input.
- Keep domain behavior in the owning package. API routes may orchestrate through
  package ports but must not create cross-domain write shortcuts or import UI
  code.

## Verification

- Write failing boundary, contract, authorization, tenant-isolation, and
  transaction tests before implementing behavior.
- Run the relevant package tests plus the root verification commands. A skipped,
  unavailable, or approval-gated check is not a pass.

