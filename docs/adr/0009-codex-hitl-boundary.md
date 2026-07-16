# ADR-0009: Separate Python Codex HITL Trust Boundary

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: Engineering Security  
**Review date**: 2026-10-10  
**Requirements**: PF-026, PF-027, PF-032

## Context

The repository already contains a runnable Python policy/approval/execution
controller. It must remain backward compatible while being separated from product
runtime authority and upgraded to the normative HITL-001-HITL-018 standard.

## Alternatives

1. Freeze it at repository root: preserves behavior but leaves large normative
   evidence gaps and blurs product/tooling ownership.
2. Rewrite it in TypeScript: unifies language but creates unnecessary policy,
   token, state, audit, and executor migration risk.
3. Merge it with runtime product policy: explicitly rejected because development
   approval cannot authorize tenant or financial actions.

## Decision

Relocate the package to `tooling/codex-hitl` while preserving the `codex_hitl`
import, `codex-hitl` command, policy compatibility, and root `scripts/verify.sh`.
Keep deterministic policy, approvals, workflows, bounded shell-free execution,
SQLite local audit, traceability, and evidence inside this trust boundary.

Upgrade in place under HCP-05. SQLite remains local-only; a Postgres/central audit
adapter shares stable event identifiers but not product authorization.

## Consequences

- Existing users retain CLI/import compatibility.
- Python and Node toolchains coexist intentionally.
- Relocation and schema migrations need explicit compatibility and recovery tests.
- Product packages cannot bypass engineering policy for governed repository work.

## Security impact

Canonical requests, deny precedence, keyed single-use approvals, append-only audit,
argv-only `shell=False`, bounded output, timeouts/process cleanup, redaction, and
exact-revision evidence are mandatory. Product and engineering tokens are never
interchangeable.

## Rollback and migration

T029-T031 prove relocation before semantic changes. Packaging can temporarily
retain a compatibility shim. HCP-05 requires the exact SQLite/policy migration,
rollback, and test vectors before implementation.

## Validation

T114-T144 cover HITL-001-HITL-018. Final evidence includes the ten baseline cases,
project suites, non-root offline container smoke, policy/lock hashes, and exact
candidate revision.
