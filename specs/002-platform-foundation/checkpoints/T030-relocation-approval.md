# T030: Codex HITL Relocation Approval

**Status**: `approved`  
**Task**: T030  
**Requirements**: PF-026, HITL-016  
**Protected action**: removing non-generated source and packaging files from
their root paths as part of a reversible relocation

## Decision record

- **Decision**: `approved`
- **Approver**: 7 Finger Studios
- **Recorded at**: 2026-07-13T01:58:13-07:00
- **Approval statement**: "Approve the exact T030 relocation scope and
  conditions recorded in T030-relocation-approval.md"
- **Authorization boundary**: T030 only; no dependency, lockfile, public
  contract, persistence schema, infrastructure, engineering-policy semantic,
  secret, network-transmission, external-publication, or later-task authority
- **Verification amendment**: HCP-01 separately authorizes the exact
  repository-external Node.js 24.18.0 reinstall and approved read/download
  origins for T030 verification only; all other boundaries remain in force

## Requested scope

T029 proves the planned boundary preserves the `codex_hitl` import,
`codex-hitl = codex_hitl.cli:main` entry point, and exact ten-test baseline.
T030 now requires moving the established Python engineering controller behind
`tooling/codex-hitl/` while keeping the root verifier as the single entry point.

The exact source removals are:

- root `pyproject.toml`;
- `src/codex_hitl/__init__.py`, `cli.py`, `executor.py`, `models.py`, `policy.py`,
  and `store.py`;
- `tests/test_executor.py`, `tests/test_policy.py`, and `tests/test_store.py`.

The exact destination additions are:

- `tooling/codex-hitl/pyproject.toml`;
- `tooling/codex-hitl/src/codex_hitl/` with the same six package files;
- `tooling/codex-hitl/tests/` with the same three legacy test files.

T030 may also make the minimum compatibility edits required to:

- keep the project readme and root `policy.toml` resolvable without copying or
  weakening policy;
- make `scripts/verify.sh` compile and run the relocated package/tests plus root
  compatibility tests;
- update `tests/compat/test_codex_hitl_relocation.py` to validate the real
  boundary rather than its temporary projection.

## Conditions

- Use reviewed file patches rather than `git mv`; do not stage, commit, delete
  unrelated files, or rewrite history.
- Preserve file content and behavior except for path-resolution and verifier
  compatibility required by the move.
- Add no dependency, lockfile change, public contract, persistence schema,
  infrastructure, engineering-policy semantic change, secret access, network
  transmission, or external publication.
- Run the focused relocation suite, exact ten-test legacy baseline, root verifier,
  aggregate workspace verifier, and `git diff --check`.
- On failure, restore the root source layout through reviewed patches and leave
  T030 unchecked.

## Approval needed

Approve or deny the exact T030 root-source removals, destination additions, and
minimum compatibility edits above. General permission to continue is not treated
as approval for deleting these non-generated root paths.

## Implementation result

**Recorded**: 2026-07-13T02:17:26-07:00  
**Result**: `pass`; T030 is complete. T031 and later tasks remain unauthorized.

- The package metadata, six `codex_hitl` modules, and exact three-file legacy
  suite now live only under `tooling/codex-hitl/`.
- The `codex_hitl` import, `codex-hitl = codex_hitl.cli:main` entry point,
  repository README, root `policy.toml`, and root `scripts/verify.sh` entry
  point remain compatible.
- Test-first evidence captured the intended five-test failure before the move;
  the real-boundary suite now passes 5/5 and the legacy suite passes 10/10.
- The root compatibility suite passes 9/9, legacy traceability passes eight
  requirements, authority verification passes, and the aggregate workspace
  verifier passes under Node.js 24.18.0 and pnpm 11.11.0.
- The lockfile and engineering-policy hashes are unchanged, `git diff --check`
  passes, and no clean-worktree or Phase 1 completion claim is made.
- Machine-readable evidence is retained in
  `evidence/baseline/t030-codex-hitl-relocation-implementation.json`.
