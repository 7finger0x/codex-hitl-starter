# Architecture Overview

```text
Operator / Codex
      |
      v
  CLI boundary
      |
      +--> PolicyEngine (pure decision)
      |
      +--> Store (workflow, approvals, audit)
      |
      +--> Executor (argv-safe subprocess)
```

## Trust boundaries

1. CLI input is untrusted and validated.
2. Policy is trusted repository configuration and should require code review.
3. Approval tokens are bearer credentials: keep them out of logs and chat transcripts.
4. Executed programs remain untrusted; use Codex and OS sandboxing.
5. SQLite is a local evidence store, not an immutable enterprise audit ledger.
