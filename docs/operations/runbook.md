# Operations Runbook

## Initialize

```bash
codex-hitl init
```

## Review workflow state

```bash
codex-hitl status
codex-hitl audit --limit 100
```

## Approve an action

1. Inspect the exact action value and policy reason.
2. Confirm scope, reversibility, target environment, and rollback.
3. Approve with a named reviewer and specific reason.
4. Supply the returned token only to the execution invocation.

## Incident response

- Stop further execution.
- Preserve `runtime/hitl.db` and relevant repository state.
- Review audit and execution records.
- Rotate any potentially exposed credentials outside this tool.
- Update the policy or specification before resuming.

## Backup

Use SQLite's online backup mechanism or stop writers before copying the database. Protect backups as sensitive operational data.
