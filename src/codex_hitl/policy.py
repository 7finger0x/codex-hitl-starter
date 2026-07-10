from __future__ import annotations

import fnmatch
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .models import Decision, PolicyResult


@dataclass(frozen=True)
class Rule:
    id: str
    decision: Decision
    kinds: tuple[str, ...]
    patterns: tuple[str, ...]
    reason: str


class PolicyError(ValueError):
    pass


class PolicyEngine:
    def __init__(self, *, default_decision: Decision, rules: tuple[Rule, ...], approval_ttl_seconds: int, command_timeout_seconds: int) -> None:
        self.default_decision = default_decision
        self.rules = rules
        self.approval_ttl_seconds = approval_ttl_seconds
        self.command_timeout_seconds = command_timeout_seconds

    @classmethod
    def load(cls, path: Path) -> "PolicyEngine":
        try:
            data = tomllib.loads(path.read_text(encoding="utf-8"))
        except (OSError, tomllib.TOMLDecodeError) as exc:
            raise PolicyError(f"Unable to load policy: {exc}") from exc

        if data.get("version") != 1:
            raise PolicyError("Unsupported policy version; expected version = 1")

        try:
            default_decision = Decision(data.get("default_decision", "require_approval"))
            ttl = int(data.get("approval_ttl_seconds", 1800))
            timeout = int(data.get("command_timeout_seconds", 300))
        except (ValueError, TypeError) as exc:
            raise PolicyError(f"Invalid top-level policy setting: {exc}") from exc

        if ttl <= 0 or timeout <= 0:
            raise PolicyError("approval_ttl_seconds and command_timeout_seconds must be positive")

        rules: list[Rule] = []
        for raw in data.get("rules", []):
            rules.append(cls._parse_rule(raw))
        return cls(default_decision=default_decision, rules=tuple(rules), approval_ttl_seconds=ttl, command_timeout_seconds=timeout)

    @staticmethod
    def _parse_rule(raw: dict[str, Any]) -> Rule:
        required = {"id", "decision", "kinds", "patterns", "reason"}
        missing = required - raw.keys()
        if missing:
            raise PolicyError(f"Rule missing fields: {', '.join(sorted(missing))}")
        try:
            return Rule(
                id=str(raw["id"]),
                decision=Decision(raw["decision"]),
                kinds=tuple(str(v) for v in raw["kinds"]),
                patterns=tuple(str(v) for v in raw["patterns"]),
                reason=str(raw["reason"]),
            )
        except (TypeError, ValueError) as exc:
            raise PolicyError(f"Invalid rule {raw.get('id', '<unknown>')}: {exc}") from exc

    def evaluate(self, *, kind: str, value: str) -> PolicyResult:
        normalized_kind = kind.strip().lower()
        normalized_value = " ".join(value.strip().split())
        if not normalized_kind or not normalized_value:
            raise PolicyError("kind and value must be non-empty")

        for rule in self.rules:
            if normalized_kind not in rule.kinds:
                continue
            if any(fnmatch.fnmatchcase(normalized_value, pattern) for pattern in rule.patterns):
                return PolicyResult(rule.decision, rule.id, rule.reason)
        return PolicyResult(self.default_decision, "default", "No explicit policy rule matched.")
