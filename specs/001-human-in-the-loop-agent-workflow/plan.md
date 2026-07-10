# Implementation Plan

## Architecture

A local Python CLI acts as the control plane. `PolicyEngine` performs pure policy evaluation. `Store` persists workflow, action, approval, audit, and execution records in SQLite. `executor` runs argv-safe commands with `shell=False`. `cli` composes these components.

## Security model

- Deny shell metacharacters at policy level.
- Parse commands with `shlex.split` and run with `shell=False`.
- Store only approval-token hashes.
- Use constant-time token comparison.
- Expire and consume approvals.
- Bound captured output to 200 KB per stream.
- Default unmatched actions to approval.

## Persistence

SQLite in WAL mode under `runtime/hitl.db`. Runtime data is excluded from source control.

## Testing

Unit tests cover policy decisions, state transitions, approval semantics, denied execution, and non-shell command execution. A traceability script ensures every requirement is represented in `tasks.md`.

## Rollback

The implementation is additive. Remove `runtime/` to reset local state. Source rollback uses normal Git history.

## Risks

- Local SQLite is not a centralized audit service.
- Local reviewer identity is self-asserted.
- Policy glob matching is intentionally simple and must be organization-reviewed.
- OS-level sandboxing remains the responsibility of Codex and the host platform.
