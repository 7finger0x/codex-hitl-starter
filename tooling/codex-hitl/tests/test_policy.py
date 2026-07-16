import tempfile
import unittest
from pathlib import Path

from codex_hitl.models import Decision
from codex_hitl.policy import PolicyEngine


class PolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        repository_root = Path(__file__).resolve().parents[3]
        self.engine = PolicyEngine.load(repository_root / "policy.toml")

    def test_allows_verification(self) -> None:
        result = self.engine.evaluate(kind="command", value="python -m unittest discover -s tests")
        self.assertEqual(result.decision, Decision.ALLOW)

    def test_requires_approval_for_push(self) -> None:
        result = self.engine.evaluate(kind="command", value="git push origin main")
        self.assertEqual(result.decision, Decision.REQUIRE_APPROVAL)

    def test_denies_shell_metacharacters(self) -> None:
        result = self.engine.evaluate(kind="command", value="git status && rm -rf /tmp/x")
        self.assertEqual(result.decision, Decision.DENY)

    def test_unknown_defaults_to_approval(self) -> None:
        result = self.engine.evaluate(kind="command", value="echo hello")
        self.assertEqual(result.decision, Decision.REQUIRE_APPROVAL)


if __name__ == "__main__":
    unittest.main()
