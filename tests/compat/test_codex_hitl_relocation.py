from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import tomllib
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
BOUNDARY = REPOSITORY_ROOT / "tooling/codex-hitl"
LEGACY_TESTS = ("test_executor.py", "test_policy.py", "test_store.py")
PACKAGE_FILES = (
    "__init__.py",
    "cli.py",
    "executor.py",
    "models.py",
    "policy.py",
    "store.py",
)


class CodexHitlRelocationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.boundary = BOUNDARY
        self.environment = {
            "LC_ALL": "C.UTF-8",
            "PATH": os.environ["PATH"],
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONPATH": str(self.boundary / "src"),
        }

    def _run(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, *arguments],
            cwd=self.boundary,
            env=self.environment,
            check=False,
            capture_output=True,
            text=True,
            shell=False,
        )

    def test_sources_live_only_in_the_engineering_control_boundary(self) -> None:
        self.assertTrue((self.boundary / "pyproject.toml").is_file())
        self.assertFalse((REPOSITORY_ROOT / "pyproject.toml").exists())

        for name in PACKAGE_FILES:
            self.assertTrue((self.boundary / "src/codex_hitl" / name).is_file())
            self.assertFalse((REPOSITORY_ROOT / "src/codex_hitl" / name).exists())

        for name in LEGACY_TESTS:
            self.assertTrue((self.boundary / "tests" / name).is_file())
            self.assertFalse((REPOSITORY_ROOT / "tests" / name).exists())

    def test_import_name_survives_the_real_boundary(self) -> None:
        result = self._run(
            "-c", "import codex_hitl; print(codex_hitl.__name__, codex_hitl.__version__)"
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "codex_hitl 0.1.0")

    def test_codex_hitl_entry_point_and_readme_survive_the_real_boundary(self) -> None:
        metadata = tomllib.loads(
            (self.boundary / "pyproject.toml").read_text(encoding="utf-8")
        )
        self.assertEqual(
            metadata["project"]["scripts"]["codex-hitl"], "codex_hitl.cli:main"
        )
        readme = self.boundary / metadata["project"]["readme"]
        self.assertEqual(readme.resolve(), (REPOSITORY_ROOT / "README.md").resolve())
        self.assertTrue(readme.is_file())

        result = self._run(
            "-c",
            "import sys; from codex_hitl.cli import main; "
            "sys.argv = ['codex-hitl', '--help']; main()",
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("usage: codex-hitl", result.stdout)

    def test_root_policy_is_resolvable_from_the_real_boundary(self) -> None:
        result = self._run(
            "-c",
            "from pathlib import Path; from codex_hitl.cli import policy_for; "
            "print(policy_for(Path.cwd()).default_decision.value)",
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "require_approval")

    def test_legacy_ten_test_baseline_runs_from_the_real_boundary(self) -> None:
        result = self._run("-m", "unittest", "discover", "-s", "tests", "-v")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Ran 10 tests", result.stderr)
        self.assertIn("OK", result.stderr)


if __name__ == "__main__":
    unittest.main()
