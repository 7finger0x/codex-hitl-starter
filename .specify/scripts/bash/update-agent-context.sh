#!/usr/bin/env bash
set -euo pipefail

script_dir="$(dirname "${BASH_SOURCE[0]}")"
repo_root="$(realpath "${script_dir}/../../..")"

exec python3 - "${repo_root}" "$@" <<'PY'
from __future__ import annotations

import argparse
import difflib
import json
from pathlib import Path, PurePosixPath
import re
import sys


START = "<!-- BEGIN SPEC KIT MANAGED CONTEXT -->"
END = "<!-- END SPEC KIT MANAGED CONTEXT -->"
GENERATION_VERSION = "spec-kit-v0.12.9+t024.1"


def fail(message: str) -> None:
    print(f"agent-context: FAIL: {message}", file=sys.stderr)
    raise SystemExit(2)


parser = argparse.ArgumentParser(
    description="Check, preview, or update the repository-owned Spec Kit context block."
)
parser.add_argument("--mode", choices=("check", "dry-run", "update"), required=True)
parser.add_argument("--agent", default="codex")
args = parser.parse_args(sys.argv[2:])

if args.agent != "codex":
    fail(f"unsupported agent: {args.agent}")

root = Path(sys.argv[1]).resolve()
feature_state_path = root / ".specify/feature.json"
integration_path = root / ".specify/integration.json"
agents_path = root / "AGENTS.md"

try:
    feature_state = json.loads(feature_state_path.read_text(encoding="utf-8"))
    integration = json.loads(integration_path.read_text(encoding="utf-8"))
except FileNotFoundError as exc:
    fail(f"required state file is missing: {exc.filename}")
except (OSError, UnicodeError, json.JSONDecodeError) as exc:
    fail(f"repository state cannot be read as JSON: {exc}")

feature_value = feature_state.get("feature_directory")
if not isinstance(feature_value, str):
    fail("feature_directory must be a string")
feature_path = PurePosixPath(feature_value)
if (
    feature_path.is_absolute()
    or ".." in feature_path.parts
    or not re.fullmatch(r"specs/[0-9]{3}-[a-z0-9][a-z0-9-]*", feature_value)
):
    fail("feature_directory is not a valid repository-relative feature path")

resolved_feature = (root / Path(*feature_path.parts)).resolve()
try:
    resolved_feature.relative_to(root)
except ValueError:
    fail("feature_directory resolves outside the repository")
for required_name in ("spec.md", "plan.md", "tasks.md"):
    if not (resolved_feature / required_name).is_file():
        fail(f"active feature is missing {required_name}")

if integration.get("version") != "0.12.9":
    fail("integration version must be exactly 0.12.9")
if integration.get("integration") != "codex":
    fail("active integration must be codex")

block = "\n".join(
    (
        START,
        "## Managed Spec Kit context",
        "",
        "- Generator: `.specify/scripts/bash/update-agent-context.sh`",
        f"- Generation version: `{GENERATION_VERSION}`",
        f"- Active feature: `{feature_value}`",
        "- Runtime baseline: Node.js 24.18.0; Python 3.11-3.13",
        "- Package manager: pnpm 11.11.0 with lifecycle scripts disabled",
        "- Required verification: `./scripts/verify-authority.sh` and `./scripts/verify.sh`",
        "- Governance: read the constitution, active `spec.md`, `plan.md`, and `tasks.md`; stop at every human checkpoint",
        END,
    )
)

try:
    current = agents_path.read_text(encoding="utf-8")
except (FileNotFoundError, OSError, UnicodeError) as exc:
    fail(f"AGENTS.md cannot be read: {exc}")

start_count = current.count(START)
end_count = current.count(END)
if start_count == 0 and end_count == 0:
    expected = current.rstrip("\n") + "\n\n" + block + "\n"
elif start_count == 1 and end_count == 1:
    start_index = current.index(START)
    end_index = current.index(END, start_index) + len(END)
    expected = current[:start_index] + block + current[end_index:]
else:
    fail("AGENTS.md has malformed or duplicate managed-context markers")

diff = "".join(
    difflib.unified_diff(
        current.splitlines(keepends=True),
        expected.splitlines(keepends=True),
        fromfile="AGENTS.md (current)",
        tofile="AGENTS.md (expected)",
    )
)

if args.mode == "check":
    if current != expected:
        print(diff, file=sys.stderr, end="")
        raise SystemExit(1)
    print(f"agent-context: ok ({feature_value}; {GENERATION_VERSION})")
elif args.mode == "dry-run":
    print(diff, end="")
else:
    if current != expected:
        agents_path.write_text(expected, encoding="utf-8", newline="\n")
        print(f"agent-context: updated ({feature_value}; {GENERATION_VERSION})")
    else:
        print(f"agent-context: unchanged ({feature_value}; {GENERATION_VERSION})")
PY
