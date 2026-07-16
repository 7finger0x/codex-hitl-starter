# Codex Operating Instructions

## Required workflow

Before modifying implementation files:

1. Read `.specify/memory/constitution.md`.
2. Read the active feature's `spec.md`, `plan.md`, and `tasks.md`.
3. Confirm the requested change maps to a requirement or defect.
4. Identify unresolved ambiguity, scope expansion, and irreversible impact.
5. Present a plan for material changes before implementation.
6. Stop at tasks marked with a human checkpoint.
7. Run the verification commands in `scripts/verify.sh`.
8. Report evidence against the acceptance criteria.

## Safety boundaries

Never perform the following without explicit user approval:

- production deployment;
- force push or history rewrite;
- destructive database operation;
- deletion outside generated build artifacts;
- secret access, rotation, or disclosure;
- public API or persistence-schema change;
- dependency addition;
- disabling tests, scanners, or policy controls;
- network calls that transmit repository content;
- work outside the approved feature scope.

Never fabricate test results, approval evidence, or completion status.

## Engineering rules

- Preserve backward compatibility unless the specification explicitly permits a break.
- Use `shell=False` for subprocess execution.
- Validate all external input at the boundary.
- Keep policy evaluation deterministic and side-effect free.
- Add tests with each behavior change.
- Do not log secrets or raw environment variables.
- Record material deviations in the active feature documents.

## Completion definition

A task is complete only when implementation, tests, documentation, traceability, and verification evidence are present and all mandatory checks pass.

<!-- BEGIN SPEC KIT MANAGED CONTEXT -->
## Managed Spec Kit context

- Generator: `.specify/scripts/bash/update-agent-context.sh`
- Generation version: `spec-kit-v0.12.9+t024.1`
- Active feature: `specs/002-platform-foundation`
- Runtime baseline: Node.js 24.18.0; Python 3.11-3.13
- Package manager: pnpm 11.11.0 with lifecycle scripts disabled
- Required verification: `./scripts/verify-authority.sh` and `./scripts/verify.sh`
- Governance: read the constitution, active `spec.md`, `plan.md`, and `tasks.md`; stop at every human checkpoint
<!-- END SPEC KIT MANAGED CONTEXT -->
