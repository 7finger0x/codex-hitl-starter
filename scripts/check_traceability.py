#!/usr/bin/env python3
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
spec = (root / "specs/001-human-in-the-loop-agent-workflow/spec.md").read_text(encoding="utf-8")
tasks = (root / "specs/001-human-in-the-loop-agent-workflow/tasks.md").read_text(encoding="utf-8")
requirements = set(re.findall(r"\bREQ-\d{3}\b", spec))
referenced = set(re.findall(r"\bREQ-\d{3}\b", tasks))
missing = sorted(requirements - referenced)
unknown = sorted(referenced - requirements)
if missing or unknown:
    if missing:
        print("Requirements without tasks:", ", ".join(missing), file=sys.stderr)
    if unknown:
        print("Unknown task requirement references:", ", ".join(unknown), file=sys.stderr)
    raise SystemExit(1)
print(f"traceability: ok ({len(requirements)} requirements)")
