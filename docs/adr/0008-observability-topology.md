# ADR-0008: OpenTelemetry Observability Topology

**Status**: Proposed  
**Date**: 2026-07-10  
**Owner**: SRE  
**Review date**: 2026-10-10  
**Requirements**: PF-022, PF-032

## Context

Operators must correlate requests, transactions, events, jobs, cache/storage calls,
and controlled failures across logs, metrics, traces, alerts, ownership, and
runbooks without coupling application code to one monitoring vendor.

## Alternatives

1. Console logs only: insufficient for distributed correlation and alert evidence.
2. Vendor-specific application agents: faster vendor setup, but create lock-in and
   make local/CI evidence inconsistent.
3. Browser tracing as a Phase 1 gate: deferred because browser instrumentation is
   not needed to prove server-side transaction and worker correlation.

## Decision

Use OpenTelemetry APIs/OTLP for server traces and metrics plus structured JSON logs
with common service/version/environment/correlation/trace fields. Local/development
uses an OTEL Collector with Prometheus, Loki, Tempo, and Grafana after HCP-04.

Liveness, readiness, and degradation are distinct. Alerts include owner, severity,
window, dedupe key, escalation, and runbook. Audit events describe accountable
actions and remain separate from technical telemetry.

## Consequences

- Application instrumentation remains backend-neutral.
- The local stack is heavier but makes Phase 1 operations evidence reproducible.
- Signal schemas, redaction, sampling, and cardinality require governance.

## Security impact

Secrets, credentials, raw tokens, prohibited model content, and sensitive payloads
are redacted before export. Sampling cannot drop errors, security events, sensitive
mutation evidence, or incident signals. Tenant identifiers are pseudonymized when
classification requires it.

## Rollback and migration

Application behavior must survive unavailable telemetry. Exporters can be disabled
or redirected while local health exposes degradation. Backend migration changes
collector/exporter configuration, not domain instrumentation.

## Validation

T046, T048, T110, T113, and T126 verify correlation, redaction, health, alert/runbook
links, controlled failure diagnosis, and signal availability.
