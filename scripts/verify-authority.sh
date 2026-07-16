#!/usr/bin/env bash
set -euo pipefail

script_dir="$(dirname "${BASH_SOURCE[0]}")"
repo_root="$(realpath "${script_dir}/..")"

python3 - "${repo_root}" <<'PY'
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
from typing import Any

root = Path(sys.argv[1]).resolve()
manifest_path = root / "docs/authority/final-production-paper-v3.manifest.json"

expected_metadata: dict[str, Any] = {
    "schemaVersion": 1,
    "authorityId": "final-production-paper-v3",
    "version": "v3",
    "effectiveDate": "2026-07-10",
    "owner": "7 Finger Studios",
    "classification": "Internal",
    "storageMode": "repository-artifacts",
}

expected_artifacts = [
    {
        "format": "pdf",
        "path": "docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.pdf",
        "bytes": 1_574_532,
        "sha256": "9d075a82a6088ef446442a1113f59a6023196fd5304c12a4e7eaefdedee66a61",
    },
    {
        "format": "docx",
        "path": "docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.docx",
        "bytes": 127_602,
        "sha256": "72a37bb2aec0cde1d103d98b292b4f1073f4373bf1e96a270a473438b4ecc4dc",
    },
]

def fail(message: str) -> None:
    print(f"authority: FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

for key, expected in expected_metadata.items():
    if manifest.get(key) != expected:
        fail(f"manifest field {key!r} does not match the approved value")

decision = manifest.get("decision")
if not isinstance(decision, dict):
    fail("manifest decision record is missing")

if (
    decision.get("checkpoint") != "HCP-06"
    or decision.get("option") != "A"
    or decision.get("status") != "approved"
):
    fail("manifest decision does not identify approved HCP-06 Option A")

if manifest.get("artifacts") != expected_artifacts:
    fail("manifest artifact inventory does not match the approved inventory")

for artifact in expected_artifacts:
    path = Path(artifact["path"])
    artifact_path = root / path

    if path.is_absolute() or ".." in path.parts:
        fail(f"invalid artifact path: {path}")
    if artifact_path.is_symlink() or not artifact_path.is_file():
        fail(f"artifact is missing or invalid: {path}")

    if artifact_path.stat().st_size != artifact["bytes"]:
        fail(f"size mismatch for {path}")

    digest = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
    if digest != artifact["sha256"]:
        fail(f"SHA-256 mismatch for {path}")

print(
    "authority: ok "
    f"({len(expected_artifacts)} artifacts; owner=7 Finger Studios; "
    "classification=Internal; requirement=PF-033)"
)
PY