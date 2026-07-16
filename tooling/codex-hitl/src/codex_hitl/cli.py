from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from .executor import ExecutionError, execute_command
from .models import Decision, WorkflowState
from .policy import PolicyEngine, PolicyError
from .store import Store, StoreError


def root_path() -> Path:
    return Path.cwd()


def store_for(root: Path) -> Store:
    return Store(root / "runtime" / "hitl.db")


def policy_path_for(root: Path) -> Path:
    working_tree_policy = root / "policy.toml"
    if working_tree_policy.is_file():
        return working_tree_policy

    source_path = Path(__file__).resolve()
    if len(source_path.parents) > 4:
        repository_policy = source_path.parents[4] / "policy.toml"
        if repository_policy.is_file():
            return repository_policy

    return working_tree_policy


def policy_for(root: Path) -> PolicyEngine:
    return PolicyEngine.load(policy_path_for(root))


def emit(payload: object, *, as_json: bool = False) -> None:
    if as_json:
        print(json.dumps(payload, indent=2, sort_keys=True, default=str))
    elif isinstance(payload, dict):
        for key, value in payload.items():
            print(f"{key}: {value}")
    else:
        print(payload)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="codex-hitl", description="Human-in-the-loop execution controller")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("init", help="Initialize the runtime database")
    sub.add_parser("status", help="Show workflow state")

    transition = sub.add_parser("transition", help="Move workflow to a new state")
    transition.add_argument("state", choices=[s.value for s in WorkflowState])
    transition.add_argument("--actor", required=True)
    transition.add_argument("--reason", required=True)

    classify = sub.add_parser("classify", help="Classify and persist an action")
    classify.add_argument("--kind", required=True)
    classify.add_argument("--value", required=True)

    approve = sub.add_parser("approve", help="Approve a pending action")
    approve.add_argument("--action-id", required=True)
    approve.add_argument("--reviewer", required=True)
    approve.add_argument("--reason", required=True)

    reject = sub.add_parser("reject", help="Reject a pending action")
    reject.add_argument("--action-id", required=True)
    reject.add_argument("--reviewer", required=True)
    reject.add_argument("--reason", required=True)

    run = sub.add_parser("run", help="Execute a classified command action")
    run_group = run.add_mutually_exclusive_group(required=True)
    run_group.add_argument("--action-id")
    run_group.add_argument("--value")
    run.add_argument("--kind", default="command")
    run.add_argument("--approval-token")

    audit = sub.add_parser("audit", help="Show recent audit events")
    audit.add_argument("--limit", type=int, default=50)

    sub.add_parser("verify", help="Run repository verification through the policy engine")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = root_path()
    store = store_for(root)
    try:
        if args.command == "init":
            policy_for(root)
            store.initialize()
            emit({"initialized": True, "database": str(store.path)}, as_json=args.json)
            return 0

        if not store.path.exists():
            raise StoreError("Runtime is not initialized. Run: codex-hitl init")

        if args.command == "status":
            emit({"state": store.current_state().value, "database": str(store.path)}, as_json=args.json)
            return 0

        if args.command == "transition":
            store.transition(target=WorkflowState(args.state), actor=args.actor, reason=args.reason)
            emit({"state": args.state}, as_json=args.json)
            return 0

        policy = policy_for(root)

        if args.command == "classify":
            result = policy.evaluate(kind=args.kind, value=args.value)
            action_id = store.create_action(kind=args.kind, value=args.value, decision=result.decision, rule_id=result.rule_id, reason=result.reason)
            emit({"action_id": action_id, "decision": result.decision.value, "rule_id": result.rule_id, "reason": result.reason}, as_json=args.json)
            return 2 if result.decision is Decision.DENY else 0

        if args.command == "approve":
            token = store.approve(action_id=args.action_id, reviewer=args.reviewer, reason=args.reason, ttl_seconds=policy.approval_ttl_seconds)
            emit({"action_id": args.action_id, "approval_token": token, "expires_in_seconds": policy.approval_ttl_seconds}, as_json=args.json)
            return 0

        if args.command == "reject":
            store.reject(action_id=args.action_id, reviewer=args.reviewer, reason=args.reason)
            emit({"action_id": args.action_id, "status": "rejected"}, as_json=args.json)
            return 0

        if args.command in {"run", "verify"}:
            if args.command == "verify":
                value = "./scripts/verify.sh"
                token = None
                kind = "command"
                result = policy.evaluate(kind=kind, value=value)
                action_id = store.create_action(kind=kind, value=value, decision=result.decision, rule_id=result.rule_id, reason=result.reason)
            elif args.action_id:
                action_id = args.action_id
                token = args.approval_token
            else:
                value = args.value
                token = args.approval_token
                kind = args.kind
                result = policy.evaluate(kind=kind, value=value)
                action_id = store.create_action(kind=kind, value=value, decision=result.decision, rule_id=result.rule_id, reason=result.reason)

            action = store.authorize_execution(action_id=action_id, token=token)
            if action["kind"] != "command":
                raise StoreError(f"Execution adapter not implemented for kind: {action['kind']}")
            started = datetime.now(UTC)
            execution = execute_command(action["value"], cwd=root, timeout_seconds=policy.command_timeout_seconds)
            store.record_execution(action_id=action_id, started_at=started, returncode=execution.returncode, duration_ms=execution.duration_ms, stdout=execution.stdout, stderr=execution.stderr)
            emit({"action_id": action_id, "returncode": execution.returncode, "duration_ms": execution.duration_ms, "stdout": execution.stdout, "stderr": execution.stderr}, as_json=args.json)
            return execution.returncode

        if args.command == "audit":
            emit(store.audit(limit=max(1, min(args.limit, 500))), as_json=True)
            return 0

        raise AssertionError("unreachable")
    except (PolicyError, StoreError, ExecutionError) as exc:
        if getattr(args, "json", False):
            print(json.dumps({"error": str(exc)}), file=sys.stderr)
        else:
            print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
