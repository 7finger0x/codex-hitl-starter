from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Iterator

from .models import ActionStatus, Decision, WorkflowState


SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS workflow (
    singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
    state TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    value TEXT NOT NULL,
    value_hash TEXT NOT NULL,
    decision TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    approval_token_hash TEXT,
    approval_expires_at TEXT,
    approved_by TEXT,
    approval_reason TEXT,
    consumed_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL,
    subject_id TEXT,
    data_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id TEXT NOT NULL REFERENCES actions(id),
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    returncode INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    stdout TEXT NOT NULL,
    stderr TEXT NOT NULL
);
"""


class StoreError(RuntimeError):
    pass


def utcnow() -> datetime:
    return datetime.now(UTC)


def iso(dt: datetime | None = None) -> str:
    return (dt or utcnow()).isoformat()


class Store:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA foreign_keys=ON")
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def initialize(self) -> None:
        with self.connect() as conn:
            conn.executescript(SCHEMA)
            conn.execute(
                "INSERT OR IGNORE INTO workflow(singleton, state, updated_at) VALUES(1, ?, ?)",
                (WorkflowState.DRAFT.value, iso()),
            )
            self._audit(conn, "store_initialized", "system", None, {"database": str(self.path)})

    def current_state(self) -> WorkflowState:
        with self.connect() as conn:
            row = conn.execute("SELECT state FROM workflow WHERE singleton=1").fetchone()
            if row is None:
                raise StoreError("Store is not initialized")
            return WorkflowState(row["state"])

    def transition(self, *, target: WorkflowState, actor: str, reason: str) -> None:
        allowed = {
            WorkflowState.DRAFT: {WorkflowState.SPECIFIED, WorkflowState.REJECTED},
            WorkflowState.SPECIFIED: {WorkflowState.CLARIFIED, WorkflowState.NEEDS_DECISION, WorkflowState.REJECTED},
            WorkflowState.CLARIFIED: {WorkflowState.PLANNED, WorkflowState.NEEDS_DECISION, WorkflowState.REJECTED},
            WorkflowState.PLANNED: {WorkflowState.APPROVED, WorkflowState.NEEDS_DECISION, WorkflowState.REJECTED},
            WorkflowState.APPROVED: {WorkflowState.EXECUTING, WorkflowState.REJECTED},
            WorkflowState.EXECUTING: {WorkflowState.VERIFYING, WorkflowState.BLOCKED, WorkflowState.NEEDS_DECISION, WorkflowState.ROLLED_BACK},
            WorkflowState.VERIFYING: {WorkflowState.ACCEPTED, WorkflowState.FAILED_VERIFICATION, WorkflowState.NEEDS_DECISION},
            WorkflowState.FAILED_VERIFICATION: {WorkflowState.EXECUTING, WorkflowState.REJECTED, WorkflowState.ROLLED_BACK},
            WorkflowState.BLOCKED: {WorkflowState.EXECUTING, WorkflowState.REJECTED, WorkflowState.ROLLED_BACK},
            WorkflowState.NEEDS_DECISION: {WorkflowState.CLARIFIED, WorkflowState.PLANNED, WorkflowState.APPROVED, WorkflowState.EXECUTING, WorkflowState.REJECTED},
            WorkflowState.ACCEPTED: set(),
            WorkflowState.REJECTED: set(),
            WorkflowState.ROLLED_BACK: set(),
        }
        with self.connect() as conn:
            row = conn.execute("SELECT state FROM workflow WHERE singleton=1").fetchone()
            if row is None:
                raise StoreError("Store is not initialized")
            current = WorkflowState(row["state"])
            if target not in allowed[current]:
                raise StoreError(f"Invalid transition: {current.value} -> {target.value}")
            conn.execute("UPDATE workflow SET state=?, updated_at=? WHERE singleton=1", (target.value, iso()))
            self._audit(conn, "workflow_transition", actor, None, {"from": current.value, "to": target.value, "reason": reason})

    def create_action(self, *, kind: str, value: str, decision: Decision, rule_id: str, reason: str, actor: str = "operator") -> str:
        action_id = secrets.token_hex(12)
        value_hash = hashlib.sha256(value.encode("utf-8")).hexdigest()
        status = ActionStatus.DENIED if decision is Decision.DENY else ActionStatus.PENDING
        now = iso()
        with self.connect() as conn:
            conn.execute(
                """INSERT INTO actions(id, kind, value, value_hash, decision, rule_id, reason, status, created_at, updated_at)
                   VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (action_id, kind, value, value_hash, decision.value, rule_id, reason, status.value, now, now),
            )
            self._audit(conn, "action_classified", actor, action_id, {"kind": kind, "value_hash": value_hash, "decision": decision.value, "rule_id": rule_id, "reason": reason})
        return action_id

    def get_action(self, action_id: str) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM actions WHERE id=?", (action_id,)).fetchone()
            if row is None:
                raise StoreError(f"Unknown action: {action_id}")
            return dict(row)

    def approve(self, *, action_id: str, reviewer: str, reason: str, ttl_seconds: int) -> str:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        expires = utcnow() + timedelta(seconds=ttl_seconds)
        with self.connect() as conn:
            row = conn.execute("SELECT status, decision FROM actions WHERE id=?", (action_id,)).fetchone()
            if row is None:
                raise StoreError(f"Unknown action: {action_id}")
            if row["status"] != ActionStatus.PENDING.value:
                raise StoreError(f"Action cannot be approved from status {row['status']}")
            if row["decision"] == Decision.DENY.value:
                raise StoreError("Denied action cannot be approved")
            conn.execute(
                """UPDATE actions SET status=?, approval_token_hash=?, approval_expires_at=?, approved_by=?, approval_reason=?, updated_at=? WHERE id=?""",
                (ActionStatus.APPROVED.value, token_hash, iso(expires), reviewer, reason, iso(), action_id),
            )
            self._audit(conn, "action_approved", reviewer, action_id, {"reason": reason, "expires_at": iso(expires)})
        return token

    def reject(self, *, action_id: str, reviewer: str, reason: str) -> None:
        with self.connect() as conn:
            row = conn.execute("SELECT status FROM actions WHERE id=?", (action_id,)).fetchone()
            if row is None:
                raise StoreError(f"Unknown action: {action_id}")
            if row["status"] not in {ActionStatus.PENDING.value, ActionStatus.APPROVED.value}:
                raise StoreError(f"Action cannot be rejected from status {row['status']}")
            conn.execute("UPDATE actions SET status=?, updated_at=? WHERE id=?", (ActionStatus.REJECTED.value, iso(), action_id))
            self._audit(conn, "action_rejected", reviewer, action_id, {"reason": reason})

    def authorize_execution(self, *, action_id: str, token: str | None) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM actions WHERE id=?", (action_id,)).fetchone()
            if row is None:
                raise StoreError(f"Unknown action: {action_id}")
            action = dict(row)
            decision = Decision(action["decision"])
            if decision is Decision.DENY:
                raise StoreError("Policy denied this action")
            if action["status"] in {ActionStatus.REJECTED.value, ActionStatus.SUCCEEDED.value, ActionStatus.RUNNING.value}:
                raise StoreError(f"Action cannot run from status {action['status']}")
            if decision is Decision.REQUIRE_APPROVAL:
                if action["status"] != ActionStatus.APPROVED.value:
                    raise StoreError("Action requires approval")
                expires_raw = action["approval_expires_at"]
                if not expires_raw or datetime.fromisoformat(expires_raw) <= utcnow():
                    conn.execute("UPDATE actions SET status=?, updated_at=? WHERE id=?", (ActionStatus.EXPIRED.value, iso(), action_id))
                    raise StoreError("Approval expired")
                if not token:
                    raise StoreError("Approval token is required")
                provided = hashlib.sha256(token.encode("utf-8")).hexdigest()
                if not secrets.compare_digest(provided, action["approval_token_hash"]):
                    raise StoreError("Invalid approval token")
            conn.execute("UPDATE actions SET status=?, consumed_at=?, updated_at=? WHERE id=?", (ActionStatus.RUNNING.value, iso(), iso(), action_id))
            self._audit(conn, "execution_authorized", "executor", action_id, {"decision": decision.value})
            return action

    def record_execution(self, *, action_id: str, started_at: datetime, returncode: int, duration_ms: int, stdout: str, stderr: str) -> None:
        final = ActionStatus.SUCCEEDED if returncode == 0 else ActionStatus.FAILED
        with self.connect() as conn:
            conn.execute(
                "INSERT INTO executions(action_id, started_at, finished_at, returncode, duration_ms, stdout, stderr) VALUES(?, ?, ?, ?, ?, ?, ?)",
                (action_id, iso(started_at), iso(), returncode, duration_ms, stdout, stderr),
            )
            conn.execute("UPDATE actions SET status=?, updated_at=? WHERE id=?", (final.value, iso(), action_id))
            self._audit(conn, "execution_completed", "executor", action_id, {"returncode": returncode, "duration_ms": duration_ms, "status": final.value})

    def audit(self, limit: int = 50) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute("SELECT * FROM audit_events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def _audit(conn: sqlite3.Connection, event_type: str, actor: str, subject_id: str | None, data: dict[str, Any]) -> None:
        conn.execute(
            "INSERT INTO audit_events(created_at, event_type, actor, subject_id, data_json) VALUES(?, ?, ?, ?, ?)",
            (iso(), event_type, actor, subject_id, json.dumps(data, sort_keys=True, separators=(",", ":"))),
        )
