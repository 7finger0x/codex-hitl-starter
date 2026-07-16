# Codex HITL Directory Instructions

These instructions apply throughout `tooling/codex-hitl/` and supplement the root
`AGENTS.md`. All root instructions remain in force. If a local instruction and a
root instruction differ, obey the stricter rule and stop rather than weakening a
control.

## Checkpoint boundaries

- Stop and request exact approval under HCP-05 before changing engineering policy,
  approval-token semantics, workflow transitions, audit persistence, command
  admission, sandbox behavior, or executor semantics.
- Stop at HCP-01 before changing Python dependencies or lockfiles, at HCP-08
  before any remote publication, and at the applicable project checkpoint before
  executing a protected operation through this controller.

## Engineering control rules

- Keep policy evaluation deterministic, schema-validated, side-effect free, and
  fail closed. Denial and approval requirements cannot be converted to allow by
  generative judgment or fallback behavior.
- Execute subprocesses with argument arrays and `shell=False`. Validate the
  executable, workspace, path, input, allowlisted environment, timeout, process
  group, resource bounds, and output limits before execution.
- Bind every approval to the exact request, repository, revision, policy, actor,
  target, expiry, and single-use state. Never invent, reuse, broaden, or log an
  approval token.
- Never access, disclose, log, or place a secret or raw environment value into AI
  context, evidence, errors, command output, or SQLite records.
- Preserve the `codex_hitl` import name, `codex-hitl` CLI name, legacy aliases,
  Python 3.11-3.13 compatibility, and the ten-test legacy baseline unless an
  approved specification explicitly changes them.
- SQLite is a local engineering-control store only; it is not a production
  platform persistence adapter or authority for product actions.

## Verification

- Write failing unit, compatibility, concurrency, timeout, redaction, recovery,
  and evidence tests before behavior changes.
- Verification must expose failures, truncation, unavailable checks, dirty state,
  and approval gaps. It must never manufacture a pass from intent or partial
  execution.

