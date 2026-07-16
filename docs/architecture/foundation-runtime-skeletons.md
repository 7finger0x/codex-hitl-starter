# Foundation runtime skeletons (T051-T053)

This document records the source-only runtime boundaries implemented for
PF-003, PF-009, PF-010, PF-019-PF-022, and PF-025. It does not claim the T054
runtime-application or integration gates.

## API skeleton (T051)

`apps/api/src/app.ts` constructs the Fastify application. Only liveness and
readiness are public. Future routes are protected by the authentication hook
unless their route configuration explicitly declares `publicRoute: true`.
Request correlation, idempotency-key validation, canonical weak resource
versions, schema-backed health responses, and stable sanitized errors are
installed centrally.

The skeleton deliberately publishes no product endpoint or new contract. Its
health and error response schemas are consumed from the HCP-02-approved
foundation contract. Authentication is injected as a verifier port; no secret,
credential store, database, cache, or external identity service is accessed by
the skeleton or its tests.

## Worker skeleton (T052)

`apps/workers/src/worker.ts` accepts an injected lease adapter and handler.
Every leased job is revalidated for UUIDv7 job, tenant, and environment IDs,
bounded attempt metadata, payload shape, and W3C trace context before handler
execution. The runtime performs an immediate heartbeat, prevents overlapping
periodic heartbeats, applies bounded exponential retry, releases active work on
shutdown, and stops leasing after shutdown.

Adapter failures and handler failures are represented by stable reason codes;
raw exceptions are not persisted. `apps/workers/src/main.ts` supplies only an
idle adapter and a local liveness listener. It does not connect to persistence,
cache, telemetry collectors, or container services.

## Web shell (T053)

`apps/web/src/components/platform-shell.tsx` renders keyboard-accessible
landmarks, a skip link, explicit session loading/error/unauthenticated states,
and an authenticated tenant/environment banner. Navigation is rendered only
from validated capability projection input. Its advisory states that
visibility is not authorization; API enforcement remains authoritative.

English and Spanish messages are routed through `apps/web/src/i18n/index.ts`.
The responsive stylesheet preserves focus indicators and reduced-motion
preferences. The only runtime route added outside the shell is the
HCP-04-approved web liveness route, which returns the canonical closed Health
shape with `Cache-Control: no-store`.

## Verification and traceability

The task tests are:

- T051: `apps/api/src/app.test.ts`
- T052: `apps/workers/src/worker.test.ts`
- T053: `apps/web/src/components/platform-shell.test.tsx`

Exact commands, ordered RED/GREEN results, source hashes, requirement mappings,
and protected-action attestations are retained in:

- `evidence/foundation/t051-api-skeleton.json`
- `evidence/foundation/t052-worker-skeleton.json`
- `evidence/foundation/t053-web-shell.json`

T054 remains a separate human-checkpoint-controlled task. These source-only
skeletons are not evidence that its migration, RLS, cache, runtime-role,
telemetry, health integration, or infrastructure gates have run.
