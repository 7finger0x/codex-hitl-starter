import tempfile
import unittest
from pathlib import Path

from codex_hitl.models import Decision, WorkflowState
from codex_hitl.store import Store, StoreError


class StoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name) / "db.sqlite")
        self.store.initialize()

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_initial_state(self) -> None:
        self.assertEqual(self.store.current_state(), WorkflowState.DRAFT)

    def test_valid_transition(self) -> None:
        self.store.transition(target=WorkflowState.SPECIFIED, actor="test", reason="ready")
        self.assertEqual(self.store.current_state(), WorkflowState.SPECIFIED)

    def test_invalid_transition(self) -> None:
        with self.assertRaises(StoreError):
            self.store.transition(target=WorkflowState.ACCEPTED, actor="test", reason="skip")

    def test_approval_is_single_use(self) -> None:
        action_id = self.store.create_action(kind="command", value="echo hello", decision=Decision.REQUIRE_APPROVAL, rule_id="default", reason="test")
        token = self.store.approve(action_id=action_id, reviewer="alice", reason="reviewed", ttl_seconds=60)
        self.store.authorize_execution(action_id=action_id, token=token)
        with self.assertRaises(StoreError):
            self.store.authorize_execution(action_id=action_id, token=token)

    def test_denied_action_cannot_run(self) -> None:
        action_id = self.store.create_action(kind="command", value="bad", decision=Decision.DENY, rule_id="deny", reason="test")
        with self.assertRaises(StoreError):
            self.store.authorize_execution(action_id=action_id, token=None)


if __name__ == "__main__":
    unittest.main()
