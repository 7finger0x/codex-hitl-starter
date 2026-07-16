# Supabase Directory Instructions

These instructions apply throughout `supabase/` and supplement the root
`AGENTS.md`. All root instructions remain in force. If a local instruction and a
root instruction differ, obey the stricter rule and stop rather than weakening a
control.

## Checkpoint boundaries

- Stop and request exact approval under HCP-03 before creating, applying, or
  changing any migration, table, column, type, index, function, trigger, role,
  grant, storage policy, seed contract, or RLS policy.
- Approval must identify the exact migration diff, disposable target, commands,
  rollback or forward-recovery path, and tenant-isolation evidence.
- Never perform a destructive database operation without separate exact approval.
  Production work also requires HCP-07 and remains outside Phase 1.

## Migration and RLS rules

- Use forward-only, ordered, immutable migration files. Never edit an applied
  migration or hide an incompatible change in seed data.
- Every tenant-owned row carries `tenant_id`; environment-scoped rows also carry
  `environment_id`. Tenant ownership must participate in relevant unique and
  foreign keys.
- Enable and force RLS on tenant tables. Runtime roles must not own those tables,
  receive `BYPASSRLS`, or inherit an owner path around policy evaluation.
- Establish verified request context transaction-locally and test pooled
  connection reuse for context leakage.
- Append-only audit, published configuration and policy versions, and delivered
  evidence must reject unauthorized update or deletion.
- Seeds and fixtures must be synthetic, deterministic, tenant-labelled, and free
  of secrets or production identifiers.

## Verification

- Write failing migration, grant, RLS, cross-tenant, empty-state, prior-state,
  rollback, and forward-recovery tests before applying an approved change.
- Run verification against a disposable non-production target and retain exact
  schema, policy, role, command, and source-revision evidence.

