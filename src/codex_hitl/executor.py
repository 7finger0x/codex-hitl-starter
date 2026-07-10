from __future__ import annotations

import shlex
import subprocess
import time
from pathlib import Path

from .models import ExecutionResult


class ExecutionError(RuntimeError):
    pass


def execute_command(command: str, *, cwd: Path, timeout_seconds: int) -> ExecutionResult:
    try:
        argv = shlex.split(command, posix=True)
    except ValueError as exc:
        raise ExecutionError(f"Invalid command syntax: {exc}") from exc
    if not argv:
        raise ExecutionError("Command cannot be empty")

    started = time.monotonic()
    try:
        completed = subprocess.run(
            argv,
            cwd=cwd,
            shell=False,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
            env=None,
        )
    except FileNotFoundError as exc:
        raise ExecutionError(f"Executable not found: {argv[0]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ExecutionError(f"Command exceeded timeout of {timeout_seconds}s") from exc

    return ExecutionResult(
        returncode=completed.returncode,
        stdout=completed.stdout[-200_000:],
        stderr=completed.stderr[-200_000:],
        duration_ms=int((time.monotonic() - started) * 1000),
    )
