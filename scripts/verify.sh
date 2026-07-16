#!/usr/bin/env bash
set -euo pipefail

controller_root="tooling/codex-hitl"
controller_source="$controller_root/src"

python3 -m compileall -q "$controller_source" "$controller_root/tests" tests
PYTHONPATH="$controller_source" python3 -m unittest discover -s "$controller_root/tests" -v
PYTHONPATH="$controller_source" python3 -m unittest discover -s tests -v
python3 scripts/check_traceability.py