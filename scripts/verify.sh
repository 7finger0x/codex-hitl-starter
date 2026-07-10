#!/usr/bin/env bash
set -euo pipefail
python3 -m compileall -q src tests
PYTHONPATH=src python3 -m unittest discover -s tests -v
python3 scripts/check_traceability.py
