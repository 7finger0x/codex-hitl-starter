# Platform Foundation Validation Quickstart

**Feature**: 002-platform-foundation  
**Purpose**: Define the runnable acceptance path for the implemented foundation  
**Current status**: Planning guide only; commands that depend on the future monorepo are not yet runnable

## Safety and Approval Prerequisites

Before using the implementation sections:

1. The completed plan and a validated task set have been explicitly approved.
2. The constitution amendment, official Spec Kit pin, controlled source-paper manifest, agent-context updater, and working-tree normalization have been approved.
3. HCP-01 has approved the exact dependency and lockfile change.
4. HCP-02 and HCP-03 have approved the public contract and persistence/RLS changes.
5. Only synthetic tenant, account, and credential data is present.
6. Docker Desktop or an equivalent container runtime is connected to WSL, and the supported Node, pnpm, Python, and Supabase tool versions are installed.

No production deployment, live account, real customer data, production secret, or live financial exposure is part of this guide.

## A. Protect the Existing Control Plane

Run before repository relocation and save the output as baseline evidence:

    python3 -m venv .venv
    . .venv/bin/activate
    python -m pip install -e .
    codex-hitl init
    codex-hitl verify
    ./scripts/verify.sh

Expected outcome:

- The command exits successfully.
- The current baseline compiles the Python source, runs ten legacy unit tests, and
  checks eight legacy requirement links. Its console output is retained with the
  documented revision and working-tree state.
- The current verifier does not run a container smoke test or emit the Phase 1
  evidence manifest; those capabilities are future tasks and must not be inferred.
- A passing legacy run is recorded only as the pre-migration baseline; it is not proof of PF-001 through PF-033 or HITL-001 through HITL-018.

After the approved Git-aware relocation, repeat the equivalent installation and verification from tooling/codex-hitl. Command behavior and recorded baseline scenarios must remain compatible.

## B. Validate the Workspace

After HCP-01 and the workspace scaffold tasks are complete:

    corepack pnpm install --frozen-lockfile
    corepack pnpm lint
    corepack pnpm typecheck
    corepack pnpm test
    corepack pnpm build

Expected outcome:

- The committed lockfile is unchanged.
- Workspace dependencies resolve only through declared workspace links.
- Lint, type checking, unit tests, contract tests, and builds pass without network-dependent test behavior.
- Generated outputs are reproducible from the identified revision.

## C. Validate Local Data and Isolation

After HCP-03 approves migrations and RLS:

    supabase start
    supabase db reset
    supabase test db

Then run the API integration profile against the local stack:

    corepack pnpm --filter @ai-trading-os/api test:integration

Expected outcome:

- A clean database builds forward from zero.
- Seed data is synthetic and deterministic.
- Tenant A cannot read, mutate, invoke, subscribe to, export, or search tenant B resources.
- Cross-tenant foreign keys fail.
- Runtime roles cannot bypass forced RLS or mutate audit history.
- Membership revocation is effective on the next authoritative request.
- Mandatory audit failure rolls back the sensitive mutation.
- Concurrent configuration activation selects one version atomically.
- Outbox retry and inbox deduplication produce one logical consumer effect.

Stop the local stack when validation is complete:

    supabase stop

## D. Exercise the API and Platform Shell

Start local services only after HCP-02 and HCP-03 approve contracts and schema:

    corepack pnpm dev

Verify:

    curl --fail http://127.0.0.1:8080/health/live
    curl --fail http://127.0.0.1:8080/health/ready

Use Playwright to execute the foundation journeys:

    corepack pnpm test:e2e
    corepack pnpm test:a11y

Expected outcome:

- A user creates a synthetic tenant, receives owner membership and a default environment, invites a member, and assigns a role.
- The user switches tenants and sees a freshly calculated capability manifest.
- Direct unauthorized calls are denied with a stable code and correlation identifier.
- Sensitive actions require the configured authentication assurance and approval evidence.
- Audit review reconstructs both successful and denied actions without cross-tenant disclosure.
- Critical journeys are keyboard-operable and report no critical automated accessibility violations.

The API behavior must conform to contracts/foundation-api.openapi.json. Event,
evidence, and trace outputs must conform to domain-event.schema.json,
evidence-manifest.schema.json, and traceability.schema.json.

## E. Verify Reliable Events and Failuro 
Run the integration fault profile:

    corepack pnpm test:failure-injection

Expected outcome:

- Replayed idempotency keys with identical requests return the prior logical outcome.
- Reused keys with different request hashes fail.
- Worker interruption releases or expires leases without losing uncertain delivery state.
- Duplicate event delivery produces one consumer effect.
- Missing audit persistence fails controlled mutations closed.
- Invalid configuration or policy activation has no partial effect.
- Logs, metrics, and traces share correlation and trace identifiers without secrets.
- A reviewer can identify the failing component, owner, and runbook within the SC-008 limit.

## F. Generate Source-Bound Evidence

Run the single repository verifier that implementation must expose:

    ./scripts/verify.sh

Expected artifacts:

- A versioned evidence manifest conforming to contracts/evidence-manifest.schema.json.
- A traceability graph conforming to contracts/traceability.schema.json.
- Check outputs and digests for Node, Python control-plane, database/RLS, contract, security, accessibility, container, and acceptance profiles.
- Exact source revision and either a clean worktree or a documented dirty-state digest.
- Zero mandatory trace gaps, dangling links, duplicate mandatory links, secret findings, critical security findings, or skipped mandatory HITL checks.

Both the CLI and shell entry points must call one verifier implementation. They must not invoke each other recursively or compute different completion decisions.

## G. Validate the Container

Build the approved multi-stage artifact, then run verification with defense-in-depth restrictions:

    docker build -t ai-trading-os-foundation:verify .
    docker run --rm --network none --read-only --cap-drop ALL --user 65532:65532 ai-trading-os-foundation:verify

Expected outcome:

- The verification image runs as a non-root user, needs no network, has a read-only root filesystem, and has no Linux capabilities.
- Health checks and evidence generation succeed using only embedded source and synthetic fixtures.
- No secret or local credential is copied into an image layer.

## H. Development Deployment Checkpoint

External deployment is not authorized by this plan. HCP-04 and HCP-08 must approve:

- the provider and environment;
- the exact source revision and artifact digest;
- configuration and secret references;
- migration and forward-recovery procedure;
- network transmission and evidence retention;
- rollback or roll-forward owner and commands.

Only after that approval may the deployment workflow run. SC-007 remains incomplete until three consecutive development deployments from the same approved revision produce equivalent configuration, migration, health, and evidence results.

## Result Interpretation

- Pass means every mandatory check and acceptance profile passed and the evidence manifest permits a completion claim.
- Fail means at least one required check failed; the manifest must identify the failure and keep the completion claim false.
- Incomplete means an approval-gated or environment-dependent check, including development deployment, has not run; it must never be reported as a pass.
