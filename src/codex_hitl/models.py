from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Decision(StrEnum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    DENY = "deny"


class ActionStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    DENIED = "denied"
    EXPIRED = "expired"


class WorkflowState(StrEnum):
    DRAFT = "DRAFT"
    SPECIFIED = "SPECIFIED"
    CLARIFIED = "CLARIFIED"
    PLANNED = "PLANNED"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    ACCEPTED = "ACCEPTED"
    BLOCKED = "BLOCKED"
    NEEDS_DECISION = "NEEDS_DECISION"
    FAILED_VERIFICATION = "FAILED_VERIFICATION"
    REJECTED = "REJECTED"
    ROLLED_BACK = "ROLLED_BACK"


@dataclass(frozen=True)
class PolicyResult:
    decision: Decision
    rule_id: str
    reason: str


@dataclass(frozen=True)
class ExecutionResult:
    returncode: int
    stdout: str
    stderr: str
    duration_ms: int
