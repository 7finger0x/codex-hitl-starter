# HCP-04 Infrastructure Definitions and Local Target

**Status**: `approved_with_conditions`  
**Decision**: `approved_with_conditions` — Option A  
**Tasks**: T043-T046; approval requested for repository definition creation in
T045-T046 only  
**Requirements**: PF-013, PF-017, PF-018, PF-022, PF-023  
**Prepared**: 2026-07-13  
**Production disposition**: `no_go`

## Protected action

HCP-04 is required before creating, changing, validating with a container tool,
or applying any container topology, network, named volume, cache, telemetry
service, environment manifest, port binding, or development deployment command.
This record proposes an exact local-only source definition. It does not authorize
an image pull, container creation, network or volume creation, migration/seed
application, external development deployment, production action, secret access,
or repository-content transmission.

T043 may prepare this record without changing infrastructure. T044 remains
incomplete until the user supplies an attributable decision for one option below.

## Exact proposed repository scope

Option A permits creation or modification of only these paths:

1. `compose.yaml`
2. `infra/environments/local/compose.override.yaml`
3. `.env.example`
4. `infra/modules/observability/otel-collector.yaml`
5. `infra/modules/observability/prometheus.yaml`
6. `infra/modules/observability/loki.yaml`
7. `infra/modules/observability/tempo.yaml`
8. `infra/modules/observability/grafana/provisioning/datasources/foundation.yaml`
9. `infra/modules/observability/grafana/provisioning/dashboards/foundation.yaml`
10. `infra/modules/observability/grafana/dashboards/foundation-overview.json`
11. `infra/modules/observability/prometheus-rules/foundation-alerts.yaml`

No Dockerfile, deployment manifest, CI workflow, migration, seed, public
contract, dependency, lockfile, engineering policy, staging definition, or
production definition is included. T129 development manifests, T142 container
artifact replacement, T145 deployment runs, and HCP-08 publication remain later
reviewed work.

## Exact immutable image inventory

Every image reference must use `tag@sha256:digest`. The digest is the public
multi-platform manifest digest resolved read-only on 2026-07-13; implementation
may not replace a digest, select `latest`, or add an image without a new review.

| Logical services        | Exact image reference                                                                                                            | Source basis                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `web`, `api`, `workers` | `docker.io/library/node:24.18.0-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5`           | Approved Node runtime version; Docker Hub manifest                      |
| `postgres`              | `docker.io/supabase/postgres:17.6.1.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`                 | Supabase self-hosting commit `1d29b4c5b4af7a9a46ba460d0dfebbb7db528f5c` |
| `auth`                  | `docker.io/supabase/gotrue:v2.189.0@sha256:385184459f57569c54c25209f51f3b2be99ddd7c4ce9e3555b5d3eea8447b7cf`                     | Same Supabase self-hosting commit                                       |
| `rest`                  | `docker.io/postgrest/postgrest:v14.12@sha256:54000f24847d01a2c2302e0041cf0618b875c57fb48507d743cfa9aaa50bf43c`                   | Same Supabase self-hosting commit                                       |
| `realtime`              | `docker.io/supabase/realtime:v2.102.3@sha256:aa1c92c0cf326007563641730ec9da9c60478caa6853887775365fa2c097a471`                   | Same Supabase self-hosting commit                                       |
| `storage`               | `docker.io/supabase/storage-api:v1.60.4@sha256:c8eb9858eafec891a97c27125470aaad54703c3f4eb4d55ca7f1bf6c6411febf`                 | Same Supabase self-hosting commit                                       |
| `valkey`                | `docker.io/valkey/valkey:9.1.0-alpine@sha256:a35428eba9043cc0b79dbe54100f0c92784f2de00ad09b01182bfb1c5c83d1bd`                   | Valkey 9.1.0 release; Docker Hub manifest                               |
| `otel-collector`        | `docker.io/otel/opentelemetry-collector-contrib:0.156.0@sha256:125bdbeb7590cc1952c5b3430ecf14063568980c2c93d5b38676cc0446ed8108` | OpenTelemetry Collector 0.156.0 release; Docker Hub manifest            |
| `prometheus`            | `docker.io/prom/prometheus:v3.13.1@sha256:3c42b892cf723fa54d2f262c37a0e1f80aa8c8ddb1da7b9b0df9455a35a7f893`                      | Prometheus 3.13.1 release; Docker Hub manifest                          |
| `loki`                  | `docker.io/grafana/loki:3.7.3@sha256:70b9f699fc9bb868b62f1cfd4f787dfa50242f1fd92e6089787d5d7daea75fe8`                           | Loki 3.7.3 release; Docker Hub manifest                                 |
| `tempo`                 | `docker.io/grafana/tempo:3.0.2@sha256:cda87c212d8c584dc0b89e337e7ed648a5100feb657e5d528480ee4fa03dbbe3`                          | Tempo 3.0.2 release; Docker Hub manifest                                |
| `grafana`               | `docker.io/grafana/grafana:13.1.0@sha256:121a7a9ece6dc10b969f1f96eed64b4f07dfac0d0b8abc070f7cb83bbde86f63`                       | Grafana 13.1.0 release; Docker Hub manifest                             |

The minimal Supabase subset intentionally excludes Studio, Kong, imgproxy,
postgres-meta, Edge Runtime, analytics, and Supavisor. The platform API is the
browser-facing gateway; direct local ports below exist only for bounded test and
diagnostic use.

## Exact service and resource inventory

All services restart only with `restart: unless-stopped`; no service uses host
networking, privileged mode, a Docker socket, device access, host PID/IPC, or a
host filesystem path other than the reviewed read-only repository/config mounts.
Application services remain behind the `application` profile until T051-T053
provide runnable entry points. Observability services use the `observability`
profile. The default profile starts only the local data/Supabase dependencies.

| Service          | Profiles        | Networks                  | Writable state               | CPU / memory limit | Runtime restriction                                                                                          |
| ---------------- | --------------- | ------------------------- | ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `web`            | `application`   | edge, observability       | tmpfs only                   | 0.75 / 512 MiB     | UID/GID 65532; read-only root; all capabilities dropped                                                      |
| `api`            | `application`   | edge, data, observability | tmpfs only                   | 1.00 / 768 MiB     | UID/GID 65532; read-only root; all capabilities dropped                                                      |
| `workers`        | `application`   | data, observability       | tmpfs only                   | 1.00 / 768 MiB     | UID/GID 65532; read-only root; all capabilities dropped                                                      |
| `postgres`       | default         | data                      | `foundation_postgres_data`   | 2.00 / 2 GiB       | official entrypoint only; ready process must be non-root; startup exception fails closed if it remains UID 0 |
| `auth`           | default         | edge, data                | tmpfs only                   | 0.50 / 256 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `rest`           | default         | edge, data                | tmpfs only                   | 0.50 / 256 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `realtime`       | default         | edge, data                | tmpfs only                   | 1.00 / 512 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `storage`        | default         | edge, data                | `foundation_storage_data`    | 1.00 / 512 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `valkey`         | default         | data                      | `foundation_valkey_data`     | 0.50 / 256 MiB     | image `valkey` user; read-only root; all capabilities dropped                                                |
| `otel-collector` | `observability` | observability             | tmpfs only                   | 0.50 / 256 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `prometheus`     | `observability` | observability             | `foundation_prometheus_data` | 1.00 / 768 MiB     | image `nobody` user; read-only root; all capabilities dropped                                                |
| `loki`           | `observability` | observability             | `foundation_loki_data`       | 0.50 / 512 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `tempo`          | `observability` | observability             | `foundation_tempo_data`      | 0.50 / 512 MiB     | non-root image user; read-only root; all capabilities dropped                                                |
| `grafana`        | `observability` | edge, observability       | `foundation_grafana_data`    | 0.50 / 512 MiB     | image UID/GID 472; read-only root; all capabilities dropped                                                  |

Every service uses `pids_limit: 256`, except Postgres (`512`), and a 64 MiB
`/tmp` tmpfs with `nosuid,nodev,noexec` where the image supports it. All use
`security_opt: ["no-new-privileges:true"]`; the Postgres startup exception must
be proven compatible or application stops pending an amendment. Resource values
are upper bounds, not readiness evidence.

## Exact networks

| Network                    | Driver and exposure                                | Members and permitted flow                                                                                                       |
| -------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `foundation_edge`          | bridge; only network with loopback-published ports | web/API and specifically listed Supabase/OTLP/Grafana endpoints                                                                  |
| `foundation_data`          | bridge with `internal: true`                       | API/workers to Postgres, Supabase services, and Valkey; no host publication except the separately bound Postgres diagnostic port |
| `foundation_observability` | bridge with `internal: true`                       | application/Supabase telemetry to Collector and Collector/backends/Grafana                                                       |

Service-to-service aliases are fixed to the compose service names. No container
may join an unlisted external network. Valkey, Prometheus, Loki, and Tempo have no
host port. Database, storage, cache, event, job, export, and telemetry keys remain
tenant/environment/version namespaced in later application tasks; networking is
not an authorization boundary.

## Exact loopback port inventory

Every published port binds literal `127.0.0.1`; binding `0.0.0.0`, `::`, a LAN
address, or a remote context invalidates approval.

| Host -> container             | Service        | Purpose                                              |
| ----------------------------- | -------------- | ---------------------------------------------------- |
| `127.0.0.1:3000 -> 3000/tcp`  | web            | local UI, application profile only                   |
| `127.0.0.1:3001 -> 3001/tcp`  | api            | local platform API, application profile only         |
| `127.0.0.1:55432 -> 5432/tcp` | postgres       | exact HCP-03 disposable target                       |
| `127.0.0.1:55433 -> 9999/tcp` | auth           | local authentication test endpoint                   |
| `127.0.0.1:55434 -> 3000/tcp` | rest           | local PostgREST diagnostic endpoint                  |
| `127.0.0.1:55435 -> 4000/tcp` | realtime       | local websocket diagnostic endpoint                  |
| `127.0.0.1:55436 -> 5000/tcp` | storage        | local synthetic-object endpoint                      |
| `127.0.0.1:54317 -> 4317/tcp` | otel-collector | host-run OTLP/gRPC tests, observability profile only |
| `127.0.0.1:54318 -> 4318/tcp` | otel-collector | host-run OTLP/HTTP tests, observability profile only |
| `127.0.0.1:53000 -> 3000/tcp` | grafana        | local dashboards, observability profile only         |

Port collision, pre-existing listener, non-loopback resolution, or remote Docker
context is a hard stop; implementation must not select a fallback port.

## Exact named volumes and retention

All volumes carry labels `com.7fingerstudios.project=platform-foundation`,
`com.7fingerstudios.environment=local`, and
`com.7fingerstudios.disposable=true`. They may contain only synthetic local data.

| Volume                       | Owner service | Retention / logical bound                                   |
| ---------------------------- | ------------- | ----------------------------------------------------------- |
| `foundation_postgres_data`   | postgres      | retained across ordinary `down`; operator warning at 2 GiB  |
| `foundation_storage_data`    | storage       | retained; synthetic objects only; operator warning at 1 GiB |
| `foundation_valkey_data`     | valkey        | AOF enabled; `maxmemory 128mb`; disposable cache            |
| `foundation_prometheus_data` | prometheus    | 24-hour and 1 GiB TSDB retention                            |
| `foundation_loki_data`       | loki          | 24-hour retention and 1 GiB local-store target              |
| `foundation_tempo_data`      | tempo         | 24-hour trace retention and 1 GiB local-store target        |
| `foundation_grafana_data`    | grafana       | local users/preferences only; no production datasource      |

`docker compose down` must not pass `--volumes`. Removing, pruning, replacing,
or reinitializing a named volume is a destructive action and is not authorized by
Option A. No bind mount may point outside this repository except the separately
supplied local secret environment file, which is read-only and never inspected by
the agent.

## Exact local target and configuration boundary

The only proposed application target is a user-controlled Docker context whose
endpoint is local to this host. Before any compose command other than an offline
source parser, the following facts must be recorded without secrets:

- context name and endpoint prove a local WSL/Docker Desktop or local Unix socket;
- engine and Compose versions are exact and separately approved if installation
  or upgrade is required;
- no Swarm or Kubernetes deployment target is selected;
- all ten host ports above are free and loopback-bindable;
- project name is exactly `platform-foundation-local`;
- database name/comment remain exactly
  `platform_foundation_hcp03` and
  `DISPOSABLE:002-platform-foundation:HCP-03`;
- existing project-labelled containers/networks/volumes and whether they contain
  non-synthetic rows are inventoried before application;
- no staging/production marker, remote host, external network, or live customer
  resource exists in the target.

The target is not currently attested. Option A approves repository definitions
only and does not infer or authorize these runtime facts.

`.env.example` contains names and safe non-secret defaults only. Actual local
values reside in a gitignored, repository-external or user-created `.env.local`
and may include only synthetic local credentials. The agent may not read it.
Required secret names are limited to `POSTGRES_PASSWORD`, `JWT_SECRET`,
`ANON_KEY`, `SERVICE_ROLE_KEY`, and `GF_SECURITY_ADMIN_PASSWORD`; their values
must never appear in compose output, logs, evidence, or repository files. No AWS,
cloud, production, customer, trading, or financial credential name is permitted.

## Health and observability gates

Container health definitions must probe only these local endpoints and may not
include a secret in argv or output:

| Service         | Required ready condition                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| postgres        | `pg_isready` succeeds for `platform_foundation_hcp03`; database comment guard matches HCP-03                 |
| auth            | HTTP `/health` returns success after database readiness                                                      |
| rest            | HTTP root OpenAPI endpoint returns success after database readiness                                          |
| realtime        | HTTP `/api/tenants/realtime-dev/health` returns success                                                      |
| storage         | HTTP `/status` returns success after database and REST readiness                                             |
| valkey          | `valkey-cli ping` returns `PONG`; configured maxmemory/policy match                                          |
| otel-collector  | health-check extension returns success on internal port 13133                                                |
| prometheus      | `/-/ready` succeeds and configuration/rules load without error                                               |
| loki            | `/ready` succeeds and retention is enabled                                                                   |
| tempo           | `/ready` succeeds and local backend is writable                                                              |
| grafana         | `/api/health` succeeds and all three local datasources are provisioned                                       |
| web/api/workers | application-profile liveness/readiness added by T048/T051-T053; absent entry points keep the profile stopped |

OTLP receivers accept gRPC/HTTP only; exporters send metrics to Prometheus,
logs to Loki, and traces to Tempo. Processors enforce memory limiting, batching,
attribute allowlists, and redaction of credential/token/authorization/cookie/raw
environment values. Audit records never flow through technical logs. Prometheus
rules cover service readiness, audit-write failure, database failure, stale
outbox work, telemetry drops, and configuration activation failure. Every rule
has a stable label for severity, owner, and runbook placeholder; later T158 binds
the approved runbook paths.

## Threat, privacy, and cost review

| Risk                        | Required control                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Accidental network exposure | literal loopback bindings; two internal networks; no fallback ports                                                          |
| Container privilege escape  | no privileged/host namespace/socket/device; non-root steady state; read-only roots; dropped capabilities                     |
| Secret leakage              | opaque local names only; gitignored values; telemetry redaction; no compose config/output retained when it may render values |
| Cross-tenant leakage        | synthetic overlapping fixtures; RLS remains authoritative; cache/telemetry namespaces bind tenant and environment            |
| Mutable supply chain        | tag plus immutable digest; no build/pull during approved source creation                                                     |
| Unbounded disk/memory       | service resource limits, cache maximum, backend retention, disk warnings, named disposable volumes                           |
| Production drift            | exact local database comment/project labels; no staging/production service, endpoint, key name, or environment               |

Software license cost is zero for local use under the selected open-source
images. The host budget is 4 CPU cores, 10 GiB available memory, approximately
6 GiB compressed image cache, and 8 GiB warning threshold across named volumes.
This is an estimate, not authorization to incur cloud, registry, egress, storage,
or hosted observability cost. External development cost and provider inventory
remain deferred to T129 and a target-specific HCP-04 amendment.

## Verification plan before application

T045-T046 source completion requires all of the following without starting a
container:

1. parse the compose/config YAML with an already-approved local parser;
2. assert the exact service/image/digest/network/port/volume inventory;
3. reject mutable tags, build contexts, privileged/host modes, Docker sockets,
   non-loopback published ports, unbounded services, and plaintext secret values;
4. assert every configuration mount is read-only and inside an approved path;
5. validate Prometheus, Loki, Tempo, OTEL, and Grafana structures with existing
   repository tooling only;
6. run `./scripts/verify-authority.sh` and `./scripts/verify.sh`;
7. retain an incomplete machine-readable result that explicitly says images were
   not pulled and containers/health checks were not run.

Use of `docker compose config`, `pull`, `create`, `up`, `exec`, `run`, `stop`,
`down`, `rm`, or `volume` is not authorized by Option A. A later amendment must
record the exact Docker/Compose paths and hashes, local context facts, image
registry origins, pull commands, target state, and sanitized output policy.

## Application, teardown, and recovery plan (not yet authorized)

If a later amendment approves application, it must preserve this order:

1. attest local context, ports, labels, existing state, and HCP-03 target guard;
2. verify every pulled manifest digest against the table above;
3. create internal networks and named volumes without replacing existing state;
4. start Postgres and pass its guard before other Supabase services;
5. start Valkey and Supabase dependencies, then observability;
6. keep application profile stopped until its runnable tasks are complete;
7. retain sanitized service/health/digest evidence without environment values.

Ordinary teardown is the exact project-scoped equivalent of
`docker compose --project-name platform-foundation-local down --remove-orphans`
without `--volumes`, but it also remains unapproved until the tool and target
amendment. Failure recovery stops new application work, preserves volumes and
logs, records failed health and digest state, and either restarts the unchanged
digest or uses a newly reviewed forward fix. Volume deletion, database reset,
seed reapplication, and state restore each require a separate destructive-action
approval and the HCP-03 guard.

## Irreversible impact and invalidation

Repository definition creation is reversible and has no runtime impact. Image
pulls consume network/disk; container, network, and volume creation changes the
local engine; volume deletion can irreversibly destroy data. Only the first is in
Option A.

Approval is invalidated by any path, image tag/digest, service, profile, port,
network, volume, secret-name inventory, health endpoint, resource limit, target,
command, retention, cost, security exception, or production disposition change.
It also expires if an image digest no longer resolves or a critical unaccepted
advisory affects an image before creation.

## Decision options

### Option A — approve exact repository definitions only

Authorize T045-T046 to create the eleven exact files and source definitions above.
Do not pull images, invoke Docker/Compose, create/apply infrastructure, inspect
secrets, access the HCP-03 database input, deploy externally, transmit repository
content, or begin later tasks under this approval.

Exact approval statement:

> Approve HCP-04 Option A and authorize T045-T046 repository definition creation
> exactly as recorded in HCP-04-infrastructure.md. This does not authorize image
> pulls, Docker/Compose execution, infrastructure application or teardown,
> database/seed application, secret access, external deployment, repository
> transmission, production action, or later-task scope.

### Option B — deny and revise

Do not create any infrastructure definition. Record the required topology,
security, target, cost, or scope changes before presenting a new exact review.

## Decision record

- **Decision**: `approved_with_conditions` — Option A
- **Approver**: User in Codex task
- **Decision time**: 2026-07-13T05:13:46-07:00
- **Approval statement**: "Approve HCP-04 Option A and authorize T045-T046
  repository definition creation exactly as recorded in
  HCP-04-infrastructure.md. This does not authorize image pulls, Docker/Compose
  execution, infrastructure application or teardown, database/seed application,
  secret access, external deployment, repository transmission, production
  action, or later-task scope."
- **Conditions/rationale**: Exact source-only Option A; every listed exclusion
  remains in force. No rationale beyond the supplied approval statement was
  inferred.
- **Implementation evidence**: Decision evidence is retained in
  `evidence/infrastructure/t044-hcp04-decision.json`; T045-T046 evidence remains
  pending.

No prior checkpoint approval and no general instruction to approve future work
populated this record. The exact attributable Option A statement above authorizes
only T045-T046 repository definition creation under all recorded exclusions.

## T045-T046 repository materialization result

All eleven Option A files now exist. Offline source validation reports exactly 14
services, 12 unique digest-pinned images, three networks, seven labelled named
volumes, ten literal loopback port mappings, three OTLP pipelines, 12 sensitive-
attribute deletions, seven Prometheus scrape jobs, seven owner/runbook-labelled
alerts, three Grafana datasources, and six dashboard panels. The source contains
no build context, privileged service, Docker socket, non-loopback publication, or
plaintext secret value. Authority and root verification pass without a lockfile
change.

As required by Option A, no Docker or Compose command ran, no image was pulled,
no container/network/volume/port was created, no target or secret was accessed,
and no infrastructure, database, seed, external deployment, or production action
was applied. Runtime health and vendor-binary validation remain explicitly
`incomplete_by_approval`; they are not reported as passing. Evidence is retained
in `evidence/infrastructure/t045-local-topology.json` and
`evidence/infrastructure/t046-observability-definitions.json`.

## T051-T054 HCP-04 amendment proposals

The following two amendments are separate and both are **`awaiting_decision`**.
They prepare source corrections and local-target discovery only; they do not
approve image pulls, service startup, database/cache access, or application or
teardown. The retained 12 immutable image references, 14-service inventory,
three networks, seven named volumes, resource limits, security controls, and
synthetic-only classification remain unchanged except for the exact API
host-port correction below.

### A. Exact source/topology correction amendment

The approved HCP-02 OpenAPI advertises `http://localhost:8080`, while the
materialized HCP-04 source publishes the API at 127.0.0.1:3001. The exact
resolution is to retain the API's internal container port 3001 and change only
its host publication and local operator URL to 8080. Health paths, operation IDs,
schemas, `X-Correlation-Id`, public-health `security: []`, and all shared auth,
idempotency, `If-Match`/weak-ETag, and error rules remain exactly HCP-02.

After approval, only these source files may change:

- `infra/environments/local/compose.override.yaml`: change only the `api`
  mapping to `127.0.0.1:8080 -> 3001/tcp`; no other published port changes.
- `.env.example`: change only `API_PORT=3001` to `API_PORT=8080`; retain every
  secret name, blank secret value, project name, and other port.
- `specs/002-platform-foundation/quickstart.md`: change only the two external
  health URLs to `http://127.0.0.1:8080/health/live` and
  `http://127.0.0.1:8080/health/ready`.
- `compose.yaml`: add the exact read-only mount
  `./infra/environments/local/postgres/010-platform-foundation-identity.sql:/docker-entrypoint-initdb.d/010-platform-foundation-identity.sql:ro`
  to `postgres`; add `NEXT_TELEMETRY_DISABLED: "1"` to `web`; add a bounded
  worker healthcheck that fetches `http://127.0.0.1:9464/health/live` without
  secrets. No image, digest, profile, network, volume, resource, or command
  changes are allowed.
- `infra/environments/local/postgres/010-platform-foundation-identity.sql`:
  new file containing only
  `COMMENT ON DATABASE platform_foundation_hcp03 IS 'DISPOSABLE:002-platform-foundation:HCP-03';`
  and a final newline. It is an initialization aid for a fresh disposable
  volume, not a migration and not a repair of an existing target.

T053 must separately add the planned web liveness route and T052 must separately
implement the worker metrics/health listener; this amendment does not authorize
either implementation. Prometheus continues to scrape `api:3001` and
`workers:9464` on the internal network. No application profile may start until
those entry points exist and their source hashes are recorded.

Source verification is limited to offline YAML/SQL/source validators, HCP-02
contract drift checks, `./scripts/verify-authority.sh`, and `./scripts/verify.sh`.
Do not run `docker compose config` because it can interpolate secret values.
Record the five-file diff and hashes in
`evidence/infrastructure/t054-hcp04-source.json` with `runtime_applied: false`.
On failure, apply a reviewed inverse patch to those exact files and verify their
pre-amendment hashes. No Docker executable, image, volume, network, database,
cache, secret, or network request is used by this amendment.

#### Exact approval statement A

> Approve the HCP-04 T051-T054 source/topology correction amendment exactly as
> recorded in HCP-04-infrastructure.md. Authorize only the listed API host-port
> 8080 correction, local URL updates, Postgres comment-init mount/file, disabled
> Next telemetry setting, and worker healthcheck source definitions. Retain all
> recorded image digests, services, profiles, networks, volumes, resources,
> loopback-only binding, synthetic-only target, HCP-02 contracts, and lifecycle
> exclusions. This does not authorize T051-T053 implementation, image pull,
> Docker/Compose execution, secret access, database/cache/container access,
> manifest or lockfile change, repository-content upload, production resources,
> application/teardown, or T055 and later.

#### Decision record A

- **Decision**: `approved_with_conditions` for the exact source/topology,
  port, SQL-init, healthcheck, verification, rollback, and exclusion scope
  above.
- **Approver/time**: user in Codex task; 2026-07-13 (no clock time supplied).
- **Approval statement**: the exact approval statement A above, supplied by the
  user. T051-T053 implementation and runtime application remain excluded.
- **Invalidation**: any file, port, URL, SQL, image, service, healthcheck,
  secret-name, profile, resource, or exclusion change.

### B. Exact local-target discovery amendment

The only executable paths are Docker CLI
`/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe` (SHA-256
`7bc66b018b9da43fea986f893288bb93970d3d1217f5063201fd97c827f20732`) and the
bundled Compose plugin
`/mnt/c/Program Files/Docker/Docker/resources/cli-plugins/docker-compose.exe`
(SHA-256 `71cbd1a0379c9eef3bbcc439b696cd9e39fdc9bab2e209c6bb19fd53a6b6869f`).

After approval, only argv-only, `shell:false` read-only discovery is allowed:

1. Hash both executables; run `docker.exe context show` and
   `docker.exe context inspect --format={{json .Endpoints.docker.Host}}`.
   Continue only for a local WSL/Unix/npipe endpoint; remote, cloud, Swarm,
   Kubernetes, or unknown endpoints stop the amendment.
2. After the local proof, run `docker.exe version --format={{json .}}`,
   `docker.exe compose version --short`, and
   `docker.exe info --format={{json .Swarm.LocalNodeState}}`; retain versions
   only, not raw configuration.
3. For each retained digest, run
   `docker.exe image inspect <exact-reference> --format={{json .RepoDigests}}`.
   Absence is recorded and does not authorize a pull. Enumerate only project-
   labelled containers, networks, and volumes with `--filter label=...`
   and `--format={{json .}}`; do not run full inspect or expose environment.
4. Use the approved Node 24 binary with a repository-external read-only port
   inventory that transiently binds literal 127.0.0.1 only for 3000, 8080,
   55432–55436, 54317, 54318, and 53000, closes each socket immediately, and
   records occupied/free and bindable/unbindable status. No fallback port is
   permitted.

The discovery must not run `docker compose config`, `pull`, `create`, `up`,
`run`, `exec`, `stop`, `down`, `rm`, `volume`, or any service/image command;
must not contact a registry; and must not read `.env.local`,
`HCP03_DATABASE_URL`, or any secret. The exact Postgres target remains
`127.0.0.1:55432/platform_foundation_hcp03`; the exact cache target remains
Valkey 9.1.0 on internal `foundation_data` with no host port; the exact
container target remains project `platform-foundation-local` and the retained
digest inventory. Any non-synthetic labelled state, non-local endpoint, port
collision, missing/unexpected digest, or unknown volume content is a hard stop.

Write only sanitized facts and hashes to
`evidence/infrastructure/t054-hcp04-discovery.json`, with
`runtime_applied: false`, `images_pulled: false`, `secrets_accessed: false`, and
`repository_transmitted: false`. There is no runtime rollback; retain only
read-only evidence and close transient port sockets. A later application
amendment must bind the recorded endpoint, exact image cache or separately
approved registry pulls, project labels, ports, Postgres in-image tool hashes,
user-owned synthetic credential-file path, and corrected source hashes before
any create/up/exec/backup/migration/cache/telemetry command. If later approved,
ordinary teardown is `docker.exe compose --project-name
platform-foundation-local down --remove-orphans` without `--volumes`; volume
deletion, reset, restore, seed reapplication, and production remain prohibited.

#### Exact approval statement B

> Approve the HCP-04 T054 local-target discovery amendment exactly as recorded
> in HCP-04-infrastructure.md. Authorize only the two hashed Docker executables,
> argv-only shell-false context/version/cache/label/port discovery commands, and
> sanitized discovery evidence. Retain the exact 14-service/12-image inventory,
> amended loopback ports, disposable Postgres/Valkey/cache/container targets,
> synthetic-only labels, and all HCP-02 compatibility rules. This does not
> authorize registry access or image pulls, Compose configuration rendering,
> container/network/volume creation, Docker exec, database/cache/telemetry
> access, secret access, repository-content upload, application, teardown,
> volume deletion, production resources, T051-T054 implementation, or T055 and
> later.

#### Decision record B

- **Decision**: `approved_with_conditions` for the exact read-only discovery,
  tool hashes, commands, evidence, and exclusion scope above.
- **Approver/time**: user in Codex task; 2026-07-13 (no clock time supplied).
- **Approval statement**: the exact approval statement B above, supplied by the
  user. No image pull, create/up/exec, service access, or teardown is approved.
- **Invalidation**: any executable hash/path, command, endpoint, image digest,
  label, port, target, output field, or exclusion change.

## T054 PostgreSQL image/tool-attestation bootstrap amendment proposal

**Status**: `awaiting_exact_user_decision`  
**Prepared**: 2026-07-13  
**Bootstrap authorized**: no

This bootstrap resolves the circular prerequisite between the HCP-04 image
cache and the HCP-03 in-image client attestation. It is limited to the exact
PostgreSQL image already pinned in `compose.yaml`:

`docker.io/supabase/postgres:17.6.1.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`

Official Docker documentation reviewed on 2026-07-13 identifies
`https://auth.docker.io` for anonymous pull-token retrieval,
`https://registry-1.docker.io` for registry manifests/blobs, and
`https://production.cloudfront.docker.com` as the current Docker pull CDN.
Only HTTPS GET/HEAD requests and a registry-issued 307 redirect from
`registry-1.docker.io` to that exact CDN origin are proposed. Docker login,
credential-helper access, authenticated-user tokens, cookies, proxy
credentials, and every other origin are excluded. Any other origin, redirect,
authentication request, digest mismatch, or TLS failure is a hard stop.

After approval, the only allowed state change is pulling that one immutable
image through the recorded local Docker context. The only follow-up commands
are exact-reference image inspection and three temporary `--network none`,
no-mount, no-environment, `--rm` tool-attestation containers: `/usr/bin/psql
--version`, `/usr/bin/pg_dump --version`, and `/usr/bin/sha256sum
/usr/bin/psql /usr/bin/pg_dump`. The Docker executable remains
`/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe` at SHA-256
`7bc66b018b9da43fea986f893288bb93970d3d1217f5063201fd97c827f20732`.

No Compose command, project container/network/volume, published port, secret or
credential file, database, cache, telemetry service, migration, backup,
repository upload, production resource, or T055+ work is authorized. On any
failure, retain sanitized failure evidence and any verified cached layer; do
not remove/prune an image or volume and do not retry through another origin.

### Exact bootstrap approval statement

> Approve the HCP-04 T054 PostgreSQL image/tool-attestation bootstrap exactly as
> recorded in HCP-04-infrastructure.md. Authorize only the one recorded
> digest-pinned PostgreSQL image pull using anonymous HTTPS GET/HEAD access to
> `auth.docker.io` and `registry-1.docker.io`, with only registry-issued 307
> redirects to `production.cloudfront.docker.com`; exact-reference image
> inspection; and the three recorded `--network none`, no-mount,
> no-environment, `--rm` tool-attestation containers. Retain the executable
> hash, local-context guard, stop conditions, lifecycle restrictions, and all
> exclusions. This does not authorize Docker login or credential-helper use,
> any other image/origin/redirect, Compose, project resource creation, ports,
> secrets, database/cache/telemetry access, migrations, backups, teardown,
> deletion, repository upload, production, runtime application, or T055 and
> later.

### Bootstrap decision record

- **Decision**: `approved_with_conditions` for the exact one-image anonymous
  pull, digest inspection, three tool-attestation containers, stop conditions,
  and exclusions above.
- **Approver/time**: user in the Codex task; 2026-07-13 (no clock time supplied).
- **Approval statement**: the exact bootstrap approval statement above,
  supplied by the user.
- **Invalidation**: any image reference/digest, origin, redirect, executable,
  context, command, tool path, output field, failure rule, or exclusion change.

### Bootstrap result

The approved bootstrap completed at 2026-07-13T18:06:00-07:00. The pull
reported and exact-reference inspection confirmed digest
`sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`.
The isolated tool attestations reported PostgreSQL 17.6 and these hashes:

- `/usr/bin/psql`:
  `96577e53f4c3558b7f27c5747b533bc7180a4b22a232e8a71af7724257d7efcc`;
- `/usr/bin/pg_dump`:
  `858f1d46d266b6d3aa514e8483cd4d8ca43ac792b72451b448fcd00903b48eb4`.

The empty client-config path remained absent, no stored login/helper was
available to the pull, all three `--rm` containers exited successfully, and no
project-labelled container exists. Sanitized evidence is recorded in
`evidence/infrastructure/t054-hcp04-postgres-bootstrap.json`. Docker CLI output
does not expose per-request network origins; it reported no unexpected origin,
redirect, authentication, TLS, or digest condition. No broader runtime action
is inferred or authorized.

## T054 runtime-application amendment draft

**Status**: `awaiting_exact_user_decision`  
**Prepared**: 2026-07-13  
**Runtime application authorized**: no

The approved five-path source amendment and read-only discovery are complete in
`evidence/infrastructure/t054-hcp04-source.json` at SHA-256
`962b48eddd72834df5af3852150114479048e8ef7eec57a56ea6736e79225f4f` and
`evidence/infrastructure/t054-hcp04-discovery.json` at SHA-256
`4f13e2cf90489e894fe222b6a0624a356aaf2ef3369e9f3c29de69e85eca54b3`.
The bound local target was revalidated at 2026-07-13T18:00:30-07:00 after the
user reported an out-of-scope Supabase CLI image pull. It remains Docker context
`desktop-linux`, endpoint
`npipe:////./pipe/dockerDesktopLinuxEngine`, Docker client/server 29.5.3 API
1.54, Compose 5.1.4, and inactive Swarm. No project-labelled container,
network, or volume exists. All approved loopback ports—3000, 8080, 55432-55436,
54317, 54318, and 53000—were free and bindable when discovered.

All 12 exact digest-pinned images remain the unchanged references in
`compose.yaml`. The exact PostgreSQL image is now present under the separately
approved bootstrap above; the other 11 remain absent. Runtime application and
all other pulls remain unapproved by this draft.

After exact approval and precondition revalidation, the proposed runtime scope
is limited to project `platform-foundation-local`, the recorded 14 services,
three networks, seven named volumes, ten loopback ports, application and
observability profiles, and the user-owned synthetic credential file
`C:\Users\brand\codex-hitl-local.env` passed to Compose without inspection. It
would authorize the remaining 11 exact-digest pulls through the same anonymous
client-config and three-origin boundary as the approved PostgreSQL bootstrap,
project-scoped create/up, Postgres/Valkey/health/telemetry access, and the T054
gates only. Ordinary teardown would be:

`docker.exe compose --project-name platform-foundation-local down --remove-orphans`

`--volumes` is forbidden. Production, staging/customer connectivity, volume
deletion, reset/restore, secret disclosure, raw environment capture,
repository-content upload, and T055 or later remain prohibited.

The exact application order is: revalidate executable hashes, local context,
non-Swarm state, project labels, ten ports, credential-file existence, and all
12 cached digests; pull only the 11 absent references; use Compose project
`platform-foundation-local` with the external env file and `--pull never` to
bring up Postgres first, then the other Supabase services and Valkey, then the
observability profile, then the application profile; run the HCP-03 and T054
gates; capture sanitized evidence; and run the exact teardown above only after
successful evidence capture. A post-commit HCP-03 failure overrides ordinary
teardown and preserves the target and volumes for reviewed forward recovery.

### Resolved facts and application-time attestation

1. The three exact Docker Hub pull origins and redirect policy were approved
   and exercised only for the PostgreSQL bootstrap. Approval for the other 11
   exact images remains required.
2. Resolved after preparation: the user supplied
   `C:\Users\brand\codex-hitl-local.env`, attested that it contains only
   `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, and
   `GF_SECURITY_ADMIN_PASSWORD` with synthetic local values, and the agent
   verified only that the file exists. Its contents were not read.
3. Resolved by the approved bootstrap: the Postgres image is materialized and
   HCP-03 can bind the exact in-image tool versions and SHA-256 values above.
4. The final checkpoint-document hashes are presented with the exact approval
   statements after this draft is verified.

### Exact runtime-application approval statement

> Approve the HCP-04 T054 runtime-application amendment exactly as recorded in
> HCP-04-infrastructure.md. Bind application to `compose.yaml` at SHA-256
> `eaf52db2ee604ed0483a41522965b4d26d169173c60def1364fdbfc0e4c1edad`,
> the recorded hashed Docker executables, local `desktop-linux` context,
> non-Swarm guard, project `platform-foundation-local`, 14 services, three
> networks, seven named volumes, ten loopback ports, application and
> observability profiles, and
> `C:\Users\brand\codex-hitl-local.env` without inspecting or disclosing its
> contents. Authorize anonymous exact-digest pulls for only the remaining 11
> recorded images through `auth.docker.io`, `registry-1.docker.io`, and only
> registry-issued 307 redirects to `production.cloudfront.docker.com`;
> project-scoped Compose create/up with `--pull never` in the recorded order;
> Postgres, Valkey, health, and telemetry service access; every T054 gate; and,
> after successful evidence capture, exact teardown `docker.exe compose
> --project-name platform-foundation-local down --remove-orphans` without
> `--volumes`. Preserve the approved contracts, migrations, manifests,
> lockfile, disabled lifecycle scripts, source hashes, HCP-03 forward-only
> recovery rule, and all recorded exclusions. Stop for any changed hash,
> non-local/Swarm state, port collision, unexpected labelled state, image or
> origin mismatch, missing required fact, secret exposure, or failed gate. This
> does not authorize Docker login or credential-helper use, any other image,
> origin, redirect, project, service, network, volume, port, profile, agent
> inspection of the credential file, secret value capture/disclosure, any other
> credential file or secret name, volume deletion, reset/restore, production,
> repository upload, or T055 and later.

### Runtime-application decision record

- **Decision**: `approved_with_conditions` for the exact runtime-application
  statement above, bound to the pre-decision checkpoint SHA-256
  `4f109a2e1f297eccd92a0348920a7634bd943bc81d8040526eca602bd55851a0`.
- **Approver/time**: user in the Codex task; 2026-07-13 (no clock time supplied).
- **Application result**: `stopped_before_application`; the approval-bound
  `pnpm-lock.yaml` precondition failed before any remaining image pull, Compose
  operation, project resource, service access, runtime gate, or teardown.
  Expected SHA-256
  `aae4996d4e996fe77311f88beeedb5934dcc18d42136ec9de0efa62cf2cdf4d3`;
  observed SHA-256
  `6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa`.
- **Subsequent result after the separately approved lockfile hash rebinding and
  fresh user proceed decision**: all 12 exact images were present, then the
  project-scoped Postgres create/up produced container
  `platform-foundation-local-postgres-1`, internal network
  `platform-foundation-local-data`, and existing-preserved named volume
  `foundation_postgres_data`. The container entered a restart loop with exit
  code 1 and bounded log `mkdir: can't create directory
  '/var/lib/postgresql/data/pgdata': Permission denied`. No database connection,
  backup, migration, other service, later T054 gate, teardown, or volume
  deletion occurred. Exact failure evidence is
  `evidence/phases/phase-2-foundation.json` at SHA-256
  `1d54f0de070b2f22272e80f252549215bf35bae20738e9588b64d4a84ddbfcfd`.
- **Invalidation**: any compose/source hash, image/digest, origin/redirect,
  executable/context, project/resource/port/profile, credential-file path or
  attestation, command/order, service access, gate, teardown/recovery rule,
  evidence field, or exclusion change.

## T054 Postgres volume-ownership repair amendment proposal

**Status**: `prepared_implementation_blocked`  
**Prepared**: 2026-07-13T21:59:17-07:00  
**Source implementation authorized**: no  
**Container recreation authorized**: no

### Bound failure and source state

This proposal is bound to `compose.yaml` SHA-256
`eaf52db2ee604ed0483a41522965b4d26d169173c60def1364fdbfc0e4c1edad`, the
failure evidence above, and the exact Postgres image digest
`sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`.
Read-only inspection recorded image entrypoint `docker-entrypoint.sh`, empty
image/container user override, `cap_drop: [ALL]`, no `cap_add`,
`no-new-privileges:true`, read-only root filesystem, and a read-write mount of
`foundation_postgres_data` at `/var/lib/postgresql/data`.

The upstream Docker Postgres entrypoint used by the Supabase image creates
`PGDATA`, changes its ownership to the postgres identity when starting as root,
and re-executes through `gosu postgres`. The current blanket capability drop
prevents that bounded initialization path from preparing the new named volume.

### Exact test-first source amendment

After approval, first add
`tests/integration/infrastructure/postgres-volume-ownership.test.ts`. Its red
state must reproduce that the current Postgres service has no capability
exception. Its green state must require exactly these five Postgres-only
capabilities, sorted as shown:

```yaml
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - SETGID
      - SETUID
```

Then add that exact block only between `<<: *runtime-security` and `image:` in
the `postgres` service. The expected resulting `compose.yaml` SHA-256 is
`caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`.
The test must also prove that every service still drops `ALL`, only Postgres has
`cap_add`, the five-capability set has no additions, and Postgres retains
`no-new-privileges`, read-only root filesystem, image digest, PGDATA, health
check, ports, networks, mounts, resource bounds, labels, and volume name.

No other source, test, contract, migration, manifest, lockfile, lifecycle
policy, image, service, network, volume, port, profile, credential-file path, or
secret name may change. Static verification is limited to the approved Node
24.18.0 runtime, the new test, existing repository checks,
`./scripts/verify-authority.sh`, and `./scripts/verify.sh`; it must not invoke
Compose or restart a container before the source hash and test results are
recorded.

### Exact runtime repair and continuation

Only after the source/test result matches the expected hash may the existing
Postgres container be replaced once with the unchanged image, project, two
Compose files, external env-file boundary, network, volume, and port, using the
equivalent of:

`docker.exe compose --env-file C:\Users\brand\codex-hitl-local.env
--project-name platform-foundation-local -f compose.yaml -f
infra/environments/local/compose.override.yaml up --detach --no-build --pull
never --no-deps --force-recreate postgres`

Before replacement, revalidate executable/context/Swarm/source/image hashes,
the exact single labelled Postgres container, single labelled data network,
single labelled Postgres volume, and absence of any other project resource.
The replacement must preserve the named volume and network; `down`, `stop`,
`rm`, `volume rm`, prune, reset, restore, seed application, and `--volumes` are
forbidden.

After replacement, require healthy Postgres, the exact five-capability
container configuration, and a bounded process-identity check showing the
postgres server is not running as root. Then apply the unchanged HCP-03 target,
comment, PostgreSQL-major, synthetic-only, tool-hash, and backup guards before
resuming T054 from its first contract gate. Any source hash mismatch, extra
capability, changed resource, permission error, unhealthy/restarting state,
root Postgres process, failed target guard, secret exposure, or other failed
gate stops immediately and preserves the container, network, volume, and
sanitized evidence for a new forward-only review.

### Compatibility, security, and recovery

This repair does not weaken the shared runtime-security anchor or grant a
capability to another service. The five capabilities are limited to the
Postgres container's entrypoint duties: ownership/permission preparation and
the one-way privilege drop to postgres. `SYS_ADMIN`, `DAC_READ_SEARCH`,
`SETPCAP`, `NET_ADMIN`, `NET_RAW`, `SYS_PTRACE`, privileged mode, host access,
Docker socket access, and every unlisted capability remain absent. The
Postgres server must run non-root after initialization.

Source rollback is the exact inverse of the six-line Postgres-only block and
new test file, applied only before runtime recreation or after preserving
failure evidence. Runtime recovery is forward-only: retain the volume and
failed state; do not restore the already-failing topology, delete/reinitialize
state, invent a migration, or use an unreviewed permission workaround.

### Exact approval statement

> Approve the HCP-04 T054 Postgres volume-ownership repair amendment exactly as
> recorded in HCP-04-infrastructure.md. Authorize strict test-first creation of
> only `tests/integration/infrastructure/postgres-volume-ownership.test.ts` and
> the exact Postgres-only `cap_add` block containing `CHOWN`, `DAC_OVERRIDE`,
> `FOWNER`, `SETGID`, and `SETUID`, producing `compose.yaml` SHA-256
> `caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`.
> Retain `cap_drop: ALL`, `no-new-privileges`, read-only root filesystem, the
> exact image digest, existing container project, network, named volume, ports,
> mounts, profiles, credential-file boundary, contracts, migrations, manifests,
> lockfile, disabled lifecycle scripts, and every exclusion. After source and
> verification evidence passes, authorize one project-scoped `--no-deps
> --force-recreate` Postgres up with `--no-build --pull never`, preserving the
> existing network and volume, followed only by bounded health, capability,
> non-root process, HCP-03 guard, and T054 continuation checks. Stop and preserve
> state on any mismatch or failure. This does not authorize any other source,
> capability, service, image, pull, network, volume, port, profile, secret
> inspection/disclosure, database reset/restore, seed, down migration, teardown,
> deletion/prune, production, repository upload, or T055 and later.

### Decision record

- **Decision**: `approved_with_conditions` for the exact test-first source,
  verification, one-recreation runtime repair, validation, recovery, and
  exclusion scope above.
- **Approver/time**: user in the Codex task; 2026-07-13 (no clock time supplied).
- **Approval binding**: pre-decision checkpoint SHA-256
  `f2c33115777201f884a1ed616d8cf6a3379290e2544d48425a19cb5642dd9284` and
  proposal-evidence SHA-256
  `0abd26c3b589c87ae86995edbaf775048bb627606df5b0cd944902db83887cd5`.
- **Attempt result**: the approved test file was created, but the first red
  command stopped before its behavioral assertion because generated
  `node_modules` contains `@esbuild/win32-x64` while the approved WSL/Linux Node
  runtime requires `@esbuild/linux-x64`. `compose.yaml` remains at its original
  SHA-256; the capability block was not added; no Compose command, recreation,
  database access, backup, migration, or T054 gate ran. Sanitized evidence is
  `evidence/infrastructure/t054-hcp04-postgres-volume-repair-attempt.json`.
- **Invalidation**: any failure fact, source/test path or diff, expected hash,
  capability, Compose argument, resource identity, validation, recovery rule,
  evidence field, or exclusion change.

## T054 refreshed Postgres volume-ownership repair amendment proposal

**Status**: `prepared_refresh_implementation_blocked`  
**Prepared**: 2026-07-13T22:54:12-07:00  
**Repair test, source change, recreation, or T054 gate authorized**: no

### Refreshed bindings and read-only revalidation

This refresh retains original repair-proposal evidence SHA-256
`0abd26c3b589c87ae86995edbaf775048bb627606df5b0cd944902db83887cd5`
and stopped-attempt evidence SHA-256
`af88acaaedc9da3047ba6cdd48bf89989898a8bad7b5a9d84355dd006e72d987`.
The test-runner blocker is resolved by HCP-01 Linux recovery evidence SHA-256
`ffe1bcc37df5844002f7ed481b62ac703d58ec6e57fe99bef4689c17fc5a488a`.
The existing repair test remains at SHA-256
`3843428287a8cdd992f63351ca45bcdfd2035080c37f9c0a2a6b8817e38801bb`.
`compose.yaml` remains unmodified at SHA-256
`eaf52db2ee604ed0483a41522965b4d26d169173c60def1364fdbfc0e4c1edad`;
the expected repaired hash remains
`caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`.

Read-only revalidation recorded the exact hashed Docker executables, local
`desktop-linux` npipe endpoint, Docker client/server 29.5.3 API 1.54, Compose
5.1.4, and inactive Swarm. The cached Postgres image ID and digest remain
`sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`.
Exactly one project-labelled container exists:
`platform-foundation-local-postgres-1`, service `postgres`, still restarting
from the recorded permission failure and using that image ID. Exactly one
labelled local bridge network, `platform-foundation-local-data`, and one
labelled local volume, `foundation_postgres_data`, exist. The container binds
`5432/tcp` only to `127.0.0.1:55432`. All ten recorded loopback ports were
transiently bindable with no collision.

No environment, credential-file content, secret, database, volume content, or
unlabelled resource was inspected. No pull, registry request, Compose mutation,
service action, or network/volume action occurred.

### Exact refreshed test-first repair

After a new exact approval, revalidate every binding above. Run only the
existing test with approved Node 24.18.0 and the restored `tsx` loader. It must
reach its behavioral red assertion because Postgres still lacks `cap_add`; a
loader failure or any other failure stops the repair. Only after that exact red
result, add solely this block between the Postgres runtime-security merge and
image field:

```yaml
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - SETGID
      - SETUID
```

Require `compose.yaml` SHA-256
`caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`,
then require the same test and the recorded static repository checks,
`./scripts/verify-authority.sh`, and `./scripts/verify.sh` to pass. Preserve
`cap_drop: ALL`, no-new-privileges, read-only root filesystem, and every other
service, image, resource, port, profile, mount, contract, migration, manifest,
lockfile, and lifecycle restriction.

Only after exact source/test/verification evidence passes, authorize the one
previously recorded project-scoped Postgres-only Compose recreation with
`--detach --no-build --pull never --no-deps --force-recreate`, the two exact
Compose files, project `platform-foundation-local`, and external synthetic
credential-file boundary, preserving the network and volume. Then run only
bounded health, exact-capability, non-root Postgres-process, and unchanged
HCP-03 target/comment/major/synthetic/tool/backup guards. If those pass, T054
may resume from its first contract gate under the existing approved HCP-03 and
HCP-04 runtime-application boundaries.

Any mismatch, unexpected resource, loader/non-behavioral test failure, source
hash deviation, extra capability, pull request, unhealthy/restarting state,
root process, failed HCP-03 guard, secret exposure, or failed gate stops and
preserves state. No retry, teardown, deletion, reset, restore, seed, down
migration, or unreviewed workaround is authorized.

### Exact refreshed approval statement

> Approve the refreshed HCP-04 T054 Postgres volume-ownership repair amendment
> exactly as recorded in HCP-04-infrastructure.md. Bind it to HCP-01 Linux
> recovery evidence SHA-256
> `ffe1bcc37df5844002f7ed481b62ac703d58ec6e57fe99bef4689c17fc5a488a`,
> original repair proposal SHA-256
> `0abd26c3b589c87ae86995edbaf775048bb627606df5b0cd944902db83887cd5`,
> stopped-attempt SHA-256
> `af88acaaedc9da3047ba6cdd48bf89989898a8bad7b5a9d84355dd006e72d987`,
> existing test SHA-256
> `3843428287a8cdd992f63351ca45bcdfd2035080c37f9c0a2a6b8817e38801bb`,
> and current `compose.yaml` SHA-256
> `eaf52db2ee604ed0483a41522965b4d26d169173c60def1364fdbfc0e4c1edad`.
> Authorize the existing test's exact behavioral-red run, then only the
> recorded Postgres `cap_add` block containing `CHOWN`, `DAC_OVERRIDE`,
> `FOWNER`, `SETGID`, and `SETUID`, producing `compose.yaml` SHA-256
> `caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`,
> its green run, and recorded static verification. Only after those pass,
> authorize one recorded project-scoped Postgres-only `--no-deps
> --force-recreate` up with `--no-build --pull never`, preserving the exact
> project, image digest, network, volume, loopback port, profiles, mounts, and
> external synthetic credential-file boundary, followed by bounded health,
> exact-capability, non-root-process, HCP-03 guard, and T054 continuation checks.
> Preserve every contract, migration, manifest, lockfile, lifecycle restriction,
> secret boundary, infrastructure resource, recovery rule, and exclusion. Stop
> and preserve state on any mismatch or failure. This does not authorize any
> other test/source/capability/service/image/pull/origin, network/volume/port,
> secret inspection/disclosure, reset/restore, seed, down migration, teardown,
> deletion/prune, production, repository upload, or T055 and later.

### Refreshed decision record

- **Decision**: `superseded` / invalidated before approval. Observed worktree and
  runtime state no longer match the refresh bindings: `compose.yaml` already
  equals SHA-256
  `caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`,
  the running Postgres container already has the five `cap_add` capabilities,
  and the failure mode changed from `mkdir .../pgdata: Permission denied` to
  read-only `/var/run/postgresql` plus invalid mount-root mode `2755`.
- **Required next record**: the forward-repair amendment below.
- **Invalidation confirmed**: 2026-07-13T23:33:08-07:00 by read-only diagnosis
  evidence
  `evidence/infrastructure/t054-hcp04-postgres-forward-repair-proposal.json`.

## T054 Postgres forward-repair amendment proposal (tmpfs + volume mode)

**Status**: `prepared_forward_repair_implementation_blocked`  
**Prepared**: 2026-07-13T23:33:08-07:00  
**Source change, volume-mode mutation, recreation, or T054 gate authorized**: no

### Bound drifted state and diagnosis

HCP-01 Linux recovery evidence SHA-256
`ffe1bcc37df5844002f7ed481b62ac703d58ec6e57fe99bef4689c17fc5a488a`
remains the dependency binding. The prior refreshed volume-ownership proposal is
invalidated as recorded above.

Current `compose.yaml` SHA-256 is
`caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`
and already contains the five Postgres-only capabilities. Container
`platform-foundation-local-postgres-1` remains restarting/unhealthy with those
capabilities present, `read_only: true`, and only `/tmp` tmpfs. Bounded logs now
show:

1. `chmod: /var/run/postgresql: Read-only file system`
2. `FATAL: data directory "/var/lib/postgresql/data" has invalid permissions`
3. required modes `0700` or `0750`

Read-only volume metadata (directory listing/stat only; no SQL; no file-content
read) on preserved `foundation_postgres_data` shows:

- `/var/lib/postgresql/data` mode `2755`, uid/gid `100:101`
- `/var/lib/postgresql/data/pgdata` mode `700`, uid/gid `100:101`, present

The named volume and `pgdata` contents must be preserved. Volume deletion,
reset, restore, seed application, `down --volumes`, and prune remain forbidden.

### Exact test-first source amendment

After a new exact approval, extend only
`tests/integration/infrastructure/postgres-volume-ownership.test.ts` so its red
state proves Postgres still lacks an explicit `/var/run/postgresql` tmpfs while
retaining the five-capability block and every surrounding boundary. Then add
only this Postgres-service `tmpfs` override immediately after the existing
`cap_add` block (Compose override replaces the merged shared tmpfs, so `/tmp`
must be restated):

```yaml
    tmpfs:
      - /tmp:size=64m,mode=1777,nosuid,nodev,noexec
      - /var/run/postgresql:size=16m,mode=0755,uid=100,gid=101,nosuid,nodev,noexec
```

Require resulting `compose.yaml` SHA-256
`e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282`.
Retain `cap_drop: ALL`, the five `cap_add` values, `no-new-privileges`,
read-only root filesystem, image digest, ports, networks, mounts, profiles,
credential-file boundary, contracts, migrations, manifests, lockfile, and
disabled lifecycle scripts. No other source file may change. Static verification
is limited to the approved Node 24.18.0 runtime, the extended test, existing
repository checks, `./scripts/verify-authority.sh`, and `./scripts/verify.sh`.

### Exact runtime repair and continuation

Only after source/test/verification evidence matches, authorize exactly two
runtime actions against the existing local project:

1. One disposable, network-none, read-only-root, no-new-privileges helper using
   the exact cached Postgres image digest, with only `CHOWN`, `DAC_OVERRIDE`,
   and `FOWNER` added, mounting `foundation_postgres_data` read-write, running
   only `chmod 0700 /var/lib/postgresql/data`. This must not delete, recreate,
   or truncate `pgdata`. Post-check with a read-only remount must show mount-root
   mode `700` and intact `pgdata` mode `700`.
2. One project-scoped Postgres-only Compose recreation with
   `--detach --no-build --pull never --no-deps --force-recreate`, the two exact
   Compose files, project `platform-foundation-local`, and the external
   synthetic credential-file boundary, preserving the network and volume.

Then require healthy Postgres, exact five capabilities, tmpfs including
`/var/run/postgresql`, non-root postgres server process, and unchanged HCP-03
target/comment/major/synthetic/tool/backup guards. If those pass, T054 may
resume from its first contract gate under the existing approved HCP-03 and
HCP-04 runtime-application boundaries.

Any mismatch, unexpected resource, loader/non-behavioral test failure, source
hash deviation, extra capability, pull request, volume content loss,
unhealthy/restarting state, root process, failed HCP-03 guard, secret exposure,
or failed gate stops and preserves state. No retry, teardown, deletion, reset,
restore, seed, down migration, or unreviewed workaround is authorized.

### Exact approval statement

> Approve the HCP-04 T054 Postgres forward-repair amendment exactly as recorded
> in HCP-04-infrastructure.md. Bind it to HCP-01 Linux recovery evidence
> SHA-256 `ffe1bcc37df5844002f7ed481b62ac703d58ec6e57fe99bef4689c17fc5a488a`,
> current `compose.yaml` SHA-256
> `caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`,
> existing test SHA-256
> `3843428287a8cdd992f63351ca45bcdfd2035080c37f9c0a2a6b8817e38801bb`,
> and forward-repair proposal evidence
> `evidence/infrastructure/t054-hcp04-postgres-forward-repair-proposal.json`.
> Authorize extending only that test, then only the recorded Postgres `tmpfs`
> override restating `/tmp` and adding
> `/var/run/postgresql:size=16m,mode=0755,uid=100,gid=101,nosuid,nodev,noexec`,
> producing `compose.yaml` SHA-256
> `e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282`,
> its green run, and recorded static verification. Only after those pass,
> authorize (1) one exact disposable `chmod 0700 /var/lib/postgresql/data`
> helper against preserved volume `foundation_postgres_data` without deleting
> `pgdata`, and (2) one recorded project-scoped Postgres-only `--no-deps
> --force-recreate` up with `--no-build --pull never`, preserving project,
> image digest, network, volume, loopback port, profiles, mounts, and external
> synthetic credential-file boundary, followed by bounded health,
> exact-capability, tmpfs, non-root-process, HCP-03 guard, and T054
> continuation checks. Preserve every contract, migration, manifest, lockfile,
> lifecycle restriction, secret boundary, infrastructure resource, recovery
> rule, and exclusion. Stop and preserve state on any mismatch or failure. This
> does not authorize volume deletion/reset/restore, seed, down migration,
> teardown, prune, any other capability/service/image/pull/origin,
> secret inspection/disclosure, production, repository upload, or T055 and
> later.

### Forward-repair decision record

- **Decision**: `approved_with_conditions` for the exact test-first tmpfs source
  change, disposable volume mount-root `chmod 0700`, one Postgres recreation,
  bounded validation, T054 continuation, recovery, and exclusion scope above.
- **Approver/time**: human owner via Codex task; 2026-07-14T00:52:17-07:00.
- **Exact statement supplied**: `Approve the HCP-04 forward-repair exactly as
  written by top-5 execution` — treated as binding approval of the full exact
  approval statement previously requested.
- **Approval binding (pre-implementation)**: checkpoint SHA-256
  `2db8af6b800f452bbfd189a82234f8b5be795657aa79f5782ff79dc4c7040d2b`;
  proposal-evidence SHA-256
  `4c173031bb1327f9f83610bd4d1d400dc27681caaf61006381b6f07960dbc9dd`;
  HCP-01 recovery SHA-256
  `ffe1bcc37df5844002f7ed481b62ac703d58ec6e57fe99bef4689c17fc5a488a`;
  compose SHA-256
  `caf9de5a94c365aecc796eb1256459bc5313fdc4fff385ec80653c4d1d754330`;
  test SHA-256
  `3843428287a8cdd992f63351ca45bcdfd2035080c37f9c0a2a6b8817e38801bb`;
  target compose SHA-256
  `e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282`.
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-forward-repair-decision.json`.
- **Attempt result**: source/test/verification and both authorized runtime
  actions completed. `compose.yaml` reached SHA-256
  `e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282`.
  Volume mount-root mode became `700` with `pgdata` preserved. Container
  recreation applied the exact capabilities and `/var/run/postgresql` tmpfs,
  but Postgres remained restarting/unhealthy because
  `/var/lib/postgresql/data/PG_VERSION` is absent while the cluster exists
  under `pgdata/`. No T054 gate, migration, seed, teardown, volume deletion,
  or secret-value recording occurred. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-forward-repair-attempt.json`.
- **Invalidation**: any bound hash, volume metadata fact, runtime fact,
  resource identity, port, command, source/test result, capability, tmpfs,
  guard, recovery rule, or exclusion change.

## T054 Postgres data-directory layout correction amendment proposal

**Status**: `prepared_layout_correction_implementation_blocked`  
**Prepared**: 2026-07-14T00:56:36-07:00  
**Layout mutation, PGDATA change, recreation, or T054 gate authorized**: no

### Bound failure after approved forward repair

Forward-repair attempt evidence records that tmpfs and mount-root mode repairs
succeeded, yet Postgres still fails with:

1. `FATAL: "/var/lib/postgresql/data" is not a valid data directory`
2. `DETAIL: File "/var/lib/postgresql/data/PG_VERSION" is missing`

Read-only volume metadata shows the cluster under
`/var/lib/postgresql/data/pgdata` (`PG_VERSION` present; major `17`) while the
mount root contains only the `pgdata` directory. Compose currently sets
`PGDATA: /var/lib/postgresql/data/pgdata`. The named volume, network, image
digest, and restarting container remain preserved.

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. Extend/adjust the existing ownership test so its red state proves mount-root
   `PG_VERSION` absence / nested `pgdata` layout incompatibility with the
   intended runtime data directory, without reading database contents.
2. Change only the Postgres `PGDATA` environment value from
   `/var/lib/postgresql/data/pgdata` to `/var/lib/postgresql/data`, and record
   the resulting exact `compose.yaml` SHA-256 after a reviewed dry computation
   bound into the decision evidence before mutation.
3. One disposable, network-none, no-new-privileges helper using the exact
   cached Postgres image, with only the already-approved capability set needed
   for ownership/move, that non-destructively promotes `pgdata/*` to the mount
   root and removes only the empty nested `pgdata` directory afterward. No
   `volume rm`, reset, restore, seed, or prune.
4. One project-scoped Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never`, preserving project/image/network/volume/ports,
   then bounded health, capability, tmpfs, non-root, HCP-03 guard, and T054
   continuation checks.

Stop and preserve state on any mismatch, content loss, or failed check.

### Exact approval statement

> Approve the HCP-04 T054 Postgres data-directory layout correction amendment
> exactly as recorded in HCP-04-infrastructure.md. Bind it to forward-repair
> attempt evidence
> `evidence/infrastructure/t054-hcp04-postgres-forward-repair-attempt.json`
> and the final checkpoint/proposal SHA-256 values at decision time. Authorize
> only the recorded test/source `PGDATA` realignment to
> `/var/lib/postgresql/data`, one non-destructive promote of preserved
> `pgdata/*` to the mount root, one Postgres-only `--no-deps --force-recreate`
> up with `--no-build --pull never`, and the bounded health/capability/tmpfs/
> non-root/HCP-03/T054 continuation checks. Preserve the volume, network,
> image digest, contracts, migrations, manifests, lockfile, lifecycle
> restrictions, and exclusions. This does not authorize volume deletion/reset/
> restore, seed, down migration, teardown, prune, secret inspection/
> disclosure, production, repository upload, or T055 and later.

### Layout-correction decision record

- **Decision**: `approved_with_conditions` for the exact test/source `PGDATA`
  realignment, non-destructive `pgdata/*` promote, one Postgres recreation,
  bounded validation, T054 continuation, recovery, and exclusion scope above.
- **Approver/time**: human owner via Codex task; 2026-07-14T10:37:00-07:00.
- **Exact statement supplied**: `proceeed to approveb` — treated as binding
  approval of the exact layout-correction statement recorded above.
- **Approval binding (pre-implementation)**: forward-repair attempt SHA-256
  `674122ce88749c0075e04fbf5995bd28c059156c514a2bb2b8fc4e2517632755`;
  checkpoint SHA-256
  `79f4d5375aed95d320c51a092d4e686f6a16925d0a0b33a91a5c0e29b909549c`;
  compose SHA-256 before
  `e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282`;
  dry-computed target compose SHA-256
  `96a45acf0b2c376e91a14b5594f1e714b045cf09cdc2951ab75772fa3acec642`
  for sole `PGDATA` change to `/var/lib/postgresql/data`.
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-layout-correction-decision.json`.
- **Attempt result**: source/test/verification, `PGDATA` realignment to
  `/var/lib/postgresql/data` (`compose.yaml` SHA-256
  `96a45acf0b2c376e91a14b5594f1e714b045cf09cdc2951ab75772fa3acec642`),
  non-destructive `pgdata/*` promote, and one Postgres recreation completed.
  Mount-root `PG_VERSION` is present and nested `pgdata/` is absent. Postgres
  remained restarting/unhealthy on a new failure:
  `/etc/postgresql-custom/pgsodium_root.key: Read-only file system` followed by
  `FATAL: invalid secret key`. No T054 gate, migration, seed, teardown, volume
  deletion, or secret-value recording occurred. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-layout-correction-attempt.json`.
- **Invalidation**: any bound hash, layout fact, command, source/test result,
  capability, guard, recovery rule, or exclusion change.

## T054 Postgres pgsodium writable-path amendment proposal

**Status**: `prepared_pgsodium_path_implementation_blocked`  
**Prepared**: 2026-07-14T10:42:00-07:00  
**Source change, recreation, or T054 gate authorized**: no

### Bound failure after approved layout correction

Layout-correction attempt evidence records that mount-root data-directory repair
succeeded. Postgres now fails with:

1. `pgsodium_getkey.sh: /etc/postgresql-custom/pgsodium_root.key: Read-only file system`
2. `FATAL: invalid secret key`

Current `compose.yaml` SHA-256 is
`96a45acf0b2c376e91a14b5594f1e714b045cf09cdc2951ab75772fa3acec642`.
Postgres retains `read_only: true`, the five `cap_add` values, and tmpfs for
`/tmp` plus `/var/run/postgresql` only. The named volume, network, image digest,
and restarting container remain preserved. No secret file contents were
inspected or recorded.

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. Extend the existing ownership test so its red state proves Postgres lacks an
   explicit `/etc/postgresql-custom` tmpfs while retaining every surrounding
   boundary.
2. Add only this one additional Postgres tmpfs entry (restating the existing
   two), producing `compose.yaml` SHA-256
   `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`:

```yaml
    tmpfs:
      - /tmp:size=64m,mode=1777,nosuid,nodev,noexec
      - /var/run/postgresql:size=16m,mode=0755,uid=100,gid=101,nosuid,nodev,noexec
      - /etc/postgresql-custom:size=8m,mode=0700,uid=100,gid=101,nosuid,nodev,noexec
```

3. Green test plus recorded static verification.
4. One project-scoped Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never`, preserving project/image/network/volume/ports,
   then bounded health, capability, tmpfs, non-root, HCP-03 guard, and T054
   continuation checks.

Retain `cap_drop: ALL`, `no-new-privileges`, read-only root filesystem, image
digest, contracts, migrations, manifests, lockfile, and lifecycle restrictions.
Do not inspect or disclose secret values. Stop and preserve state on any
mismatch or failure.

### Exact approval statement

> Approve the HCP-04 T054 Postgres pgsodium writable-path amendment exactly as
> recorded in HCP-04-infrastructure.md. Bind it to layout-correction attempt
> evidence
> `evidence/infrastructure/t054-hcp04-postgres-layout-correction-attempt.json`
> SHA-256
> `68d5b153d5a6bcd7d1d72057a506fabe324d872b9e48a05533d224b57a0f9f1d`
> and current `compose.yaml` SHA-256
> `96a45acf0b2c376e91a14b5594f1e714b045cf09cdc2951ab75772fa3acec642`.
> Authorize extending only the ownership test, then only the recorded Postgres
> tmpfs addition of
> `/etc/postgresql-custom:size=8m,mode=0700,uid=100,gid=101,nosuid,nodev,noexec`
> (restating `/tmp` and `/var/run/postgresql`), producing `compose.yaml`
> SHA-256
> `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`,
> its green run, recorded static verification, one Postgres-only `--no-deps
> --force-recreate` up with `--no-build --pull never`, and the bounded
> health/capability/tmpfs/non-root/HCP-03/T054 continuation checks. Preserve
> read-only root, capabilities, volume, network, image digest, contracts,
> migrations, manifests, lockfile, lifecycle restrictions, and exclusions.
> Do not inspect or disclose secret values. This does not authorize volume
> deletion/reset/restore, seed, down migration, teardown, prune, production,
> repository upload, or T055 and later.

### Pgsodium-path decision record

- **Decision**: `approved_with_conditions` for the exact ownership-test extension,
  Postgres `/etc/postgresql-custom` tmpfs addition, one recreation, bounded
  validation, T054 continuation, recovery, and exclusion scope above.
- **Approver/time**: human owner via Codex task; 2026-07-14T12:09:21-07:00.
- **Exact statement supplied**: `proceed` — treated as binding approval of the
  exact pgsodium writable-path statement recorded above.
- **Approval binding (pre-implementation)**: layout-correction attempt SHA-256
  `68d5b153d5a6bcd7d1d72057a506fabe324d872b9e48a05533d224b57a0f9f1d`;
  compose SHA-256
  `96a45acf0b2c376e91a14b5594f1e714b045cf09cdc2951ab75772fa3acec642`;
  checkpoint SHA-256
  `e69829c17e8481b1d5b29b05bb4ca50b8d133e534d5572d644b09990bda010e4`;
  target compose SHA-256
  `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`.
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-pgsodium-path-decision.json`.
- **Attempt result**: source/test/verification and one Postgres recreation
  completed. `compose.yaml` reached SHA-256
  `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`
  with `/etc/postgresql-custom` tmpfs present. Postgres remained
  restarting/unhealthy because the empty tmpfs masked image-baked includes
  (`wal-g.conf`, `read-replica.conf`, `supautils.conf`, `conf.d`), causing
  `FATAL: configuration file "/etc/postgresql/postgresql.conf" contains errors`.
  Image listing (no overlay) shows those files present and no
  `pgsodium_root.key` in the image. No T054 gate, migration, seed, teardown,
  data-volume deletion, or secret-value recording occurred. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-pgsodium-path-attempt.json`.
- **Invalidation**: any bound hash, runtime fact, command, source/test result,
  capability, tmpfs, guard, recovery rule, or exclusion change.

## T054 Postgres seeded custom-config volume amendment proposal

**Status**: `prepared_seeded_custom_volume_implementation_blocked`  
**Prepared**: 2026-07-14T12:10:45-07:00  
**Source change, volume create/seed, recreation, or T054 gate authorized**: no

### Bound failure after approved empty tmpfs

Pgsodium-path attempt evidence records that empty tmpfs at
`/etc/postgresql-custom` hides required image config includes while
`pgsodium_root.key` must still be creatable at runtime. Current `compose.yaml`
SHA-256 is
`bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`.
Data volume `foundation_postgres_data`, network, image digest, and restarting
container remain preserved.

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. Extend the ownership test so its red state proves `/etc/postgresql-custom`
   is still an empty tmpfs overlay rather than a seeded named volume mount.
2. Change only Postgres topology as follows, producing `compose.yaml` SHA-256
   `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`:
   - remove the `/etc/postgresql-custom` tmpfs entry (retain `/tmp` and
     `/var/run/postgresql`);
   - add volume mount `foundation_postgres_custom:/etc/postgresql-custom`;
   - add disposable named volume `foundation_postgres_custom` with the same
     foundation labels used by other local volumes.
3. Green test plus recorded static verification.
4. One disposable, network-none, no-new-privileges helper using the exact
   cached Postgres image that copies image directory contents only:

`docker.exe run --rm --network none --cap-drop ALL --security-opt
no-new-privileges:true -v foundation_postgres_custom:/dest --entrypoint sh
IMAGE -c 'cp -a /etc/postgresql-custom/. /dest/ && chown -R 100:101 /dest &&
chmod 700 /dest && test -f /dest/wal-g.conf && test -f /dest/supautils.conf &&
test -d /dest/conf.d'`

   No secret-value inspection, no data-volume mutation, no SQL.
5. One project-scoped Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never`, preserving project/image/network/data-volume/
   ports, then bounded health, capability, tmpfs, non-root, HCP-03 guard, and
   T054 continuation checks.

Stop and preserve state on any mismatch, content loss, or failed check.

### Exact approval statement

> Approve the HCP-04 T054 Postgres seeded custom-config volume amendment exactly
> as recorded in HCP-04-infrastructure.md. Bind it to pgsodium-path attempt
> evidence
> `evidence/infrastructure/t054-hcp04-postgres-pgsodium-path-attempt.json`
> SHA-256
> `50298f15f77f5be93e1c1519fb2c0dff382696346c2eb8f36568e2fcc0964af9`
> and current `compose.yaml` SHA-256
> `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`.
> Authorize extending only the ownership test, then only the recorded compose
> change that removes `/etc/postgresql-custom` tmpfs, mounts disposable named
> volume `foundation_postgres_custom` at `/etc/postgresql-custom`, and declares
> that volume, producing `compose.yaml` SHA-256
> `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
> Authorize one image-to-volume directory copy seed of
> `/etc/postgresql-custom` defaults without secret-value inspection, then one
> Postgres-only `--no-deps --force-recreate` up with `--no-build --pull never`,
> and the bounded health/capability/tmpfs/non-root/HCP-03/T054 continuation
> checks. Preserve read-only root, capabilities, data volume, network, image
> digest, contracts, migrations, manifests, lockfile, lifecycle restrictions,
> and exclusions. This does not authorize data-volume deletion/reset/restore,
> seed SQL, down migration, teardown, prune, secret inspection/disclosure,
> production, repository upload, or T055 and later.

### Seeded-custom-volume decision record

- **Decision**: `approved_with_conditions` for the exact ownership-test
  extension, compose volume/tmpfs realignment, one image-to-volume directory
  copy seed, one Postgres recreation, bounded validation, T054 continuation,
  recovery, and exclusion scope above.
- **Approver/time**: human owner via Codex task; 2026-07-14T13:55:34-07:00.
- **Exact statement supplied**: `approve the seeded custom-config volume
  amendment.` — treated as binding approval of the exact statement recorded
  above.
- **Approval binding (pre-implementation)**: pgsodium-path attempt SHA-256
  `50298f15f77f5be93e1c1519fb2c0dff382696346c2eb8f36568e2fcc0964af9`;
  compose SHA-256
  `bbaf7ebba6e226d7e9606c9e2b6b0f6ee344aa4a8a537761f70deaedd933dcc0`;
  checkpoint SHA-256
  `09ac7fb1ee8a8fe20f81751480f9ffc7d51723527768f07793ce2c5f6440830b`;
  target compose SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-seeded-custom-volume-decision.json`.
- **Attempt result**: source/test/verification completed and `compose.yaml`
  reached SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
  The exact approved seed helper (`--cap-drop ALL` then `chown -R 100:101`)
  exited 1 with `Operation not permitted` on ownership preservation/chown.
  `foundation_postgres_custom` contains copied directory names as `root:root`
  (`wal-g.conf`, `supautils.conf`, `conf.d` present; no `pgsodium_root.key`).
  No unapproved capability was added. Postgres was not recreated under this
  amendment; data volume remained preserved. No T054 gate, SQL seed, teardown,
  or secret-value recording occurred. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-seeded-custom-volume-attempt.json`.
- **Invalidation**: any bound hash, volume identity, command, source/test
  result, capability, mount, guard, recovery rule, or exclusion change.

## T054 Postgres seed-helper capability amendment proposal

**Status**: `approved_with_conditions`  
**Prepared**: 2026-07-14T13:56:30-07:00  
**Approved**: 2026-07-14T14:40:31-07:00  
**Seed re-run, recreation, or T054 gate authorized**: yes, exactly as recorded below

### Bound failure after approved seeded-custom-volume source

Seeded-custom-volume attempt evidence records that compose source is approved
and applied, but the exact seed helper fails because `--cap-drop ALL` denies
`chown`. Current bindings:

- `compose.yaml` SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`
- attempt evidence SHA-256
  `bec81cc110dab49dac21c6f472ecf0b086ed3da8c44d1895c503e13d3279e3dc`
  (`evidence/infrastructure/t054-hcp04-postgres-seeded-custom-volume-attempt.json`)
- custom volume `foundation_postgres_custom` partially populated as `root:root`
- data volume `foundation_postgres_data` preserved
- Postgres container still restarting/unhealthy from prior topology

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. Re-run one disposable, network-none, no-new-privileges seed helper using the
   exact cached Postgres image against existing `foundation_postgres_custom`,
   with `--cap-drop ALL` plus only `CHOWN`, `DAC_OVERRIDE`, and `FOWNER`
   (same capability names already approved for the Postgres service), running:

`docker.exe run --rm --network none --cap-drop ALL --cap-add CHOWN
--cap-add DAC_OVERRIDE --cap-add FOWNER --security-opt no-new-privileges:true
-v foundation_postgres_custom:/dest --entrypoint sh IMAGE -c
'cp -a /etc/postgresql-custom/. /dest/ && chown -R 100:101 /dest &&
chmod 700 /dest && test -f /dest/wal-g.conf && test -f /dest/supautils.conf &&
test -d /dest/conf.d && test ! -f /dest/pgsodium_root.key || true'`

   Directory-name/mode checks only; no secret-value inspection; no data-volume
   mutation; no SQL.
2. One project-scoped Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never`, preserving project/image/network/data-volume/
   custom-volume/ports, then bounded health, capability, tmpfs, non-root,
   HCP-03 guard, and T054 continuation checks.

No compose source change is proposed. Stop and preserve state on any mismatch
or failure.

### Exact approval statement

> Approve the HCP-04 T054 Postgres seed-helper capability amendment exactly as
> recorded in HCP-04-infrastructure.md. Bind it to seeded-custom-volume attempt
> evidence
> `evidence/infrastructure/t054-hcp04-postgres-seeded-custom-volume-attempt.json`
> (SHA-256
> `bec81cc110dab49dac21c6f472ecf0b086ed3da8c44d1895c503e13d3279e3dc`)
> and current `compose.yaml` SHA-256
> `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
> Authorize one seed helper against existing `foundation_postgres_custom` using
> `--cap-drop ALL` plus only `CHOWN`, `DAC_OVERRIDE`, and `FOWNER`, the recorded
> image-to-volume directory copy and ownership normalization without secret
> inspection, then one Postgres-only `--no-deps --force-recreate` up with
> `--no-build --pull never`, and the bounded health/capability/tmpfs/non-root/
> HCP-03/T054 continuation checks. Preserve compose source, read-only root,
> data volume, network, image digest, contracts, migrations, manifests,
> lockfile, lifecycle restrictions, and exclusions. This does not authorize
> data-volume deletion/reset/restore, SQL seed, down migration, teardown,
> prune, secret inspection/disclosure, production, repository upload, or T055
> and later.

### Seed-helper-capability decision record

- **Decision**: `approved_with_conditions` (2026-07-14T14:40:31-07:00).
- **Approver**: human owner via Codex task (`proceed`, interpreted as the exact
  statement recorded above).
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-seed-helper-capability-decision.json`.
- **Bindings verified before mutation**: attempt SHA-256
  `bec81cc110dab49dac21c6f472ecf0b086ed3da8c44d1895c503e13d3279e3dc`;
  compose SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
- **Attempt result**: seed helper exit 0 with ownership `100:101` and mode
  `700` on `foundation_postgres_custom`; one Postgres recreate reached
  `running`/`healthy`; pgsodium key loaded; data volume preserved; custom
  tmpfs absent. Continuation blocked: HCP-03 database
  `platform_foundation_hcp03` absent; host port `127.0.0.1:55432` unpublished
  because recreate used `compose.yaml` only; approved migration sources absent
  from `supabase/migrations`. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-seed-helper-capability-attempt.json`.
- **Invalidation**: any bound hash, volume identity, capability set, command,
  guard, recovery rule, or exclusion change.

## T054 Postgres port-restore and HCP-03 continuation proposal

**Status**: `approved_with_conditions`  
**Prepared**: 2026-07-14T14:43:23-07:00  
**Approved**: 2026-07-14T14:47:51-07:00  
**Recreation, migration restore, or DB application authorized**: yes, exactly as recorded below

### Bound failure after healthy seeded Postgres

Seed-helper-capability attempt evidence records healthy Postgres with seeded
custom volume, but T054 cannot complete. Current bindings:

- `compose.yaml` SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`
- attempt evidence SHA-256
  `e304b0899c899a1b449e9129f57db4376a7ab10f3b6140e5e8dc990a3a2e864d`
  (`evidence/infrastructure/t054-hcp04-postgres-seed-helper-capability-attempt.json`)
- volumes `foundation_postgres_data` and `foundation_postgres_custom` preserved
- databases present: `postgres`, `template0`, `template1` only
- `supabase/migrations` currently contains only empty stub
  `202607140001_bootstrap.sql`; retained backups at
  `supabase/migrations_backup/202607100001_foundation_bootstrap.sql`,
  `202607100002_identity_tenancy_foundation.sql`,
  `202607100003_control_and_evidence_foundation.sql`

### Exact proposed correction (approval required before any action)

After exact approvals, authorize only:

1. **HCP-04**: one Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never`, using both `compose.yaml` and
   `infra/environments/local/compose.override.yaml`, preserving project/image/
   network/data-volume/custom-volume and restoring published
   `127.0.0.1:55432`. No data-volume wipe. No secret inspection.
2. **HCP-03 / source restore**: replace the empty stub by restoring the three
   approved migration files from `supabase/migrations_backup/` into
   `supabase/migrations/` exactly (byte-identical restore; no SQL rewrite),
   remove or retire the empty `202607140001_bootstrap.sql` stub from that path,
   and retain hashes.
3. **HCP-03**: on the disposable target, create database
   `platform_foundation_hcp03` with comment
   `DISPOSABLE:002-platform-foundation:HCP-03` if absent, apply the three
   approved migrations only, refresh
   `evidence/persistence/hcp03-target-attestation.json`, then rerun migration/
   RLS/runtime health gates. No production. No volume wipe. No secret
   disclosure.

Stop and preserve state on any mismatch or failure.

### Exact approval statement

> Approve the HCP-04 T054 Postgres port-restore recreate and the HCP-03
> migration-source restore plus disposable database application continuation
> exactly as recorded in HCP-04-infrastructure.md. Bind them to seed-helper
> capability attempt evidence
> `evidence/infrastructure/t054-hcp04-postgres-seed-helper-capability-attempt.json`
> (SHA-256
> `e304b0899c899a1b449e9129f57db4376a7ab10f3b6140e5e8dc990a3a2e864d`)
> and current `compose.yaml` SHA-256
> `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
> Authorize one Postgres-only `--no-deps --force-recreate` with
> `--no-build --pull never` using `compose.yaml` plus
> `infra/environments/local/compose.override.yaml` to restore
> `127.0.0.1:55432`; restore the three approved migration files from
> `supabase/migrations_backup/` into `supabase/migrations/` without SQL
> rewrite; create/verify disposable database `platform_foundation_hcp03` with
> comment `DISPOSABLE:002-platform-foundation:HCP-03`; apply only those three
> migrations; refresh HCP-03 target attestation; and rerun migration/RLS/
> runtime health/T054 continuation checks. Preserve data volume, custom volume,
> network, image digest, contracts, manifests, lockfile, lifecycle restrictions,
> and exclusions. This does not authorize data-volume deletion/reset/restore,
> SQL beyond the restored approved migrations, down migration, teardown, prune,
> secret inspection/disclosure, production, repository upload, or T055 and
> later.

### Continuation decision record

- **Decision**: `approved_with_conditions` (2026-07-14T14:47:51-07:00).
- **Approver**: human owner via Codex task (`continue`, interpreted as the exact
  statement recorded above).
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-port-restore-hcp03-continuation-decision.json`.
- **Bindings verified before mutation**: attempt SHA-256
  `e304b0899c899a1b449e9129f57db4376a7ab10f3b6140e5e8dc990a3a2e864d`;
  compose SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
- **Attempt result**: migrations restored byte-identical; override recreate
  executed; disposable DB `platform_foundation_hcp03` created with comment
  `DISPOSABLE:002-platform-foundation:HCP-03`; migration 001 failed with
  `role "postgres" does not exist` and rolled back; host
  `127.0.0.1:55432` remained unbound (`NetworkSettings.Ports` empty despite
  HostConfig binding). No invented role and no second recreate. Sanitized
  evidence:
  `evidence/infrastructure/t054-hcp04-postgres-port-restore-hcp03-continuation-attempt.json`.
- **Invalidation**: any bound hash, volume identity, compose file set, migration
  identity, command, guard, recovery rule, or exclusion change.

## T054 Postgres role precondition and host-port repair proposal

**Status**: `approved_with_conditions`  
**Prepared**: 2026-07-14T14:50:30-07:00  
**Approved**: 2026-07-14T15:04:11-07:00  
**Role creation, second recreate, or migration re-apply authorized**: yes, exactly as recorded below

### Bound failure after continuation attempt

Continuation attempt evidence records restored migrations and a created
disposable database, but apply/publish remain blocked:

- attempt evidence SHA-256
  `ea9e25802896712301d57e42f573a006f44a0f9a4722cd0671bdf5b62ac1a8f8`
  (`evidence/infrastructure/t054-hcp04-postgres-port-restore-hcp03-continuation-attempt.json`)
- `compose.yaml` SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`
- migration SHA-256 values unchanged from the continuation decision
- DB `platform_foundation_hcp03` present with required comment; schemas absent
  after rollback
- HostConfig intends `127.0.0.1:55432` but published port is not active

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. **HCP-03 precondition** (no migration SQL rewrite): one statement
   `CREATE ROLE postgres NOLOGIN;` on the disposable database cluster (or
   equivalent reviewed `CREATE ROLE postgres` with NOLOGIN) executed as
   `supabase_admin`, solely so migration 001's existing
   `grant usage on schema platform_private to postgres;` can succeed.
2. **HCP-04**: one additional Postgres-only `--no-deps --force-recreate` up with
   `--no-build --pull never` using `compose.yaml` plus
   `infra/environments/local/compose.override.yaml`, then verify host TCP
   `127.0.0.1:55432` succeeds. Preserve data/custom volumes.
3. Re-apply restored migrations 001-003 in single transactions with
   `migration_sha256` bindings; write
   `evidence/persistence/hcp03-target-attestation.json`; rerun migration/RLS/
   runtime health/T054 gates.

Stop and preserve state on any mismatch or failure.

### Exact approval statement

> Approve the HCP-04/HCP-03 T054 Postgres role-precondition and host-port repair
> amendment exactly as recorded in HCP-04-infrastructure.md. Bind it to
> continuation attempt evidence
> `evidence/infrastructure/t054-hcp04-postgres-port-restore-hcp03-continuation-attempt.json`
> (SHA-256
> `ea9e25802896712301d57e42f573a006f44a0f9a4722cd0671bdf5b62ac1a8f8`)
> and current `compose.yaml` SHA-256
> `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
> Authorize `CREATE ROLE postgres NOLOGIN;` as the only extra SQL precondition;
> one Postgres-only override recreate with `--no-deps --force-recreate`,
> `--no-build --pull never` to restore reachable `127.0.0.1:55432`; re-apply the
> three already-restored migrations only; refresh HCP-03 target attestation; and
> finish T054 gates. Preserve data volume, custom volume, network, image digest,
> restored migration bytes, contracts, manifests, lockfile, and exclusions.
> This does not authorize data-volume wipe, migration SQL rewrite, down
> migration, teardown, prune, secret inspection/disclosure, production,
> repository upload, or T055 and later.

### Role-and-port-repair decision record

- **Decision**: `approved_with_conditions` (2026-07-14T15:04:11-07:00).
- **Approver**: human owner via Codex task (`continue`, interpreted as the exact
  statement recorded above).
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-role-port-repair-decision.json`.
- **Bindings verified before mutation**: attempt SHA-256
  `ea9e25802896712301d57e42f573a006f44a0f9a4722cd0671bdf5b62ac1a8f8`;
  compose SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
- **Attempt result**: `CREATE ROLE postgres NOLOGIN;` succeeded
  (`canlogin=false`) and survived recreate. Override recreate left Postgres
  `running`/`healthy` with disposable DB and comment intact. Host
  `127.0.0.1:55432` remained unreachable: Postgres is only on
  `foundation_data` (`platform-foundation-local-data`) which is
  `internal: true`, so published ports cannot activate. Migrations were not
  re-applied after failed port verification. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-role-port-repair-attempt.json`.
- **Invalidation**: any bound hash, role statement, port binding, migration
  identity, command, guard, recovery rule, or exclusion change.

## T054 Postgres publishability / transport amendment proposal

**Status**: `approved_with_conditions` — Option A  
**Prepared**: 2026-07-14T15:05:36-07:00  
**Approved**: 2026-07-14T15:11:48-07:00  
**Topology change, transport change, or migration re-apply authorized**: yes, Option A only

### Bound failure after role/port repair

Role/port-repair attempt evidence records that `CREATE ROLE postgres NOLOGIN`
succeeded, but host publish cannot work while Postgres remains solely on an
internal network:

- attempt evidence SHA-256
  `4281ddd2701b96236b40bc83029cb72b8526cd50a591529910ec87b20e0387be`
  (`evidence/infrastructure/t054-hcp04-postgres-role-port-repair-attempt.json`)
- `compose.yaml` SHA-256
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`
- network `platform-foundation-local-data` Internal=true
- role `postgres` NOLOGIN present; DB `platform_foundation_hcp03` present
- migrations restored and unchanged; not yet re-applied

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only one of the following mutually
exclusive options, then re-apply migrations / attest / finish T054:

**Option A — attach Postgres to edge for publish (preferred least-privilege)**  
Add `foundation_edge` to the Postgres service `networks` list in `compose.yaml`
(keep `foundation_data`), then one Postgres-only override recreate with
`--no-deps --force-recreate --no-build --pull never`, verify
`127.0.0.1:55432`, re-apply migrations 001-003, attest, finish T054 gates.

**Option B — make data network non-internal for local disposable use**  
Set `foundation_data.internal: false` in `compose.yaml`, recreate as above,
verify port, re-apply, attest, finish T054.

**Option C — docker-exec transport without host port**  
Amend HCP-03 attestation/harness to use docker-exec only (no
`127.0.0.1:55432` requirement), then re-apply migrations via approved adapter,
attest, finish T054. No compose topology change.

Preserve data/custom volumes, role, disposable DB, restored migration bytes.
No volume wipe. No secret inspection. No production.

### Exact approval statement

> Approve the HCP-04 T054 Postgres publishability/transport amendment Option
> \<A|B|C\> exactly as recorded in HCP-04-infrastructure.md. Bind it to role/
> port-repair attempt evidence
> `evidence/infrastructure/t054-hcp04-postgres-role-port-repair-attempt.json`
> (SHA-256
> `4281ddd2701b96236b40bc83029cb72b8526cd50a591529910ec87b20e0387be`)
> and current `compose.yaml` SHA-256
> `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
> Authorize only the selected option's topology or harness change, one Postgres
> recreate if required by that option, re-apply of the three restored
> migrations, HCP-03 attestation refresh, and T054 gate completion. Preserve
> data volume, custom volume, `postgres` NOLOGIN role, disposable database,
> restored migration bytes, contracts, manifests, lockfile, and exclusions.
> This does not authorize data-volume wipe, migration SQL rewrite, down
> migration, teardown, prune, secret inspection/disclosure, production,
> repository upload, or T055 and later.

### Publishability decision record

- **Decision**: `approved_with_conditions` — Option A (2026-07-14T15:11:48-07:00).
- **Approver**: human owner via Codex task (explicit Option A selection).
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-postgres-publishability-option-a-decision.json`.
- **Bindings verified before mutation**: attempt SHA-256
  `4281ddd2701b96236b40bc83029cb72b8526cd50a591529910ec87b20e0387be`;
  compose SHA-256 before
  `1d27c72aba138d0ba7a8d83a401ddd38224a6a81e2c5f48201825f2d225d6e14`.
- **Authorized topology change**: add `foundation_edge` to Postgres
  `networks`; keep `foundation_data.internal: true`. Options B and C not
  authorized.
- **Attempt result**: compose after SHA-256
  `67ff1a75bbeaa48159a90828d0ef865d04b62758b72a3a8feb54f7dfa1d3f931`;
  Postgres on edge+data; `127.0.0.1:55432` reachable; data network still
  internal. Migration 001 from authorized `migrations_backup` committed only
  `platform_private` helpers (no `platform` schema/roles/ledger). Migration
  002 failed with `schema "platform" does not exist` and rolled back.
  Attestation/T054 gates not completed. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-postgres-publishability-option-a-attempt.json`.
- **Invalidation**: any bound hash, option selection, topology, transport,
  command, guard, recovery rule, or exclusion change.

## T054 migration-source recovery amendment proposal

**Status**: `approved_with_conditions`  
**Prepared**: 2026-07-14T15:12:56-07:00  
**Approved**: 2026-07-14T15:31:40-07:00  
**Migration replacement or partial-state cleanup authorized**: yes, exactly as recorded below

### Bound failure after Option A

Option A publishability succeeded, but re-apply is blocked by incomplete
restored migration 001 bytes:

- attempt evidence SHA-256
  `0b7b9296f26e15711d2d73386b85c0c00ac8f23021e3559eda4b83c30acb8c31`
  (`evidence/infrastructure/t054-hcp04-postgres-publishability-option-a-attempt.json`)
- compose SHA-256
  `67ff1a75bbeaa48159a90828d0ef865d04b62758b72a3a8feb54f7dfa1d3f931`
- host `127.0.0.1:55432` reachable; role `postgres` NOLOGIN present
- partial objects: schema `platform_private` with 6 functions; no `platform`
  schema; no platform roles; no ledger
- observed but unused more-complete candidate:
  `202607100001_foundation_bootstrap.backup.sql` SHA-256
  `42f05e7f705a7a37a36e9cfd966c8c4625db55c0ca038f39d47bfe45443dc77b`
  (contains platform schema, roles, ledger; does not match historical t039 hash)

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only:

1. Replace `supabase/migrations/202607100001_foundation_bootstrap.sql` with an
   explicitly approved complete source (name the exact file/hash in the
   approval), and confirm 002/003 remain the reviewed pair or are likewise
   replaced with named hashes.
2. Guarded cleanup of the partial `platform_private` objects on disposable
   `platform_foundation_hcp03` only (for example
   `drop schema if exists platform_private cascade;`) with no data-volume wipe.
3. Re-apply migrations 001-003, refresh HCP-03 attestation, finish T054 gates.

Preserve Option A topology, volumes, `postgres` NOLOGIN role, and disposable DB
identity/comment.

### Exact approval statement

> Approve the HCP-03/HCP-04 T054 migration-source recovery amendment exactly as
> recorded in HCP-04-infrastructure.md. Bind it to Option A attempt evidence
> `evidence/infrastructure/t054-hcp04-postgres-publishability-option-a-attempt.json`
> (SHA-256
> `0b7b9296f26e15711d2d73386b85c0c00ac8f23021e3559eda4b83c30acb8c31`)
> and current `compose.yaml` SHA-256
> `67ff1a75bbeaa48159a90828d0ef865d04b62758b72a3a8feb54f7dfa1d3f931`.
> Authorize replacement of incomplete restored migration 001 with
> `202607100001_foundation_bootstrap.backup.sql` (SHA-256
> `42f05e7f705a7a37a36e9cfd966c8c4625db55c0ca038f39d47bfe45443dc77b`)
> into `supabase/migrations/202607100001_foundation_bootstrap.sql`, retain
> current 002/003 hashes unless separately named, guarded cleanup of partial
> `platform_private` objects on disposable `platform_foundation_hcp03`, re-apply
> of migrations 001-003, HCP-03 attestation refresh, and T054 gate completion.
> Preserve Option A topology, data/custom volumes, `postgres` NOLOGIN role,
> disposable database identity/comment, contracts, manifests, lockfile, and
> exclusions. This does not authorize data-volume wipe, down migration,
> teardown, prune, secret inspection/disclosure, production, repository upload,
> or T055 and later.

### Migration-source-recovery decision record

- **Decision**: `approved_with_conditions` (2026-07-14T15:31:40-07:00).
- **Approver**: human owner via Codex task (`continue`, interpreted as this
  recovery amendment — not Option B).
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-migration-source-recovery-decision.json`.
- **Bindings verified before mutation**: Option A attempt SHA-256
  `0b7b9296f26e15711d2d73386b85c0c00ac8f23021e3559eda4b83c30acb8c31`;
  compose SHA-256
  `67ff1a75bbeaa48159a90828d0ef865d04b62758b72a3a8feb54f7dfa1d3f931`;
  replacement 001 SHA-256
  `42f05e7f705a7a37a36e9cfd966c8c4625db55c0ca038f39d47bfe45443dc77b`.
- **Attempt result**: 001 replaced; `DROP SCHEMA IF EXISTS platform_private
  CASCADE` succeeded; re-apply of 001 failed with
  `schema "platform_private" does not exist` on
  `revoke all privileges on schema platform_private from public` because the
  approved 001 never creates that schema. Transaction rolled back. No SQL
  rewrite invented. Sanitized evidence:
  `evidence/infrastructure/t054-hcp04-migration-source-recovery-attempt.json`.
- **Invalidation**: any bound hash, replacement source, cleanup command, or
  exclusion change.

## T054 migration-001 platform_private create forward-fix proposal

**Status**: `prepared_001_missing_platform_private_create_blocked`  
**Prepared**: 2026-07-14T15:32:35-07:00  
**SQL forward fix authorized**: no

### Bound failure

Recovery attempt evidence records that approved 001 hash `42f05e7f…` creates
`platform` but never `platform_private` before using it.

- attempt evidence SHA-256
  `e09cc966cf2a6c07230de51234ba22f9da6808e83c90a27c2ba6d08cca85c53f`
  (`evidence/infrastructure/t054-hcp04-migration-source-recovery-attempt.json`)
- compose SHA-256
  `67ff1a75bbeaa48159a90828d0ef865d04b62758b72a3a8feb54f7dfa1d3f931`
- migration 001 SHA-256
  `42f05e7f705a7a37a36e9cfd966c8c4625db55c0ca038f39d47bfe45443dc77b`
- 002/003 unchanged; Option A port healthy; disposable DB empty of platform
  schemas after rollback

### Exact proposed correction (approval required before any action)

After a new exact approval, authorize only this minimal forward edit to
`supabase/migrations/202607100001_foundation_bootstrap.sql`:

Immediately after `create schema if not exists platform;`, insert:

`create schema if not exists platform_private;`

No other SQL changes. Retain 002/003. Then re-apply 001-003, refresh HCP-03
attestation, finish T054 gates. Preserve Option A topology, volumes, role, and
disposable DB identity/comment.

### Exact approval statement

> Approve the HCP-03 T054 migration-001 platform_private create forward-fix
> exactly as recorded in HCP-04-infrastructure.md. Bind it to recovery attempt
> evidence
> `evidence/infrastructure/t054-hcp04-migration-source-recovery-attempt.json`
> (SHA-256
> `e09cc966cf2a6c07230de51234ba22f9da6808e83c90a27c2ba6d08cca85c53f`)
> and migration 001 SHA-256 before fix
> `42f05e7f705a7a37a36e9cfd966c8c4625db55c0ca038f39d47bfe45443dc77b`.
> Authorize only inserting `create schema if not exists platform_private;`
> immediately after `create schema if not exists platform;` in
> `supabase/migrations/202607100001_foundation_bootstrap.sql`, then re-apply
> migrations 001-003, refresh HCP-03 attestation, and finish T054 gates.
> Preserve Option A topology, data/custom volumes, `postgres` NOLOGIN role,
> disposable database identity/comment, contracts, manifests, lockfile, and
> exclusions. This does not authorize broader SQL rewrite, data-volume wipe,
> down migration, teardown, prune, secret inspection/disclosure, production,
> repository upload, Option B, or T055 and later.

### Forward-fix decision record

- **Decision**: pending; preparation only.
- **Required approver**: user in the Codex task.
- **Invalidation**: any bound hash, edit text, command, or exclusion change.

## T054 Windows Docker adapter refresh

On 2026-07-16 the user approved the HCP-03 T054 continuation with Windows
Node.js 24.18.0 and the existing Docker executable at
`C:\Program Files\Docker\Docker\resources\bin\docker.exe`, SHA-256
`834d45bd30c6d08f1045f39a48fda64cf563f89e6f217a0dac53742612634fe2`.
Only the guarded harness/attestation adapter bindings, disposable database
application, migration/RLS gates, and sanitized evidence are authorized.
Volumes, Option A topology, and every production/secret/teardown/T055 exclusion
remain unchanged. The exact decision is retained in
`evidence/persistence/t054-hcp03-windows-adapter-decision.json`.

### Windows adapter attempt result

The pre-mutation check on 2026-07-16 confirmed the approved Docker executable,
image digest, healthy container, PostgreSQL 17.6 tool versions, and exact tool
hashes. It stopped before database access because the container reported
`{"5432/tcp":null}` and `127.0.0.1:55432` was unreachable. No database query,
reset, backup, migration, volume operation, or teardown occurred. Continuing
requires a separate exact HCP-04 approval for one Postgres-only recreate with
the approved local override and no volume deletion.

### Windows port-restore decision

- **Decision**: `approved_with_conditions`.
- **Approver**: user in the Codex task (response: `proceed`).
- **Decision time**: 2026-07-16; no clock time supplied by the user.
- **Authorized action**: one Postgres-only `--no-deps --force-recreate
  --no-build --pull never` using `compose.yaml` plus
  `infra/environments/local/compose.override.yaml`, solely to restore
  `127.0.0.1:55432`; after guard revalidation, continue the already-approved
  disposable database reset, migrations 001-003, RLS gates, and evidence.
- **Preserved/excluded**: all data/custom volumes and Option A topology are
  preserved; teardown, volume deletion, secrets, production, repository upload,
  and T055 or later remain excluded.
- **Decision evidence**:
  `evidence/infrastructure/t054-hcp04-windows-port-restore-decision.json`.
