import tempfile
import unittest
from pathlib import Path

from codex_hitl.executor import execute_command


class ExecutorTests(unittest.TestCase):
    def test_executes_without_shell(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = execute_command("python -c 'print(42)'", cwd=Path(tmp), timeout_seconds=10)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.strip(), "42")


if __name__ == "__main__":
    unittest.main()
