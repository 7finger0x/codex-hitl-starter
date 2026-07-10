# Codex HITL Starter

A production-oriented starter for **specification-driven, human-in-the-loop execution with Codex CLI**.

It implements the control plane described by the project brief:

```text
Constitution -> Specification -> Plan -> Tasks -> Approval -> Execution -> Verification -> Acceptance
```

The starter is intentionally small enough to audit, but complete enough to run. It provides:

- a deterministic workflow state machine;
- policy-based action classification;
- explicit approval gates for risky actions;
- SQLite audit logging;
- command execution with timeouts and evidence capture;
- Spec Kit-compatible repository artifacts;
- Codex instructions in `AGENTS.md`;
- tests, CI, container packaging, and operational documentation.

## Security posture

The default policy is conservative:

- unknown actions require approval;
- shell commands are denied unless they match an allow rule;
- destructive and external actions require explicit approval;
- approvals are single-use and expire;
- command output is captured in an immutable audit trail;
- the controller never invokes a shell implicitly (`shell=False`).

This starter does **not** grant Codex unrestricted access. Run Codex with a workspace sandbox and on-request approvals.

## Quick start

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e .

codex-hitl init
codex-hitl status
codex-hitl classify --kind command --value "python -m unittest discover -s tests"
codex-hitl run --kind command --value "python -m unittest discover -s tests"
```

The sample policy allows the test command without manual approval. For an approval-required action:

```bash
codex-hitl classify --kind command --value "git push origin main"
codex-hitl approve --action-id <ACTION_ID> --reviewer "your-name" --reason "Reviewed release"
codex-hitl run --action-id <ACTION_ID>
```

## Spec Kit setup

Install the official GitHub-hosted Spec Kit release and initialize the Codex integration:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.12.9
specify init . --integration codex
```

The repository already contains a constitution and a first feature specification. Review generated files before overwriting existing ones.

## Codex CLI invocation

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

Ask Codex to read `AGENTS.md`, `.specify/memory/constitution.md`, and the active feature documents before changing code.

## Core commands

```text
codex-hitl init
codex-hitl status
codex-hitl transition <STATE> --actor <NAME> --reason <TEXT>
codex-hitl classify --kind <KIND> --value <VALUE>
codex-hitl approve --action-id <ID> --reviewer <NAME> --reason <TEXT>
codex-hitl reject --action-id <ID> --reviewer <NAME> --reason <TEXT>
codex-hitl run --action-id <ID>
codex-hitl audit --limit 50
codex-hitl verify
```

## Repository layout

```text
src/codex_hitl/                 application code
.specify/memory/constitution.md project principles
specs/001-.../                  specification, plan, tasks, checklist
policy.toml                     action policy
AGENTS.md                       Codex operating instructions
.codex/config.toml              recommended Codex defaults
runtime/                        local database and evidence (gitignored)
```

## Production hardening still required

Before enterprise deployment, add your organization’s identity provider, centralized policy distribution, signed audit export, secrets manager integration, and platform-specific sandboxing. The starter is production-oriented, not a substitute for organizational security controls.
