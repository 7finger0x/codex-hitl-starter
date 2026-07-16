# Infrastructure Directory Instructions

These instructions apply throughout `infra/` and supplement the root
`AGENTS.md`. All root instructions remain in force. If a local instruction and a
root instruction differ, obey the stricter rule and stop rather than weakening a
control.

## Checkpoint boundaries

- Stop and request exact approval under HCP-04 before creating, changing, or
  applying an infrastructure definition, container topology, network, volume,
  cache, telemetry service, environment manifest, or deployment command.
- HCP-04 approval is target-specific and does not authorize production. Any
  production activation, live credential, customer migration, or financial
  exposure requires HCP-07; Phase 1 retains a production no-go.
- Pushing infrastructure changes or transmitting them to remote CI requires the
  exact HCP-08 publication approval.

## Infrastructure rules

- Keep local, CI, preview, development, staging, and production topology
  explicit. A non-production setting must never silently select a production
  account, network, database, bucket, or endpoint.
- Reference a secret by opaque name only. Never embed, read, echo, template,
  persist, or transmit a secret or raw environment value.
- Pin images, tools, modules, actions, and deployable artifacts to reviewed
  immutable versions or digests. Do not fetch or build mutable production inputs
  during deployment.
- Use non-root identities, least privilege, bounded resources, health gates,
  isolated networks, and disposable development volumes. Destructive volume or
  state operations require exact approval.
- Every material infrastructure change needs tested rollback or forward recovery,
  ownership, observability, and a sanitized machine-readable result.

## Verification

- Validate and test definitions without applying them until the applicable HCP
  names the exact target and command.
- Failed, drifted, skipped, locally substituted, or unavailable infrastructure
  checks remain visible and cannot support a readiness claim.

