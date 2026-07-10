# Acceptance Checklist

- [ ] `./scripts/verify.sh` passes.
- [ ] Unknown actions require approval.
- [ ] Denied actions cannot be approved or executed.
- [ ] Approval tokens expire and cannot be reused.
- [ ] Audit records contain no plaintext approval token.
- [ ] Commands execute with `shell=False`.
- [ ] Codex instructions and constitutional rules are present.
- [ ] Production limitations are documented.
