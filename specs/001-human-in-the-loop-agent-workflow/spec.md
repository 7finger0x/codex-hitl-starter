# Feature Specification: Human-in-the-Loop Agent Workflow

## Problem

Per-command approval creates consent fatigue and weak oversight. The system needs plan-level governance, risk-based checkpoints, deterministic policy decisions, and verifiable execution evidence.

## Goals

- Classify proposed actions before execution.
- Permit low-risk, reversible actions without repeated approval.
- Require explicit approval for risky actions.
- Deny prohibited actions.
- Record a tamper-evident-ready audit trail.
- Track feature workflow state from draft through acceptance.

## Non-goals

- Replacing the operating-system sandbox.
- Providing identity federation in the starter.
- Automatically deploying to production.
- Executing arbitrary shell pipelines.

## Requirements

- **REQ-001:** The system shall implement explicit workflow states and validate transitions.
- **REQ-002:** The system shall classify actions as allow, require approval, or deny using deterministic policy rules.
- **REQ-003:** The system shall require a single-use, expiring approval token for approval-gated execution.
- **REQ-004:** The system shall execute commands without invoking a shell.
- **REQ-005:** The system shall capture return code, bounded stdout, bounded stderr, and duration.
- **REQ-006:** The system shall record classification, approval, rejection, transition, and execution events in SQLite.
- **REQ-007:** The default policy shall require approval for unmatched actions.
- **REQ-008:** The repository shall provide automated verification and requirement traceability checks.

## Acceptance scenarios

1. A verification command is classified as allowed and executes successfully without approval.
2. `git push` is classified as requiring approval and cannot execute before a valid approval token is supplied.
3. An approval token cannot authorize the same action twice.
4. A command containing shell metacharacters is denied.
5. An invalid workflow transition is rejected and does not change persisted state.
6. Every mandatory requirement appears in the task plan and verification suite.
