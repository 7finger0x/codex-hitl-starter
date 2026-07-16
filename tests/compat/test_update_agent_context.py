from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
SOURCE_UPDATER = REPOSITORY_ROOT / ".specify/scripts/bash/update-agent-context.sh"
START = "<!-- BEGIN SPEC KIT MANAGED CONTEXT -->"
END = "<!-- END SPEC KIT MANAGED CONTEXT -->"


class AgentContextUpdaterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.updater = self.root / ".specify/scripts/bash/update-agent-context.sh"
        self.updater.parent.mkdir(parents=True)
        shutil.copy2(SOURCE_UPDATER, self.updater)
        self.updater.chmod(0o755)

        self._write_json(
            ".specify/integration.json",
            {"version": "0.12.9", "integration": "codex"},
        )
        self._activate_feature("specs/002-alpha")
        self._write("AGENTS.md", "user prefix\n\nuser suffix\n")

    def _write(self, relative_path: str, content: str) -> None:
        path = self.root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")

    def _write_json(self, relative_path: str, value: object) -> None:
        self._write(relative_path, json.dumps(value) + "\n")

    def _activate_feature(self, feature_directory: str) -> None:
        self._write_json(
            ".specify/feature.json", {"feature_directory": feature_directory}
        )
        for name in ("spec.md", "plan.md", "tasks.md"):
            self._write(f"{feature_directory}/{name}", f"# {name}\n")

    def _run(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [str(self.updater), *arguments],
            cwd=self.root,
            check=False,
            capture_output=True,
            text=True,
            shell=False,
        )

    def test_preserves_user_content_outside_the_managed_block(self) -> None:
        prefix = "user prefix\nwith exact spacing\n\n"
        suffix = "\n\nuser suffix\nwith exact spacing\n"
        self._write(
            "AGENTS.md",
            f"{prefix}{START}\nstale generated content\n{END}{suffix}",
        )

        result = self._run("--agent", "codex", "--mode", "update")

        self.assertEqual(result.returncode, 0, result.stderr)
        updated = (self.root / "AGENTS.md").read_text(encoding="utf-8")
        start_index = updated.index(START)
        end_index = updated.index(END) + len(END)
        self.assertEqual(updated[:start_index], prefix)
        self.assertEqual(updated[end_index:], suffix)
        self.assertIn("- Active feature: `specs/002-alpha`", updated)

    def test_accepts_only_the_supported_agent(self) -> None:
        before = (self.root / "AGENTS.md").read_bytes()

        rejected = self._run("--agent", "unknown", "--mode", "update")

        self.assertEqual(rejected.returncode, 2)
        self.assertIn("unsupported agent: unknown", rejected.stderr)
        self.assertEqual((self.root / "AGENTS.md").read_bytes(), before)

        accepted = self._run("--agent", "codex", "--mode", "update")
        self.assertEqual(accepted.returncode, 0, accepted.stderr)
        checked = self._run("--agent", "codex", "--mode", "check")
        self.assertEqual(checked.returncode, 0, checked.stderr)

    def test_derives_and_updates_the_active_feature(self) -> None:
        first = self._run("--mode", "update")
        self.assertEqual(first.returncode, 0, first.stderr)
        self._activate_feature("specs/003-beta")

        drift = self._run("--mode", "check")
        preview = self._run("--mode", "dry-run")

        self.assertEqual(drift.returncode, 1)
        self.assertIn("specs/002-alpha", drift.stderr)
        self.assertIn("specs/003-beta", drift.stderr)
        self.assertEqual(preview.returncode, 0, preview.stderr)
        self.assertIn("specs/002-alpha", preview.stdout)
        self.assertIn("specs/003-beta", preview.stdout)
        self.assertIn("specs/002-alpha", (self.root / "AGENTS.md").read_text())

        updated = self._run("--mode", "update")
        self.assertEqual(updated.returncode, 0, updated.stderr)
        self.assertIn("specs/003-beta", (self.root / "AGENTS.md").read_text())

    def test_repeated_runs_are_idempotent(self) -> None:
        first = self._run("--mode", "update")
        self.assertEqual(first.returncode, 0, first.stderr)
        after_first = (self.root / "AGENTS.md").read_bytes()

        second = self._run("--mode", "update")
        after_second = (self.root / "AGENTS.md").read_bytes()
        checked = self._run("--mode", "check")
        preview = self._run("--mode", "dry-run")

        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertIn("agent-context: unchanged", second.stdout)
        self.assertEqual(after_second, after_first)
        self.assertEqual(checked.returncode, 0, checked.stderr)
        self.assertEqual(preview.returncode, 0, preview.stderr)
        self.assertEqual(preview.stdout, "")


if __name__ == "__main__":
    unittest.main()
