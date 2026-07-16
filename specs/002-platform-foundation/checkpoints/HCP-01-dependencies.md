# HCP-01: Bootstrap Dependencies and Lockfile

**Status**: `approved_with_conditions`; T024-T025 complete  
**Prepared**: 2026-07-10  
**Tasks**: T022-T024  
**Requirements**: PF-023, PF-026, PF-028, PF-032, HITL-001, HITL-002  
**Protected action**: adding or replacing tools/packages, activating a package
manager, downloading executable artifacts, running an installer, and creating or
changing a dependency lockfile  
**Blocks**: T024 and every unlisted dependency or tool addition

## Requested decision

Approve, approve with conditions, or deny the exact bootstrap cohort and commands
in this record. Approval is intentionally narrow: it supports only the official
Spec Kit pin, agent-context reconciliation, root TypeScript workspace tooling,
and deterministic package scripts required by T024. It does not approve product
runtime packages, database tools, browsers, scanners, containers, infrastructure,
public contracts, persistence changes, or deployment.

## Current environment

| Item | Current state | Proposed state |
|---|---|---|
| Node.js | 22.23.0 from `/usr/bin/node` | 24.18.0 LTS selected through `.node-version`; installation only if the host lacks it |
| npm | 10.9.8 | Retained only as bundled bootstrap tooling; not the workspace package manager |
| Corepack | 0.34.6 from `/usr/bin/corepack` | Retained; used to activate the exact pnpm pin |
| pnpm | Not active | 11.11.0, exact package-manager pin |
| Python | 3.12.3 | Retained within the existing 3.11-3.13 support range |
| uv | Not installed | 0.11.21, exact installer/tool-manager pin |
| Specify CLI | 0.12.10.dev0 at `/mnt/c/Users/brand/.local/bin/specify.exe` | Official Spec Kit v0.12.9 in an isolated managed tool environment |
| Node lockfile | None | One reviewed `pnpm-lock.yaml`, generated with lifecycle scripts disabled |

## Exact approved-inventory proposal

All versions are exact. Package manifests and the lockfile must not use `^`, `~`,
`latest`, floating Git references, or unpinned URLs. Registry integrity and
provenance fields are retained in the lockfile/evidence produced by T024.

| Dependency/tool | Version/source | Purpose | License | Provenance and maintenance | Pre-install vulnerability baseline | Removal/recovery path |
|---|---|---|---|---|---|---|
| Node.js | 24.18.0 LTS from `nodejs.org` | Approved Node 24 runtime baseline | MIT | Official signed Node.js LTS release; active Krypton LTS line | Latest identified Node 24 LTS release on 2026-07-10; official checksum/signature verification is mandatory before any downloaded binary is used | Select the prior host runtime and revert `.node-version`; no data migration |
| Corepack | Existing 0.34.6 only | Activate the exact pnpm package-manager pin | MIT | Pre-existing `/usr/bin/corepack`; no Corepack download approved | Existing host tool; version recorded, no new package graph | Disable the prepared pnpm version and restore prior Corepack state |
| pnpm | 11.11.0 from npm public registry | Workspace/package manager and deterministic lockfile | MIT | Official `pnpm` package; npm provenance attestation and integrity `sha512-RGP2X9gO2A1pvB1L8WPulPYFxzgPwxi7Wy6+FfjNEtScUaTVnpUbQB52TTtsp1HL9RvFDtcAGmvLSTXmhMNIgg==`; active pnpm 11 line | Direct package metadata reviewed; transitive audit unavailable until the first lockfile is resolved | Revert `packageManager`/lockfile through a reviewed change and deactivate the prepared version |
| uv | 0.11.21 from the official `astral-sh/uv` release | Install/manage the official Specify CLI in an isolated tool environment | MIT OR Apache-2.0 | Official immutable GitHub release with release attestations; active project, release identified 2026-06-11 | Direct release review only; platform archive checksum and attestation must pass before execution | Remove only the isolated managed tool environment after retaining its inventory; restore the captured Specify executable path |
| GitHub Spec Kit | tag `v0.12.9`, commit `80ac47e`, repository `github/spec-kit` | Replace the development Specify build with the GOV-01-selected official baseline and regenerate supported integration files | MIT | Official immutable Git tag/release selected by GOV-01 | Source tag and commit are exact; dependency graph and advisories must be recorded by uv before activation | Restore the captured 0.12.10.dev0 executable/integration inventory if compatibility checks fail; do not delete feature-authored files |
| turbo | 2.10.4 from npm public registry | Workspace task graph and affected-task orchestration | MIT | Official Vercel Turborepo package with npm provenance; actively maintained/current when reviewed | Direct metadata/release review only; lockfile audit pending | Remove root Turbo configuration/scripts and regenerate the reviewed lockfile |
| typescript | 5.9.3 from npm public registry | Stable TypeScript compiler compatible with the planned ecosystem | Apache-2.0 | Official Microsoft package; deliberately held below the newer TypeScript 7 major pending ecosystem compatibility evidence | Direct package review only; lockfile audit pending | Remove compiler scripts/configuration and regenerate the reviewed lockfile |
| tsx | 4.23.0 from npm public registry | Execute repository-owned TypeScript maintenance scripts without a custom loader | MIT | Official `privatenumber/tsx` package; actively maintained/current when reviewed | Direct package review only; lockfile audit pending | Convert the small maintenance scripts to compiled JavaScript or Node-native TypeScript support, then remove and regenerate lockfile |
| eslint | 10.6.0 from npm public registry | JavaScript/TypeScript lint entry point | MIT | Official OpenJS/ESLint package; current supported major, Node 24 compatible | Direct package review only; lockfile audit pending | Remove lint configuration/scripts and regenerate lockfile; tests/type checks remain mandatory |
| `@eslint/js` | 10.0.1 from npm public registry | Official flat-config recommended JavaScript rules | MIT | Official ESLint organization package; maintained with ESLint | Direct package review only; lockfile audit pending | Replace with explicit reviewed rules or remove with ESLint, then regenerate lockfile |
| `typescript-eslint` | 8.62.1 from npm public registry | Type-aware TypeScript lint parser/plugin/config | MIT | Official typescript-eslint package; active maintained release when reviewed | Compatibility with TypeScript 5.9 and ESLint 10 must pass in T024; lockfile audit pending | Remove TypeScript lint integration and regenerate lockfile; compiler checks remain mandatory |
| prettier | 3.9.4 from npm public registry | Deterministic formatting check | MIT | Official Prettier package; current maintained release when reviewed | Zero direct dependencies reported by the registry; lockfile audit still required | Remove formatter/config and regenerate lockfile without weakening other checks |
| `@types/node` | 24.13.2 from npm public registry | Node 24 compile-time types | MIT | Official DefinitelyTyped Node 24 line | Type-only direct package review; lockfile audit pending | Remove with Node TypeScript sources or replace with a reviewed compatible Node 24 definition pin |

## Explicitly deferred dependencies

The following planned groups are not approved by this checkpoint proposal and
must receive a later exact HCP-01 amendment before addition:

- Next.js, React, Fastify, TypeBox, Postgres, Supabase, Valkey, Pino, and
  OpenTelemetry runtime packages;
- Vitest, Playwright, axe, pgTAP, Testcontainers, performance, mutation,
  contract, and browser tooling;
- Supabase CLI, database clients, SAST, secret, dependency, license, container,
  SBOM, and infrastructure scanners;
- any package or transitive override not present in the approved lockfile;
- any lifecycle/build script not explicitly reviewed after lockfile resolution.

## Exact commands and network targets

T024 may use only the following operations after HCP-01 approval and separate
implementation authorization. Commands are represented as argument arrays; no
shell-pipe installer or dynamically evaluated command is approved.

1. Verify the Node 24.18.0 archive against the official signed
   `SHASUMS256.txt` before using it, if a host installation is required.
2. Download the uv 0.11.21 platform archive from the immutable official release,
   verify its published SHA-256 and GitHub attestation, then place it in a
   repository-external user tool directory.
3. Run `uv tool install specify-cli --from
   git+https://github.com/github/spec-kit.git@v0.12.9` with the exact tag and
   verify `specify version` reports 0.12.9.
4. Run `corepack prepare pnpm@11.11.0 --activate` and verify `pnpm --version`
   reports exactly 11.11.0.
5. Create the reviewed root manifests, then run `pnpm install --ignore-scripts`
   once to resolve `pnpm-lock.yaml`.
6. Run `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm audit
   --audit-level high`, the license inventory, provenance/integrity validation,
   and the complete compatibility/verification suite.

Permitted network origins are limited to `nodejs.org`,
`registry.npmjs.org`, `github.com/astral-sh/uv`,
`github.com/github/spec-kit`, and the immutable artifact hosts directly resolved
from those official release records. Repository files, source code, secrets, and
raw environment values must not be uploaded.

## Vulnerability, license, and provenance baseline

**Current result**: `incomplete_pre_lockfile`; this is visible approval risk, not
a passing security result.

- Direct versions, licenses, official repositories, maintenance status, and
  available provenance/attestation mechanisms were reviewed on 2026-07-10.
- A complete transitive vulnerability/license graph cannot exist until the first
  exact lockfile is resolved. HCP-01 approval must therefore be conditional on
  lifecycle scripts remaining disabled and on an immediate audit before any
  package is used for product implementation.
- Any high or critical advisory, disallowed license, missing integrity, unknown
  package origin, unexpected lifecycle script, unsupported engine, or
  TypeScript/ESLint incompatibility stops T024. The generated lockfile and audit
  output remain as failure evidence; no downstream task is marked complete.
- Medium/low advisories require an attributable disposition, owner, expiry, and
  compensating control before evidence can report pass.

## Expected impact

- Downloads executable/package artifacts from the listed public origins.
- Replaces the development Specify CLI with an isolated official pin while
  retaining a rollback inventory.
- Creates root Node workspace manifests and `pnpm-lock.yaml`.
- May create generated cache and `node_modules` directories that remain ignored
  and are not completion evidence.
- Does not create public contracts, persistence schemas, containers,
  infrastructure, deployments, or remote repository/CI state.

## Recovery and invalidation

Before changing tools, T024 must capture executable paths, versions, manifest
hashes, integration-file hashes, and the documented worktree state. On any failed
check, stop use of the new toolchain, retain sanitized failure evidence, restore
the prior Specify/integration inventory, and revert controlled manifests through
a normal reviewed change. No history rewrite, force operation, or unapproved
deletion is permitted.

Approval is invalidated by any version, source, integrity, license, command,
network origin, lifecycle-script policy, package list, or lockfile-scope change.

## Decision record

- Decision: `approved_with_conditions`
- Approver: user in the Codex task.
- Decision timestamp: `2026-07-11T19:07:53-07:00`
- Approved inventory: the bootstrap-only inventory in this record and T024
  implementation kickoff.
- Conditions: the user accepts the `incomplete_pre_lockfile` baseline;
  lifecycle scripts must remain disabled; network access is limited to the
  origins listed in this record; any high/critical advisory, provenance/license
  failure, unsupported engine, or compatibility failure stops T024.
- Expiry: none stated; the invalidation conditions in this record apply.
- Rationale: proceed with the smallest governed toolchain required to establish
  the official Spec Kit and deterministic workspace baseline.
- Resulting lockfile SHA-256:
  `313a2bfd6ccf56afa5c1e6af00189d22feaae603734dd8987a8b4289033ab8f2`.
- Vulnerability/license/provenance evidence:
  `evidence/dependencies/t024-bootstrap.json` (`blocked`, not completion
  evidence, until the uv advisory check passes).

## T024 pre-install gate result

**Result**: `blocked_before_download`; no dependency, tool, package manifest, or
lockfile was added or changed.

Read-only preflight on 2026-07-11 found two required network paths outside the
approved origin allowlist:

1. The approved `uv tool install ...` command resolves transitive Python
   dependencies from its default index at `https://pypi.org/simple` and package
   artifacts from `https://files.pythonhosted.org`. Neither origin is listed in
   the approved scope, and no complete offline uv cache is present.
2. The required Node.js release-signature verification uses the official
   `https://github.com/nodejs/release-keys` keyring. No active Node release keys
   are present in the local GPG keyring, and that repository is not listed in the
   approved scope.

The host currently provides Node.js 22.23.0, Corepack 0.34.6, and the preserved
Specify CLI 0.12.10.dev0. `uv` and GitHub CLI are not installed. The legacy root
verification suite still passes before T024.

T024 remains blocked until an attributable HCP-01 amendment adds exactly:

- `https://pypi.org/simple` for Python dependency metadata;
- `https://files.pythonhosted.org` for hash-verified Python package artifacts;
- `https://github.com/nodejs/release-keys` for the official Node signing keyring.

The amendment must retain all existing conditions, forbid repository-content
upload, and authorize only read/download operations needed for the approved pins.

### Network-origin amendment

- Decision: `approved_with_conditions`.
- Approver: user in the Codex task.
- Decision timestamp: `2026-07-11T19:09:49-07:00`.
- Added read/download origins for T024 only:
  - `https://pypi.org/simple`;
  - `https://files.pythonhosted.org`;
  - `https://github.com/nodejs/release-keys`.
- Existing conditions retained: lifecycle scripts disabled, exact approved pins
  only, immediate vulnerability/license/provenance checks, and fail-closed on
  high/critical advisories or compatibility failure.
- Repository-content upload remains prohibited.
- No later task, dependency, tool, or network origin is authorized by this
  amendment.

### Attestation-verifier gate

**Result**: `blocked_before_download`; no approved package/tool mutation has
occurred.

The uv inventory requires GitHub artifact-attestation verification. The host has
no `gh`, `cosign`, `slsa-verifier`, or `gitsign` executable. Adding one without
review would violate HCP-01, while replacing attestation with checksum-only
verification would silently weaken the approved provenance condition.

The smallest proposed amendment is:

| Dependency/tool | Exact version/source | Purpose | License | Validation and recovery |
|---|---|---|---|---|
| GitHub CLI | 2.96.0, immutable release `github.com/cli/cli/releases/tag/v2.96.0`, commit `b300f2e` | Run only `gh attestation verify` for the approved uv 0.11.21 artifact | MIT | Verify the official release checksum before execution; do not authenticate or read tokens; keep outside the repository; remove from the isolated tool directory after retaining sanitized verification evidence |

Required read/download origins for that command are
`https://github.com/cli/cli`, `https://api.github.com`, and
`https://tuf-repo-cdn.sigstore.dev`, plus immutable GitHub release-asset hosts.
Repository-content upload remains prohibited. If unauthenticated public
attestation lookup fails, T024 must stop; secret or credential access is not
authorized.

#### Attestation-verifier amendment decision

- Decision: `approved_with_conditions`.
- Approver: user in the Codex task.
- Decision timestamp: `2026-07-11T19:15:12-07:00`.
- Approved tool: GitHub CLI 2.96.0 from the exact immutable release above, used
  only for unauthenticated uv artifact-attestation verification.
- Approved origins: `https://github.com/cli/cli`,
  `https://api.github.com`, `https://tuf-repo-cdn.sigstore.dev`, and immutable
  release-asset hosts.
- Existing conditions retained, including disabled lifecycle scripts, exact
  approved pins, no secret access, and no repository-content upload.
- No other GitHub CLI command, login, credential, dependency, or task is
  authorized.

## T024 execution result

**Recorded**: 2026-07-11T19:37:56-07:00  
**Result**: `pass`; T024 is complete. No later task is authorized by this
result.

The exact approved toolchain was installed outside the repository and the root
workspace was resolved with lifecycle scripts disabled. The following gates
pass:

- Node.js 24.18.0 archive checksum and official release signature;
- uv 0.11.21 archive checksum and GitHub artifact attestation;
- official Spec Kit 0.12.9 at commit
  `80ac47e2576750036409f132a3639c9becae64aa`, with its 15-package installed
  graph compatible under Python 3.12.3;
- pnpm 11.11.0 frozen/offline reinstall, 127 lockfile package records with no
  missing integrity field, and an untouched content-addressed store;
- pnpm audit with zero info, low, moderate, high, or critical advisories;
- Node and Python license inventories, TypeScript 5.9/ESLint 10
  compatibility, formatting, lint, type checking, and agent-context updater
  check/dry-run/update/idempotence/unsupported-agent behavior.

The installed Spec Kit graph required the uv-native advisory check mandated by
this checkpoint. `uv audit` uses the OSV API at `https://api.osv.dev/`; no
request was sent until the attributable amendment below was recorded.

### OSV advisory-service amendment decision

- Decision: `approved_with_conditions`.
- Approver: user in the Codex task.
- Decision timestamp: `2026-07-11T19:34:52-07:00`.
- Approved operation: unauthenticated advisory-query POST requests to
  `https://api.osv.dev/` for the repository-external Spec Kit 0.12.9 audit
  lock only.
- Existing conditions retained: lifecycle scripts remain disabled; secret
  access and repository-content upload are prohibited.
- No dependency addition, later task, authentication, or other network origin
  is authorized by this amendment.

### Final validation

- The exact repository-external audit lock SHA-256 remained
  `36ce15048ed3cef1060fdf8788bd5d2e7c8ec918951e03e6a32df8486d8d5074`.
- uv audited 16 packages and reported zero vulnerabilities and zero adverse
  statuses; sanitized JSON output SHA-256 is
  `b773dcf78cac9b184d04d285600d075d7d1163013b42cfaaab12c42a8d4bc39d`.
- The pnpm lockfile remained
  `313a2bfd6ccf56afa5c1e6af00189d22feaae603734dd8987a8b4289033ab8f2`;
  frozen/offline installation, store integrity, audit, and license inventory
  passed with lifecycle scripts disabled.
- Formatting, ESLint, TypeScript, authority verification, the ten-test legacy
  suite, eight-link legacy traceability, agent-context drift, and `git diff
  --check` all passed.
- No secret access, repository-content upload, production action, external
  publication, dependency addition beyond the approved inventory, or later task
  occurred.

## T025 dependency-free importer amendment

**Status**: `approved_with_conditions`; implementation and verification passed.

The user subsequently authorized ordinary T025 implementation by replying
“proceed” after T025 was identified as the next task. That instruction does not
waive HCP-01's exact-approval rule for lockfile-scope changes. The non-protected
portion now contains exactly these private, dependency-free workspace manifests:

- `apps/api`, `apps/web`, and `apps/workers`;
- `packages/audit`, `packages/config`, `packages/core`, `packages/events`,
  `packages/identity`, `packages/observability`, `packages/policy`,
  `packages/testing`, and `packages/ui`.

Each manifest pins Node 24.18.0 and pnpm 11.11.0, uses the
`@ai-trading-os/<name>` namespace, is private and unlicensed for publication,
and declares no dependency, script, export, binary, or source entry. A
repository-owned structural verifier passes with 12 workspaces and zero
dependencies.

The only required protected diff is twelve empty importer mappings under
`importers` in `pnpm-lock.yaml`; no `packages`, `snapshots`, version, source, or
integrity record changes. A supposedly frozen/offline pnpm validation command
unexpectedly materialized those mappings, producing prospective lockfile
SHA-256 `05e9792ddae6935812b1aa527f70396186a4485a9bd44aa38091cd63149ca0a7`.
Because that mutation lacked an exact amendment, it was immediately removed
with a reviewed patch. The approved T024 lockfile SHA-256 is restored as
`313a2bfd6ccf56afa5c1e6af00189d22feaae603734dd8987a8b4289033ab8f2`.

### Requested T025 amendment

Approve adding exactly the twelve empty importer mappings above, and no package
or resolution records, using repository-external pnpm 11.11.0 with
`--lockfile-only --offline --ignore-scripts`, followed by frozen/offline
verification. The amendment adds no dependency, tool, network origin, lifecycle
script, public contract, schema, infrastructure, policy, or later-task authority.
It retains the existing prohibitions on secret access and repository-content
upload. Any diff beyond those twelve empty importers invalidates the amendment
and must be restored without continuing.

### T025 importer-amendment decision

- Decision: `approved_with_conditions`.
- Approver: user in the Codex task.
- Decision timestamp: `2026-07-11T20:27:55-07:00`.
- Approved diff: exactly twelve dependency-free empty workspace importer mappings
  in `pnpm-lock.yaml`, with no package or resolution changes.
- Approved commands: pnpm 11.11.0 with `--lockfile-only --offline
  --ignore-scripts`, followed by frozen/offline verification.
- Existing conditions retained: no dependency addition, secret access,
  repository-content upload, lifecycle script, new network origin, or later-task
  authority.
- Any lockfile result other than the exact reviewed importer-only diff invalidates
  this amendment and requires restoration before continuing.

### T025 final validation

- The approved command produced exactly 13 importers: the root plus the twelve
  empty T025 mappings. Final lockfile SHA-256 is
  `05e9792ddae6935812b1aa527f70396186a4485a9bd44aa38091cd63149ca0a7`.
- The package and snapshot sections are byte-identical to the T024 lockfile; no
  dependency, version, source, resolution, or integrity record changed.
- Frozen/offline verification left the approved lockfile unchanged. Workspace
  enumeration found the exact 13 projects, the boundary verifier found 12
  dependency-free manifests, pnpm audit reported zero findings, and the store
  remained untouched.
- Formatting, ESLint, TypeScript, authority verification, the ten-test legacy
  suite, eight-link legacy traceability, and `git diff --check` passed.
- Visible warning: during the lockfile-only command, pnpm issued
  `registry.npmjs.org` metadata GETs for its supply-chain policy check despite
  the `--offline` flag. That origin was already approved under HCP-01, no
  repository content was uploaded, and no request was observed during the
  subsequent frozen verification. The warning is retained in
  `evidence/baseline/t025-package-boundaries.json`.
- No dependency addition, secret access, repository-content upload, production
  action, external publication, or later task occurred.

## T030 supported-runtime verification amendment

**Status**: `approved_with_conditions`  
**Decision timestamp**: 2026-07-13T02:13:43-07:00  
**Approver**: 7 Finger Studios  
**Task boundary**: T030 verification only

The user approved reinstalling repository-external Node.js 24.18.0 solely to
rerun the T030 aggregate verifier on the supported runtime. The approved
artifacts are `node-v24.18.0-linux-x64.tar.xz`, `SHASUMS256.txt`, and
`SHASUMS256.txt.sig` from `https://nodejs.org/dist/v24.18.0/`, verified with
the official keys from `https://github.com/nodejs/release-keys`.

Conditions:

- install only under `/tmp/codex-hitl-t030-node-v24.18.0`, outside the
  repository;
- use an isolated GnuPG home, verify the signed checksum manifest, verify the
  archive checksum, and confirm the extracted executable reports `v24.18.0`;
- perform unauthenticated read/download requests only to the two approved
  origins and do not transmit repository content;
- add or change no repository dependency, lockfile, lifecycle script, source
  contract, persistence schema, infrastructure, policy semantics, or secret;
- use the runtime only for T030 verification; this amendment grants no
  later-task authorization.

**Approval statement**: "Approve the HCP-01 T030 verification amendment to
reinstall repository-external Node.js 24.18.0 for T030 only, downloading
node-v24.18.0-linux-x64.tar.xz, SHASUMS256.txt, and SHASUMS256.txt.sig from
https://nodejs.org/dist/v24.18.0/, using official release keys from
https://github.com/nodejs/release-keys, and verifying its checksum and
signature. No repository dependency or lockfile change, lifecycle scripts,
secret access, repository-content upload, or later-task authorization"

### T030 supported-runtime verification result

**Recorded**: 2026-07-13T02:17:26-07:00  
**Result**: `pass`; this result supports T030 only.

- The signed checksum manifest reported archive SHA-256
  `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`.
- GnuPG reported a good signature by Node.js releaser Richard Lau with primary
  fingerprint `C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C`; the official
  release-keys checkout was commit `b28073028e6d6855cfb53bf7fa0137599c01f967`.
- The extracted binary reported `v24.18.0` and retained the previously verified
  binary SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`.
- The aggregate verifier passed under Node.js 24.18.0 and pnpm 11.11.0 with
  lifecycle scripts disabled and network disabled during verification.
- The lockfile remained
  `05e9792ddae6935812b1aa527f70396186a4485a9bd44aa38091cd63149ca0a7`.
- No repository dependency or lockfile change, secret access,
  repository-content upload, authenticated request, external publication, or
  later-task execution occurred.

## T035 supported-runtime verification amendment request

**Status**: `approved_with_conditions`  
**Prepared**: 2026-07-13T03:11:32-07:00  
**Task boundary**: T035 verification only

T035 is materialized and passes its contract, generation-drift, lint, and strict
TypeScript checks on the host's unsupported Node.js 22.23.0. Completion requires
the repository baseline Node.js 24.18.0. A checksum/signature-verified binary is
already present outside the repository at
`/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`; it reports
`v24.18.0` and has SHA-256
`41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`.
Its current approval is explicitly T030-only, so it has not been reused.

The requested amendment permits using that existing binary, without download,
installation, extraction, or network access, for these T035-only checks:

1. confirm the exact binary version and SHA-256 above;
2. run `node --import tsx` for the contract test and generator `--check`;
3. run the existing Prettier 3.9.4, ESLint 10.6.0, and TypeScript 5.9.3 entry
   points from `node_modules` for the T034/T035 files and package projects;
4. run the repository-owned contract audit, authority verifier, root verifier,
   generated-drift check, and `git diff --check` with no network; and
5. record the exact supported-runtime outputs and hashes in T035 evidence.

No repository dependency, package manifest inventory, or lockfile change is
requested. Lifecycle scripts remain disabled. The amendment prohibits network
access, secret access, repository-content upload, authentication, external
publication, persistence/infrastructure/policy changes, production action, and
later-task authorization. Any binary path, version, hash, command purpose, or
scope change invalidates the amendment.

### Requested approval language

"Approve the HCP-01 T035 verification amendment to use the existing verified
repository-external Node.js 24.18.0 binary at
`/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`, SHA-256
`41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`, for
T035 contract test, generation-drift, formatting, lint, strict TypeScript, and
repository verification only, with no download, installation, network access,
dependency or lockfile change, lifecycle script, secret access, repository-
content upload, external publication, protected later-task action, or production
action."

### T035 verification amendment decision

- **Decision**: `approved_with_conditions`.
- **Approver**: User in Codex task.
- **Decision timestamp**: `2026-07-13T03:23:16-07:00`.
- **Approval statement**: "Approve the HCP-01 T035 verification amendment
  exactly as recorded in HCP-01-dependencies.md."
- **Authorized scope**: The existing verified repository-external Node.js
  24.18.0 binary, exact path and SHA-256 above, may be used only for the five
  numbered T035 verification activities in this amendment.
- **Conditions retained**: No download, installation, extraction, network
  access, dependency or lockfile change, lifecycle script, secret access,
  repository-content upload, authentication, external publication,
  persistence/infrastructure/policy change, production action, or later-task
  authorization. Any path, version, hash, command purpose, or scope change
  invalidates this amendment.

### T035 verification amendment result

**Recorded**: 2026-07-13T03:29:44-07:00  
**Result**: `pass`; T035 is complete. No later protected task is authorized by
this result.

- The existing binary reported `v24.18.0` and SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`.
- The contract suite passed 7 of 7; generation drift, formatting of every
  T034/T035-created or changed file, ESLint, and both strict TypeScript package
  projects passed under Node.js 24.18.0.
- The approved, byte-preserved `domain-event.schema.json` produced its existing
  two-array Prettier style warning. Its HCP-02-bound hash remained
  `219754d7e785d5dbf861e16f1fe8c6751c8f6c25bd4a1eff8fb1b5600a192812`;
  changing it would invalidate HCP-02, so the warning is retained rather than
  silently altering the approved contract.
- The canonical audit passed with 48 unique operations, 612 resolved internal
  references, no duplicate JSON keys, exact path parameters, and correlation
  headers on every response. The earlier 614 count included two references in
  the excluded historical event sketch and is corrected in final evidence.
- Authority, root verifier, generated drift, tracked and new-file whitespace,
  directory-instruction, and ignore-rule checks passed. The T025-only workspace
  boundary check still rejects the T035-approved `exports` and `scripts`; it was
  not changed because this amendment prohibits policy changes and its output is
  retained in T035 evidence as a non-applicable supplemental observation.
- The lockfile remained
  `05e9792ddae6935812b1aa527f70396186a4485a9bd44aa38091cd63149ca0a7`.
- No download, installation, network access, dependency or lockfile change,
  lifecycle script, secret access, repository-content upload, authentication,
  external publication, persistence/infrastructure/policy change, production
  action, or later protected task execution occurred.

## T047-T050 supported-runtime verification amendment proposal

**Status**: `approved_with_conditions`; clean verification complete under the
exact restoration amendment  
**Prepared**: 2026-07-13  
**Tasks**: T047-T050 verification only

### Reason for amendment

T047-T050 implementation and deterministic tests are present, but the existing
repository-external Node.js 24.18.0 binary was approved for T035 verification
only. Successful T047-T050 executions made with that binary are retained as
diagnostic results but cannot support completion. Their task boxes and evidence
completion claims remain open until this exact amendment is approved and every
listed verification is rerun cleanly.

### Exact binary and allowed use

- Binary:
  `/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`
- Version: `v24.18.0`
- SHA-256:
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`
- Source and integrity: unchanged from the approved T030 reinstall and T035
  verification amendments; no download, extraction, installation, or network
  access is requested.

The binary may be used only to:

1. Report `--version` after its SHA-256 is rechecked.
2. Run `node --import tsx --test` for exactly:
   - `packages/core/src/core.test.ts`;
   - `packages/observability/src/observability.test.ts`;
   - `packages/testing/src/cache/cache-isolation.test.ts`; and
   - `tests/integration/database/request-context.test.ts`.
3. Run the existing TypeScript 5.9.3 compiler with strict repository options for
   the T047-T050 source/test files and the existing `packages/core/tsconfig.json`
   and `packages/testing/tsconfig.json` projects.
4. Run the existing ESLint 10.6.0 configuration and Prettier 3.9.4 check against
   only the T047-T050 source/test files.
5. Rerun `./scripts/verify-authority.sh`, `./scripts/verify.sh`, JSON evidence
   parsing, whitespace checks, and `.specify/extensions.yml` post-execution
   discovery. These repository scripts use their existing interpreters and do
   not authorize an additional tool or network action.
6. Update only T047-T050 evidence and task checkboxes if every listed check
   passes and the source hashes still match the evidence inventory.

### Retained conditions and exclusions

- Lifecycle scripts remain disabled.
- No dependency, package manifest, package importer, lockfile, public contract,
  persistence schema/grant, infrastructure, engineering policy, or production
  state may change under this amendment.
- No secret or raw environment access, authentication, repository-content
  upload, remote CI, push/PR, external publication, database/cache/collector
  connection, container command, or network request is authorized.
- This amendment does not authorize Fastify or any other deferred dependency,
  T051 implementation, or any later-task action.
- Any binary path, version, hash, command purpose, file set, dependency state, or
  condition change invalidates the amendment and requires a new exact decision.

### Exact approval statement

> Approve the HCP-01 T047-T050 supported-runtime verification amendment exactly
> as recorded in HCP-01-dependencies.md. Retain disabled lifecycle scripts and
> all stated exclusions; this does not authorize Fastify, dependency or lockfile
> changes, secret access, repository-content upload, network access, or T051 and
> later tasks.

### Decision record

- **Decision**: `approved_with_conditions`
- **Approver**: User in Codex task
- **Decision time**: 2026-07-13T11:12:05-07:00
- **Approval statement**: "Approve the HCP-01 T047-T050 supported-runtime
  verification amendment exactly as recorded in HCP-01-dependencies.md. Retain
  disabled lifecycle scripts and all stated exclusions; this does not authorize
  Fastify, dependency or lockfile changes, secret access, repository-content
  upload, network access, or T051 and later tasks."
- **Conditions retained**: Exact binary path, version, hash, commands, file set,
  disabled lifecycle scripts, and every exclusion in this amendment.
- **Pre-execution result**: `blocked_before_binary_use`. The required integrity
  check at 2026-07-13T11:12:05-07:00 found that the exact approved binary path no
  longer exists. No alternate Node binary, download, extraction, installation,
  network request, test, static check, dependency change, or later task was used.
  Because binary path and integrity are exact approval conditions, verification
  remained incomplete and T047-T050 remained open at that time.
- **Resolution**: The separately approved exact restoration amendment recreated
  and verified the same path and binary. A new clean execution completed at
  2026-07-13T11:25:59-07:00; the earlier approval-invalid diagnostic is retained
  but is not completion evidence.

## T047-T050 exact binary restoration amendment proposal

**Status**: `approved_with_conditions`; restoration and T047-T050 verification
complete  
**Prepared**: 2026-07-13  
**Tasks**: Restore the approved runtime and execute only the already approved
T047-T050 verification scope

### Exact restoration scope

Authorize recreation of the missing repository-external runtime at exactly:

`/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`

using only these immutable inputs:

- `node-v24.18.0-linux-x64.tar.xz`, expected SHA-256
  `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`;
- `SHASUMS256.txt` and `SHASUMS256.txt.sig` from
  `https://nodejs.org/dist/v24.18.0/`; and
- official Node.js release keys from `https://github.com/nodejs/release-keys`
  at exact commit `b28073028e6d6855cfb53bf7fa0137599c01f967`.

The restoration must use an isolated repository-external GnuPG home, verify the
signed checksum manifest, verify the archive checksum, extract only beneath the
exact `/tmp/codex-hitl-t030-node-v24.18.0` directory, confirm version `v24.18.0`,
and confirm binary SHA-256
`41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`.
Any mismatch stops before the binary is used.

After successful restoration, authorize only the T047-T050 commands and file set
already approved in the preceding supported-runtime verification amendment. No
other Node invocation is permitted.

### Network, mutation, and safety limits

- Permit unauthenticated read/download requests only to the two exact HTTPS
  origins above; transmit no repository content, credentials, cookies, tokens,
  headers containing authentication, or environment values.
- Retain disabled lifecycle scripts. Add or change no dependency, package
  manifest, importer, lockfile, public contract, persistence schema/grant,
  infrastructure, engineering policy, or production state.
- Do not access a database, cache, collector, container engine, secret, remote
  repository, CI system, pull request, deployment target, or T051/later task.
- Preserve downloaded/restored files under `/tmp`; this amendment does not
  authorize deletion outside generated build artifacts.
- Any artifact, version, hash, signature, key commit, path, origin, command,
  file-set, or condition change invalidates this proposal.

### Exact approval statement

> Approve the HCP-01 T047-T050 exact binary restoration amendment exactly as
> recorded in HCP-01-dependencies.md. Authorize only unauthenticated downloads of
> the recorded Node.js 24.18.0 archive, signed checksum files, and exact official
> release-key commit from the two recorded HTTPS origins; restore and verify the
> runtime at the exact recorded `/tmp` path, then run only the already approved
> T047-T050 verification commands. Retain the approved bootstrap-only inventory,
> accepted conditional pre-lockfile baseline, disabled lifecycle scripts, exact
> permitted origins, and every stated exclusion; this does not authorize any
> dependency or lockfile change, secret access, repository-content upload,
> database/cache/container access, or T051 and later tasks.

### Decision record

- **Decision**: `approved_with_conditions`
- **Approver**: User in Codex task
- **Decision time**: 2026-07-13T11:21:47-07:00
- **Approval statement**: "Approve the HCP-01 T047-T050 exact binary restoration
  amendment exactly as recorded in HCP-01-dependencies.md. Authorize only
  unauthenticated downloads of the recorded Node.js 24.18.0 archive, signed
  checksum files, and exact official release-key commit from the two recorded
  HTTPS origins; restore and verify the runtime at the exact recorded /tmp path,
  then run only the already approved T047-T050 verification commands. Retain the
  approved bootstrap-only inventory, accepted conditional pre-lockfile baseline,
  disabled lifecycle scripts, exact permitted origins, and every stated
  exclusion; this does not authorize any dependency or lockfile change, secret
  access, repository-content upload, database/cache/container access, or T051 and
  later tasks."
- **Conditions retained**: Exact artifacts, signature/key commit, versions,
  hashes, paths, origins, commands, task/file scope, disabled lifecycle scripts,
  and every exclusion in this amendment.

### Restoration and verification result

- **Completed**: 2026-07-13T11:25:59-07:00
- **Result**: `pass` for this amendment and T047-T050 only.
- The release-key repository resolved to exact commit
  `b28073028e6d6855cfb53bf7fa0137599c01f967`.
- GnuPG validated `SHASUMS256.txt.sig` under primary fingerprint
  `C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C`.
- The signed manifest and downloaded archive both reported SHA-256
  `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`.
- Archive paths passed traversal checks before extraction. The restored exact
  binary reported `v24.18.0` and SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`.
- All 32 targeted tests passed with zero failures/skips: T047 9, T048 8,
  T049 7, and T050 8. The core/testing project and targeted strict TypeScript,
  targeted ESLint, and targeted Prettier checks passed.
- Authority, root traceability, 10 legacy tests, 9 compatibility tests, source
  hashes, evidence JSON, whitespace, and the unchanged approved lockfile hash
  passed.
- No lifecycle script, dependency/package/lockfile, contract, persistence,
  infrastructure, database/cache/collector/container, secret/environment,
  repository-upload, remote CI, production, or T051/later action occurred.
- Evidence: `evidence/dependencies/t047-t050-binary-restoration-and-verification.json`

## Approval language

An approval must explicitly identify HCP-01, this bootstrap-only inventory, the
conditional pre-lockfile baseline, lifecycle scripts disabled, the permitted
network origins, and whether implementation kickoff for T024 is also authorized.

## Superseded T051-T054 dependency and manifest drafting note

**Status**: `superseded` by the exact proposal below; no manifest, lockfile, install,
download, or T051+ implementation has been performed.

This retained drafting note is audit history only and is not an approval request;
the later section marked **Prepared: 2026-07-13** is the sole authoritative
T051-T054 proposal.

**Tasks served**: T051, T052, T053, and the package/tooling portion of T054.
The proposal is limited to the smallest TypeScript-5.9-compatible runtime cohort
required by the approved architecture. T052 uses Node 24 built-ins and the
already materialized core/observability source; T054 uses the approved container
images and their in-image diagnostic clients, so Postgres, Valkey, Supabase,
OpenTelemetry SDK, Vitest, Playwright, pgTAP, Testcontainers, `pg`, `redis`,
Pino, and all other deferred runtime/test packages remain excluded.

### Exact direct package inventory

All direct versions are exact and must be written without ranges, tags, URLs, or
Git references. The registry tarball URL, integrity, SHA-1, official repository,
license, and provenance basis are recorded here; the transitive closure remains
conditional until lockfile-only resolution produces its exact package list.

| Package | Exact version | Tarball and integrity | License | Provenance / compatibility |
|---|---:|---|---|---|
| `fastify` | `5.10.0` | `https://registry.npmjs.org/fastify/-/fastify-5.10.0.tgz`; `sha512-A9L0ziuWGQHgEEVgF3davQ9vbD93IuX+lo2IsxapQmu5b/Y/ynn9m9K5JHt9dvyJXOFc5iN0Zk5GHEOqnzhWjg==` | MIT | Official `fastify/fastify`; registry signature; no attestation advertised; Node 24 compatible. Its Pino/fast-uri closure is conditional and must be audited. |
| `@fastify/type-provider-typebox` | `5.2.0` | `https://registry.npmjs.org/@fastify/type-provider-typebox/-/type-provider-typebox-5.2.0.tgz`; `sha512-RoUFTQNYlaVM/gXosFqlrUAD/JHC+OXLcj4DxNoMOag2GI7OydfCt+3vdT+6D2daJwhGAdkpxB0wLNqS7gf4CQ==`; SHA-1 `d04b7ce431aa217cf085e3aabc3f051c764acc01` | MIT | Official `fastify/fastify-type-provider-typebox`; registry signature; no attestation advertised; peer `@sinclair/typebox >=0.26 <=0.34`, compatible with the exact TypeBox pin and Fastify 5. |
| `@sinclair/typebox` | `0.34.49` | `https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.34.49.tgz`; `sha512-brySQQs7Jtn0joV8Xh9ZV/hZb9Ozb0pmazDIASBkYKCjXrXU3mpcFahmK/z4YDhGkQvP9mWJbVyahdtU5wQA+A==`; SHA-1 `4f1369234f2ecf693866476c3b2e1b54d2a9d68e` | MIT | Official `sinclairzx81/sinclair-typebox`; registry signature and npm SLSA attestation; TypeBox 0.x LTS supports the repository's TypeScript 5.9.3. TypeBox 1.x and provider 6.x are explicitly excluded because they require the TypeScript 6–7 generation. |
| `next` | `16.2.10` | `https://registry.npmjs.org/next/-/next-16.2.10.tgz`; `sha512-2som5AVXb3kE6Yjine3/mNbBayYF58eguBWIVVUdr1y/L426xyVEgYxgBG+1QC34P2x5E+tcDup6XkuOAX3dCA==` | MIT | Official `vercel/next.js`; registry signature and npm SLSA attestation; engine `>=20.9.0`; selected version is above the published 16.2.x security fixes. `@next/swc-*` and optional `sharp` remain conditional closure entries with scripts disabled. |
| `react` | `19.2.7` | `https://registry.npmjs.org/react/-/react-19.2.7.tgz`; `sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==` | MIT | Official `facebook/react`; registry signature and npm SLSA attestation; paired with the exact React DOM pin. |
| `react-dom` | `19.2.7` | `https://registry.npmjs.org/react-dom/-/react-dom-19.2.7.tgz`; `sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==` | MIT | Official `facebook/react`; registry signature and npm SLSA attestation; peer React `^19.2.7` is satisfied exactly. |
| `@types/react` | `19.2.17` | `https://registry.npmjs.org/@types/react/-/react-19.2.17.tgz`; `sha512-MXfmqaVPEVgkBT/aY0aGCkRWWtByiYQXo3xdQ8r5RzuFrPiRn8Gar2tQdXSUQ2GKV3bkXckek89V8wQBY2Q/Aw==` | MIT | Official DefinitelyTyped `types/react`; registry signature and npm SLSA attestation; TypeScript `>=5.3`. |
| `@types/react-dom` | `19.2.3` | `https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz`; `sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==` | MIT | Official DefinitelyTyped `types/react-dom`; registry signature and npm SLSA attestation; peer `@types/react` and TypeScript 5.2+ are satisfied. |

The direct package inventory has no known deprecation. The accepted baseline is
still `incomplete_pre_lockfile`: the existing zero-advisory bootstrap result
does not cover these eight pins or their transitive closure. Lock resolution must
record every transitive name, exact version, registry source, integrity, license,
engine/peer result, lifecycle/build flag, and advisory result. Any high/critical
advisory, unknown or disallowed license, missing integrity/provenance, unsupported
engine/peer, non-registry source, or required build script is a hard stop; a
medium/low advisory requires an owner, expiry, and compensating control.

### Exact manifest and lockfile scope

Only these tracked files may change under this amendment:

* `apps/api/package.json`: exact dependencies `fastify: 5.10.0`,
  `@fastify/type-provider-typebox: 5.2.0`, and `@sinclair/typebox: 0.34.49`;
  scripts `dev: node --import tsx src/app.ts`, `test: node --import tsx --test
  src/app.test.ts`, and `typecheck: tsc --noEmit --project tsconfig.json`.
* `apps/web/package.json`: exact dependencies `next: 16.2.10`, `react: 19.2.7`,
  `react-dom: 19.2.7`; exact devDependencies `@types/react: 19.2.17` and
  `@types/react-dom: 19.2.3`; scripts `dev: next dev --hostname 0.0.0.0
  --port 3000`, `build: next build`, `start: next start --hostname 0.0.0.0
  --port 3000`, `test: node --import tsx --test
  src/components/platform-shell.test.tsx`, and `typecheck: tsc --noEmit
  --project tsconfig.json`.
* `apps/workers/package.json`: no dependency additions; scripts `dev: node
  --import tsx src/main.ts`, `test: node --import tsx --test
  src/worker.test.ts`, and `typecheck: tsc --noEmit --project tsconfig.json`.
* `tooling/typescript/verify-workspace-boundaries.mjs`: replace the stale
  T025-era blanket prohibition with an exact allowlist for the above manifest
  keys and values, while retaining workspace identity, private/license/type,
  engine, description, unknown-key, and unlisted-package rejection. No other
  workspace may gain dependencies, exports, or scripts.
* `pnpm-lock.yaml`: only the `apps/api` and `apps/web` importer blocks, the
  additive package/snapshot records reachable from the eight exact pins, and
  normalization of `settings.autoInstallPeers` from the stale `true` value to
  `false` (matching `.npmrc`) may change. Root and all other importers and all
  pre-existing package records must remain byte-identical.

No root dependency, `.npmrc` policy, workspace declaration, public contract,
database migration, seed, container definition, secret name/value, or package
outside this closure is in scope.

### Network, integrity, lifecycle, commands, and rollback

The exact approved origins for a later execution are `https://registry.npmjs.org`
and `https://api.osv.dev` only. Permitted requests are unauthenticated HTTPS
metadata GETs for the eight package packuments and resolver-required closure,
GETs for the exact lockfile tarball URLs and registry/SLSA attestation endpoints
for those exact records, and one advisory query containing package names and
versions only. No GitHub/source archive, authenticated request, repository file,
secret, proxy credential, telemetry, or upload is permitted. A registry audit
POST, if used by pnpm 11.11.0, may contain only the resolved package coordinate
graph; it must not contain paths, source text, environment values, or repository
content.

The prepared runtime and package manager are the already verified Node binary
`/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node` (SHA-256
`41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`) and pnpm
11.11.0 CJS `/home/ricebran/.cache/codex-hitl-t024/corepack/v1/pnpm/11.11.0/bin/pnpm.cjs`
(SHA-256 `67b035e322203961795e8e34ca63a08c37a4386eda94107fb3d28f3246d882ad`),
using store `/mnt/c/Users/brand/.pnpm-store/v11`. All invocations use argv,
`shell:false`, `--ignore-scripts`, `--strict-peer-dependencies`,
`--config.auto-install-peers=false`, `--config.registry=https://registry.npmjs.org/`,
and no inherited secret/proxy environment. `.npmrc` `ignore-scripts=true` and
workspace `onlyBuiltDependencies: []` remain unchanged; no preinstall, install,
postinstall, prepare, or native build script may run. Every Next command sets
`NEXT_TELEMETRY_DISABLED=1`; no image optimization or remote font/provider is
permitted.

The exact command sequence, after approval and only after the manifest patch, is:

1. Hash/version-gate the two prepared executables and the three current app
   manifests plus lockfile; record the pre-change hashes.
2. Run the Node/pnpm `install --lockfile-only --ignore-scripts --store-dir=/mnt/c/Users/brand/.pnpm-store/v11 --config.auto-install-peers=false --config.strict-peer-dependencies=true --config.registry=https://registry.npmjs.org/` command, inspect the exact diff, and stop on any scope deviation.
3. Validate lockfile integrity/origins/engines/peers, run `audit --audit-level=high --json`, `licenses list --long --json`, `ignored-builds`, and `store status`, and retain sanitized evidence.
4. Only if those gates pass, run the same pnpm executable with
   `install --frozen-lockfile --ignore-scripts` and then a frozen/offline
   `install --offline --frozen-lockfile --ignore-scripts`; no runtime tests or
   build may run before the audit/license/integrity gates pass.
5. Run only the T051-T053 targeted tests/typechecks and `NEXT_TELEMETRY_DISABLED=1`
   Next build, then the required authority and repository verification commands.

On failure, stop package use, retain sanitized evidence, apply a reviewed inverse
patch to only the three app manifests and lockfile (never `git restore`, reset,
or checkout these documented-dirty untracked files), verify the captured hashes,
and restore the prior frozen/offline graph with lifecycle scripts disabled.
Generated `node_modules`, `.next`, and store entries are cache artifacts and are
not completion evidence. This amendment creates no data/schema rollback and does
not authorize any T051-T054 source implementation.

### Exact approval statement

> Approve the HCP-01 T051-T054 dependency and manifest amendment exactly as
> recorded in HCP-01-dependencies.md: authorize only the eight exact direct
> packages and the exact conditional transitive closure, the listed three app
> manifest changes, the stale workspace-boundary verifier correction, and the
> importer/package/snapshot lockfile scope. Retain Node 24.18.0 and pnpm 11.11.0
> provenance, `ignore-scripts=true`, `onlyBuiltDependencies: []`, strict peers,
> exact integrity/provenance/license/advisory gates, the accepted
> `incomplete_pre_lockfile` baseline, and only the recorded registry/OSV
> requests. This does not authorize TypeBox 1.x, provider 6.x, Postgres/Valkey/
> OpenTelemetry/test packages, any other dependency or lockfile change, secret
> access, repository-content upload, production resources, Docker/Compose,
> database/cache/container access, T051-T054 implementation, or T055 and later.

### Decision record

* **Decision**: `awaiting_decision`.
* **Approver**: pending explicit user decision.
* **Decision time**: pending.
* **Invalidation**: any package/version/source/integrity/license/advisory,
  lifecycle, command, origin, lockfile, manifest, task, or exclusion change.

## T051-T054 dependency and manifest amendment proposal

**Status**: `awaiting_decision`  
**Prepared**: 2026-07-13  
**Tasks served**: T051-T054 only  
**Protected action**: exact application dependency additions, three workspace
manifest changes, the reachable shared-lockfile delta, package download/linking,
and the minimum workspace-boundary verifier correction required to make those
manifest changes checkable

This section is a proposal only. Preparing it did not edit a package manifest or
the lockfile, install or download a package, create `node_modules`, run a package
script, or implement T051 or any later task.

### Exact direct package inventory

All specifiers are exact. TypeScript remains `5.9.3`; the TypeBox 1.x/provider
6.x line is deliberately excluded because TypeBox 1.x targets TypeScript 6-7.
Provider 5.2.0 has no runtime dependency and peers on
`@sinclair/typebox >=0.26 <=0.34`; `0.34.49` is the reviewed TypeScript-5-compatible
LTS selection.

| Importer | Exact package | Purpose | License | Official tarball and integrity | Provenance |
| --- | --- | --- | --- | --- | --- |
| `apps/api` | `fastify@5.10.0` | T051 HTTP/runtime-schema boundary | MIT | `https://registry.npmjs.org/fastify/-/fastify-5.10.0.tgz`; `sha512-A9L0ziuWGQHgEEVgF3davQ9vbD93IuX+lo2IsxapQmu5b/Y/ynn9m9K5JHt9dvyJXOFc5iN0Zk5GHEOqnzhWjg==` | npm registry signature and official `fastify/fastify` repository; no npm attestation advertised |
| `apps/api` | `@fastify/type-provider-typebox@5.2.0` | Bind TypeBox schemas to Fastify route types | MIT | `https://registry.npmjs.org/@fastify/type-provider-typebox/-/type-provider-typebox-5.2.0.tgz`; `sha512-RoUFTQNYlaVM/gXosFqlrUAD/JHC+OXLcj4DxNoMOag2GI7OydfCt+3vdT+6D2daJwhGAdkpxB0wLNqS7gf4CQ==` | npm registry signature, SHA-1 `d04b7ce431aa217cf085e3aabc3f051c764acc01`, and official `fastify/fastify-type-provider-typebox` repository; no npm attestation advertised |
| `apps/api` | `@sinclair/typebox@0.34.49` | TypeScript-5-compatible runtime JSON Schema/type source | MIT | `https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.34.49.tgz`; `sha512-brySQQs7Jtn0joV8Xh9ZV/hZb9Ozb0pmazDIASBkYKCjXrXU3mpcFahmK/z4YDhGkQvP9mWJbVyahdtU5wQA+A==` | npm registry signature, SHA-1 `4f1369234f2ecf693866476c3b2e1b54d2a9d68e`, npm SLSA attestation, and official `sinclairzx81/sinclair-typebox` repository |
| `apps/web` | `next@16.2.10` | T053 Next.js 16 application shell | MIT | `https://registry.npmjs.org/next/-/next-16.2.10.tgz`; `sha512-2som5AVXb3kE6Yjine3/mNbBayYF58eguBWIVVUdr1y/L426xyVEgYxgBG+1QC34P2x5E+tcDup6XkuOAX3dCA==` | npm registry signature, npm SLSA attestation, and official `vercel/next.js` repository |
| `apps/web` | `react@19.2.7` | T053 React runtime | MIT | `https://registry.npmjs.org/react/-/react-19.2.7.tgz`; `sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==` | npm registry signature, npm SLSA attestation, and official `facebook/react` repository |
| `apps/web` | `react-dom@19.2.7` | T053 DOM/server renderer paired exactly with React | MIT | `https://registry.npmjs.org/react-dom/-/react-dom-19.2.7.tgz`; `sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==` | npm registry signature, npm SLSA attestation, and official `facebook/react` repository |
| `apps/web` dev | `@types/react@19.2.17` | TypeScript declarations for React 19 | MIT | `https://registry.npmjs.org/@types/react/-/react-19.2.17.tgz`; `sha512-MXfmqaVPEVgkBT/aY0aGCkRWWtByiYQXo3xdQ8r5RzuFrPiRn8Gar2tQdXSUQ2GKV3bkXckek89V8wQBY2Q/Aw==` | npm registry signature and official `DefinitelyTyped/DefinitelyTyped` repository; no npm attestation advertised |
| `apps/web` dev | `@types/react-dom@19.2.3` | TypeScript declarations for React DOM 19 | MIT | `https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz`; `sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==` | npm registry signature and official `DefinitelyTyped/DefinitelyTyped` repository; no npm attestation advertised |

Compatibility facts recorded at proposal time are: Next 16.2.10 requires Node
`>=20.9.0` and accepts React/React DOM 18.2 or 19; React DOM 19.2.7 requires
React 19.2.7; the two DefinitelyTyped packages support compiler versions older
than the repository's TypeScript 5.9.3. The exact approved Node 24.18.0 binary
satisfies these engine constraints.

### Exact manifest and lockfile scope

Before-change SHA-256 values are:

- `apps/api/package.json`:
  `cc39b59f03f0cea03e5c3da20ddf8968ae23a78f0d6af0edbac127100d57fe0f`;
- `apps/web/package.json`:
  `9f2a3308cfb8ef364a0f682510f7173f905ada7e35929cb23d3c84bf738670d0`;
- `apps/workers/package.json`:
  `9df8b15b6ff4916133fb71e8d6b76cf7963f7880e64e995107185bf0e612ea51`;
- `pnpm-lock.yaml`:
  `05e9792ddae6935812b1aa527f70396186a4485a9bd44aa38091cd63149ca0a7`.

Only these prospective manifest fields are in scope:

1. `apps/api/package.json` receives the three API dependencies above and exact
   scripts `dev: node --import tsx src/app.ts`,
   `test: node --import tsx --test src/app.test.ts`, and
   `typecheck: tsc --noEmit --project tsconfig.json`.
2. `apps/web/package.json` receives `next`, `react`, and `react-dom` under
   dependencies, the two `@types` packages under devDependencies, and exact
   scripts `build: next build`,
   `dev: next dev --hostname 0.0.0.0 --port 3000`,
   `start: next start --hostname 0.0.0.0 --port 3000`,
   `test: node --import tsx --test src/components/platform-shell.test.tsx`, and
   `typecheck: tsc --noEmit --project tsconfig.json`.
3. `apps/workers/package.json` receives no dependency. It receives exact scripts
   `dev: node --import tsx src/main.ts`,
   `test: node --import tsx --test src/worker.test.ts`, and
   `typecheck: tsc --noEmit --project tsconfig.json`.
4. `tooling/typescript/verify-workspace-boundaries.mjs` may replace its obsolete
   T025 blanket prohibition with an exact allowlist for the fields and values in
   items 1-3, while retaining all workspace-directory, name, private, license,
   engine, and description checks. It must reject every unlisted dependency,
   script, export, binary, entry point, or workspace.
5. `pnpm-lock.yaml` may change only the `apps/api` and `apps/web` importers, add
   package/snapshot records reachable exclusively from the eight exact direct
   pins, and normalize `settings.autoInstallPeers` from the stale value `true`
   to `.npmrc`'s required `false`. The root, worker, and all package importers,
   every existing specifier, and every unrelated existing package/snapshot
   record must remain unchanged.

No root manifest, `.npmrc`, `pnpm-workspace.yaml`, internal workspace dependency,
export map, or other package manifest is included. Candidate post-change hashes
must be recorded before any package is used for T051-T054. Because exact
transitive records do not exist before resolution, any record not reachable from
the eight pins is an invalidating deviation, not implicit permission.

### Lifecycle, peer, integrity, and telemetry controls

- Retain `.npmrc` values `ignore-scripts=true`, `auto-install-peers=false`,
  `strict-peer-dependencies=true`, `save-exact=true`, and
  `verify-store-integrity=true`; retain `onlyBuiltDependencies: []`.
- Every pnpm operation repeats `--ignore-scripts`; no `preinstall`, `install`,
  `postinstall`, `prepare`, native build, or other lifecycle script is approved.
- Every tarball must be under `https://registry.npmjs.org/`, have a lockfile
  SHA-512 integrity, match registry metadata, and have an attributable official
  repository and acceptable license. Missing integrity, a Git/file/HTTP source,
  or a required build script is a hard stop.
- Fastify is expected to introduce Pino transitively. That is approval only for
  the exact lockfile-resolved Fastify closure; it does not authorize a direct
  Pino dependency or replacement of the T048 logging boundary.
- Next may resolve platform-specific `@next/swc-*` and optional `sharp` records.
  Their exact versions, platform selectors, licenses, integrities, and build
  flags must be reviewed. No runtime fallback download is allowed. T053 must not
  use image optimization if `sharp` would require an unapproved build.
- Every Next command runs with `NEXT_TELEMETRY_DISABLED=1`. No Next telemetry,
  remote font, analytics, CDN, image, or external-asset request is approved.

### Advisory and license baseline

**Proposal-time result**: `incomplete_pre_lockfile`, retaining the conditional
baseline already accepted for HCP-01. The current approved lockfile audit reports
zero advisories at every severity, but that result excludes all eight new pins
and their transitives. Registry metadata reviewed on 2026-07-13 reports no
deprecation marker for the eight direct versions; that is not a transitive
advisory result.

The selected Next/React versions are newer than the published fixed versions for
the reviewed 2025-2026 React Server Components and Next.js advisories. The new
Fastify closure must resolve `fast-uri >=3.1.1`, which fixes
`GHSA-q3j6-qgpj-74h6`. These observations do not replace the post-resolution
audit.

Immediately after lock-only resolution and before product implementation:

1. inventory every added transitive package, exact version, source, SHA-512,
   license, engine/peer constraint, deprecation, lifecycle/build flag, registry
   signature, and advertised attestation;
2. run the exact registry advisory query below and retain sanitized JSON;
3. stop on any high/critical advisory, unsupported engine/peer, unknown or
   disallowed license, missing integrity/provenance, non-registry source, or
   required lifecycle execution; and
4. require an attributable owner, expiry, compensating control, and explicit
   disposition for every medium/low advisory before a pass can be reported.

No zero-advisory, complete-license, or completion claim may be made until that
candidate-lock evidence exists.

### Exact tools, commands, origins, and requests

Use only:

- Node
  `/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`,
  version `v24.18.0`, SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`;
- pnpm CJS
  `/home/ricebran/.cache/codex-hitl-t024/corepack/v1/pnpm/11.11.0/bin/pnpm.cjs`,
  version `11.11.0`, SHA-256
  `67b035e322203961795e8e34ca63a08c37a4386eda94107fb3d28f3246d882ad`;
- pnpm store `/mnt/c/Users/brand/.pnpm-store/v11`.

Commands are argv arrays with `shell=false`, a minimal allowlisted environment,
no npm token, credential, proxy credential, or inherited secret, and no dynamic
evaluation:

1. Verify both executable hashes and versions, then apply the exact reviewed
   manifest/verifier patch.
2. `[NODE, PNPM, "install", "--lockfile-only", "--ignore-scripts",
   "--store-dir=/mnt/c/Users/brand/.pnpm-store/v11",
   "--config.auto-install-peers=false",
   "--config.strict-peer-dependencies=true",
   "--config.registry=https://registry.npmjs.org/"]`.
3. Inspect the exact lockfile diff and stop on any scope, integrity, source,
   engine, peer, license, advisory, or lifecycle deviation.
4. Repeat item 2 with `--frozen-lockfile` in place of `--lockfile-only` to
   download/link the approved closure, then repeat with both `--offline` and
   `--frozen-lockfile` to prove reproducibility.
5. `[NODE, PNPM, "audit", "--audit-level=high", "--json",
   "--config.registry=https://registry.npmjs.org/"]`, followed by
   `[NODE, PNPM, "licenses", "list", "--long", "--json"]`,
   `[NODE, PNPM, "ignored-builds"]`, and `[NODE, PNPM, "store", "status"]`.
6. Run only the T051-T053 package tests/typechecks, a Next build with
   `NEXT_TELEMETRY_DISABLED=1`, `./scripts/verify-authority.sh`,
   `./scripts/verify.sh`, the exact workspace-boundary verifier, formatting,
   lint/type checks, JSON parsing, hash validation, and `git diff --check`.

The only newly permitted network origin is the already-HCP-01-listed
`https://registry.npmjs.org`. The exact permitted requests are unauthenticated
HTTPS `GET`/`HEAD` requests for:

- the eight named packuments and tarballs in the table;
- registry packuments and exact tarballs for only the transitive coordinates
  selected into the reachable candidate lockfile closure;
- `/-/npm/v1/attestations/<encoded-package>@<exact-version>` for packages whose
  registry metadata advertises an attestation; and
- the pnpm 11.11.0 advisory `POST` to
  `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`, whose body may
  contain package names and exact versions only.

No repository path, source, manifest content, lockfile content, user identifier,
credential, cookie, token, raw environment value, or other repository content
may be transmitted. Any redirect or artifact host outside
`registry.npmjs.org`, any authentication challenge, or any other method/path is
a hard stop.

### HCP-02 compatibility conditions

The canonical REST source must remain SHA-256
`a923218bd0a2093d1d05ad65d7576bafd8828ff89eb6941b2605e52b540810cc`
and generated bindings must remain
`dcf438349464fc2a7e64dfb54716c86478dae884caaabfa90f0c8687afbe5ebf`.
This amendment authorizes no HCP-02 file change.

- T051 may register only unauthenticated `GET /health/live` (`getLiveness`) and
  `GET /health/ready` (`getReadiness`) at this phase. Every response carries
  `X-Correlation-Id`; readiness failure uses the canonical 503 `ErrorResponse`.
- The T048 health snapshot must be adapted to the closed HCP-02 `Health` wire
  shape; it must not be serialized directly. Public validation accepts the
  contract's generic UUID format even when newly generated IDs are UUIDv7.
- Authentication, idempotency, `If-Match`, weak ETag, stable error, and complete
  request/response validation hooks must enforce the already-approved HCP-02
  rules without adding a route, status, header, claim shape, Swagger endpoint,
  or duplicate schema.
- T052 lease/heartbeat/retry types remain internal. Any event uses the approved
  domain-event envelope and nested W3C `trace_context`; no new message contract
  is created.
- T053 consumes the approved Session and capability shapes, treats capabilities
  as display/discovery data rather than authorization, and creates no BFF/public
  operation.
- T054 validates evidence against the raw canonical evidence JSON Schema; broad
  generated TypeScript assignability is insufficient.

The OpenAPI server is `http://localhost:8080`, while the current HCP-04 source
publishes `3001`. Exact compatibility therefore depends on the separate HCP-04
source-conformance amendment below changing only the host-published API port to
8080 while retaining container port 3001. T054 must not report contract/runtime
compatibility until both records are approved and verified.

### Rollback, impact, invalidation, and exclusions

Expected effects, only after approval, are three small manifest diffs, a bounded
verifier correction, registry metadata/tarball reads, content-store additions,
`node_modules` links, and an additive shared-lockfile closure. There is no data,
schema, cache, container, deployment, or production impact.

On any failure: stop package use; retain sanitized hashes/diff/audit evidence;
apply a reviewed inverse patch only to the three manifests, boundary verifier,
and lockfile; verify the four before-change hashes above; and run the prior
frozen/offline install with lifecycle scripts disabled. These files are untracked
inside the documented-dirty baseline, so `git restore`, checkout, reset, clean,
history rewrite, or force operation is prohibited. Generated `node_modules`,
`.next`, or store entries need not be deleted and are never completion evidence.

This proposal explicitly excludes every package not in the direct table or its
exact reachable transitive closure, including direct Pino, PostgreSQL/`pg`,
Supabase clients/CLI, Redis/Valkey clients, OpenTelemetry SDK/exporters, Vitest,
Playwright, axe, pgTAP, Testcontainers, Fastify plugins, `typebox@1.x`, provider
6.x, and any TypeScript change. It excludes secret access, repository-content
upload, database/cache/collector/container access, image pulls, Docker/Compose,
public-contract change, source implementation of T051-T054, external deployment,
production resources, and T055 or later tasks.

Any package/version/integrity/license/provenance, manifest field, lockfile scope,
tool path/hash, command, request/origin, lifecycle policy, advisory disposition,
HCP-02 condition, or exclusion change invalidates approval and requires a new
attributable amendment.

### Exact approval statement

> Approve the HCP-01 T051-T054 dependency and manifest amendment exactly as
> recorded in HCP-01-dependencies.md. Authorize only the eight exact direct pins,
> three exact workspace-manifest changes, minimum allowlisted boundary-verifier
> correction, reachable shared-lockfile delta, and listed unauthenticated
> registry requests and commands using the recorded Node 24.18.0 and pnpm 11.11.0
> binaries. Retain the accepted incomplete-pre-lockfile baseline, strict peers,
> disabled lifecycle scripts, exact integrity/provenance/license/advisory stop
> gates, HCP-02 compatibility conditions, rollback, and every exclusion. This
> does not authorize any other dependency, source implementation of T051-T054,
> secret access, repository-content upload, database/cache/container access,
> image pull, deployment, production resource, or T055 and later task.

### Proposal decision record

- **Decision**: `approved_with_conditions` for the exact dependency, manifest,
  lockfile, verifier, command, origin, integrity, advisory, lifecycle, and
  rollback scope above.
- **Approver**: user in Codex task.
- **Decision time**: 2026-07-13; the user supplied no clock time.
- **Approval statement**: the exact statement in this section, supplied by the
  user, including its explicit exclusion of T051-T054 source implementation,
  secrets, repository upload, database/cache/container access, image pulls,
  production, and T055+.
- **Implementation/download result**: not run under this decision.

### T051-T054 runtime and manifest recovery result

**Completed**: 2026-07-13T12:51:20-07:00  
**Result**: `pass_with_recorded_failed_attempts` for runtime restoration and the
approved dependency/manifest recovery only; T051-T054 source implementation was
not started.

The user explicitly directed repair of the missing approved runtime, the stale
T047-T050-only restoration boundary, the current manifest/lockfile mismatch, the
out-of-scope web scripts, and this section's prior `not run` state. Recovery used
the previously recorded immutable Node archive, signature, release-key commit,
binary path/hash, eight direct dependency pins, registry origin, pnpm store, and
disabled-lifecycle commands without expanding package, contract, persistence,
infrastructure, secret, upload, production, or task scope.

- Node.js was restored at the exact approved `/tmp` path. The signed checksum
  manifest, archive SHA-256, traversal audit, binary SHA-256, version `v24.18.0`,
  and pnpm `11.11.0` all matched the recorded values.
- The three application manifests now contain only the exact approved scripts
  and eight direct dependency pins. The boundary verifier now rejects unknown
  manifest fields and permits only those fields plus the already-approved T035
  core/testing scripts and exports.
- Lockfile-only resolution preserved SHA-256
  `aae4996d4e996fe77311f88beeedb5934dcc18d42136ec9de0efa62cf2cdf4d3`,
  13 importers, 230 package/snapshot records, strict peers, and zero missing
  integrity fields.
- The first frozen install attempt timed out after 120 seconds while linking 72
  of 73 packages and is retained as a failure. An identical bounded retry passed
  using the approved local store with zero downloads; the frozen/offline replay
  then passed.
- The registry audit reported zero advisories at every severity. License review
  found no unknown license. Store integrity passed.
- `pnpm ignored-builds` exited zero but could not identify ignored builds despite
  linked modules. This is not represented as a pass. An offline manifest audit
  identified `esbuild@0.28.1` and optional `sharp@0.34.5` as the only packages
  with install/postinstall hooks; neither hook executed, the reviewed prebuilt
  platform packages are present, and no fallback download occurred.
- Direct Node 24 formatting, ESLint, TypeScript, exact workspace-boundary, and
  public-entry import checks passed. Failed/inadequate supplemental probes remain
  visible in
  `evidence/dependencies/t051-t054-runtime-and-manifest-recovery.json`.

No T051-T054 source file, public contract, persistence object, infrastructure
definition/runtime, secret, remote repository, CI, deployment, or production
resource was accessed or changed. T051-T054 remain unchecked.

## Current lockfile hash-rebinding amendment

**Status**: `approved_with_conditions`  
**Decision date**: 2026-07-13  
**Scope**: current `pnpm-lock.yaml` bytes only

The user explicitly authorized a new lockfile/dependency amendment for the
current file after the previously recorded hash was unavailable. The current
file is bound at SHA-256
`6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa` and retains
the approved pnpm lockfile version 9, 13 importers, the eight exact direct
dependency pins, the reviewed 230 package/snapshot records, strict peer policy,
and disabled lifecycle scripts. This amendment changes no package coordinate,
manifest, source, contract, migration, infrastructure, secret, or command.

### Exact approval statement

> Explicitly authorize a new HCP-01 lockfile/dependency amendment for the
> current `pnpm-lock.yaml` exactly as recorded in HCP-01-dependencies.md, bound
> to SHA-256
> `6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa` and the
> existing approved dependency graph only. Retain the eight direct pins, 13
> importers, 230 reviewed package/snapshot records, strict peers, disabled
> lifecycle scripts, existing integrity/provenance/license/advisory evidence,
> and every prior exclusion. Authorize no install, registry request, package
> addition/removal, manifest change, lifecycle/build script, source
> implementation, secret access, database/cache/container access, image pull,
> repository upload, production action, or T055 and later.

### Decision record

- **Decision**: `approved_with_conditions` for the exact current lockfile hash
  and unchanged reviewed dependency graph above.
- **Approver**: user in Codex task.
- **Approval statement**: the exact statement above, supplied by the user in
  the task as explicit authorization for a new amendment for the current file.
- **Implementation result**: hash rebinding only; no install, registry request,
  lifecycle execution, or dependency graph mutation.

## T054 generated-node_modules Linux platform recovery amendment proposal

**Status**: `prepared_implementation_blocked`  
**Prepared**: 2026-07-13  
**Deletion or relink authorized**: no

### Bound failure and generated state

The approved HCP-04 repair test stopped before its behavioral red assertion
because generated `node_modules` contains
`@esbuild/win32-x64@0.28.1`, while the approved WSL/Linux Node 24.18.0 runtime
requires `@esbuild/linux-x64@0.28.1`. This follows the user-reported failed
Windows `npm install`; repository manifests and `pnpm-lock.yaml` were unchanged,
but generated platform links were changed. The exact failure evidence is
`evidence/infrastructure/t054-hcp04-postgres-volume-repair-attempt.json` at
SHA-256
`af88acaaedc9da3047ba6cdd48bf89989898a8bad7b5a9d84355dd006e72d987`.

The only generated dependency directories present are:

1. `node_modules`;
2. `apps/api/node_modules`;
3. `apps/web/node_modules`.

The root virtual store contains the Windows esbuild package and no linked Linux
esbuild package. The current lockfile SHA-256 remains
`6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa`
and already contains integrity-pinned records for both optional platform
packages. Raw content-addressable store inspection could not prove the Linux
package is present within the bounded timeout, so the offline relink must fail
closed if pnpm cannot resolve it without network access.

### Exact tools and protected inputs

Only these existing tools and store are proposed:

- Node
  `/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`,
  version `v24.18.0`, SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`;
- pnpm CJS
  `/home/ricebran/.cache/codex-hitl-t024/corepack/v1/pnpm/11.11.0/bin/pnpm.cjs`,
  version `11.11.0`, SHA-256
  `67b035e322203961795e8e34ca63a08c37a4386eda94107fb3d28f3246d882ad`;
- store `/mnt/c/Users/brand/.pnpm-store/v11`.

Before any generated deletion, revalidate these immutable hashes and the exact
current hashes below:

| Path | SHA-256 |
|---|---|
| `.npmrc` | `a20d96915ced8afd8ad9b6fe00960fbcd450b558209c319fca18ca33263ebf6c` |
| `pnpm-workspace.yaml` | `95174f36c18b64bdd8ee8ef92757acd3a3cc73dbdcb99a4552dd14f80f51aed9` |
| `package.json` | `ccc4a85fa5431636339b0cb3bf7cc248fedc4e0c217a6be5bb0180f6526ab15d` |
| `apps/api/package.json` | `9d9803dad1dd99ec9f61b0b7574430c9753b7084c773b69b403063f54383fccc` |
| `apps/web/package.json` | `3cbdca2ca1e62de0b6d5420931f8cc0b2e34ce0613297241905072caf59c3d64` |
| `apps/workers/package.json` | `331c47e6cd572d92d6b28c3e09feedfea8cb0a00c18bba25c8c6d842365ea757` |
| `pnpm-lock.yaml` | `6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa` |

### Exact recovery operation

After approval, capture sanitized directory/link metadata, then delete only the
three generated directories listed above. Do not delete `.pnpm-store`, `.next`,
any repository source/evidence, Docker state, or any other path. Run exactly one
argv-only, `shell:false` pnpm operation with a minimal environment containing no
token, credential, proxy, inherited secret, telemetry, or registry
authentication:

```text
[NODE, PNPM, "install", "--offline", "--frozen-lockfile",
 "--ignore-scripts", "--store-dir=/mnt/c/Users/brand/.pnpm-store/v11",
 "--config.auto-install-peers=false",
 "--config.strict-peer-dependencies=true",
 "--config.verify-store-integrity=true",
 "--config.registry=https://registry.npmjs.org/"]
```

The registry setting binds package identity only; `--offline` forbids registry
access. Any network request, missing offline metadata/content, lockfile write,
package graph deviation, lifecycle request/execution, unexpected generated
path, or nonzero exit is a hard stop. No retry, `--force`, npm, yarn, Corepack
download, `approve-builds`, rebuild, registry fallback, or alternate store is
authorized.

### Post-recovery gates

Only after the offline command exits zero:

1. prove every protected input hash above is unchanged;
2. require linked `@esbuild/linux-x64@0.28.1` and absence of linked
   `@esbuild/win32-x64@0.28.1`;
3. run the prebuilt Linux esbuild executable with `--version` and require
   `0.28.1` without running a lifecycle script;
4. run only the existing repository-local
   `packages/core/src/core.test.ts` through the exact Node/tsx test command as a
   bounded loader smoke check;
5. run the workspace-boundary verifier, `./scripts/verify-authority.sh`, and
   `./scripts/verify.sh`;
6. record sanitized evidence and stop before the HCP-04 repair test until a
   refreshed HCP-04 binding is approved.

On any failure, leave the generated directories in their observed partial or
absent state, retain evidence, and stop. Do not restore the contaminated Windows
links, mutate the store, download a package, change the lockfile, or touch the
preserved Postgres container/network/volume.

### Exact approval statement

> Approve the HCP-01 T054 generated-node_modules Linux platform recovery
> amendment exactly as recorded in HCP-01-dependencies.md. Authorize deletion
> of only `node_modules`, `apps/api/node_modules`, and
> `apps/web/node_modules`; one exact argv-only `shell:false` pnpm 11.11.0
> `install --offline --frozen-lockfile --ignore-scripts` relink from
> `/mnt/c/Users/brand/.pnpm-store/v11` with the recorded strict configuration
> and minimal no-secret environment; and only the recorded Linux-esbuild,
> protected-hash, core-test loader, boundary, authority, and legacy checks.
> Preserve every manifest, `pnpm-lock.yaml`, approved dependency version and
> integrity, `.npmrc`, workspace file, source, contract, migration,
> infrastructure definition and runtime resource, secret boundary, disabled
> lifecycle policy, and exclusion. Fail closed without retry on any missing
> offline content, network request, graph/hash change, lifecycle execution, or
> failed check. This does not authorize npm/yarn, Corepack download, registry
> access, `--force`, `approve-builds`, rebuild, alternate store, any other
> deletion or dependency operation, HCP-04 source/runtime repair, container
> action, database/cache/telemetry access, secret inspection/disclosure,
> production, repository upload, or T055 and later.

### Decision record

- **Decision**: pending; the user authorized preparation only and prohibited
  deletion or installation before a new exact approval.
- **Required approver**: user in the Codex task using the exact statement above
  and the final checkpoint/proposal-evidence hashes.
- **Invalidation**: any directory, tool/store path or hash, protected-input hash,
  command/environment/configuration, platform package, post-check, recovery
  rule, evidence field, or exclusion change.

### Approved recovery attempt result

**Approval**: supplied by the user against checkpoint SHA-256
`6b4d89123dd0f93cd68130589d09f41abb5978a6986f7fa295d577ba74c198b8`
and proposal-evidence SHA-256
`7053ed56602b2aff447e07c03563018620808c72b761b6a431adc45b9207a0cd`.

**Result**: `incomplete_offline_frozen_install_rejected`. Preflight bindings,
tool hashes, protected hashes, generated paths, and platform mismatch all
matched. The three approved generated `node_modules` directories were deleted.
The single argv-only `shell:false` offline attempt then exited 1 before linking
packages with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`: the current lockfile records
`settings.autoInstallPeers: true`, while the approved command required
`--config.auto-install-peers=false`.

No retry, network request, lifecycle execution, lockfile/manifest/source change,
HCP-04 repair, container/database/cache/telemetry action, secret access,
production action, repository upload, or T055+ work occurred. All three
generated dependency directories remain absent. Because the install did not
exit zero, the Linux-esbuild, loader, boundary, authority, legacy, and HCP-04
post-recovery gates were not run. Exact sanitized evidence is retained in
`evidence/dependencies/t054-hcp01-generated-node-modules-linux-recovery-attempt.json`.
T054 remains unchecked. A new exact amendment is required; this approval cannot
be retried or reinterpreted.

## T054 generated-node_modules Linux recovery retry amendment proposal

**Status**: `prepared_retry_blocked`  
**Prepared**: 2026-07-13  
**Install or retry authorized**: no

### Bound failure and corrected premise

This proposal is bound to the consumed failed-attempt evidence
`evidence/dependencies/t054-hcp01-generated-node-modules-linux-recovery-attempt.json`
at SHA-256
`99c34f840a07a3cbc130f0f4b983766bb5f45311849467ed2bb411c0528efffa`.
The attempt deleted only the three approved generated dependency directories,
then failed before linking packages because the command required
`auto-install-peers=false` while the immutable current lockfile records
`settings.autoInstallPeers: true`.

The retry must preserve `.npmrc` at SHA-256
`a20d96915ced8afd8ad9b6fe00960fbcd450b558209c319fca18ca33263ebf6c`,
including its repository policy value `auto-install-peers=false`. The proposed
command uses the narrow CLI override `--config.auto-install-peers=true` only to
replay the already-approved frozen lockfile. It does not amend repository
policy, dependency selection, package versions, or lockfile bytes.

All three generated directories remain absent:

1. `node_modules`;
2. `apps/api/node_modules`;
3. `apps/web/node_modules`.

No deletion is proposed or authorized by this retry amendment.

### Exact tools and protected inputs

Before a retry, revalidate:

- Node
  `/tmp/codex-hitl-t030-node-v24.18.0/node-v24.18.0-linux-x64/bin/node`,
  version `v24.18.0`, SHA-256
  `41a74efb34cbde5c7632cdac0cf8bd1a14d0b8d73dc1e82755014d9a9ce70f5c`;
- pnpm CJS
  `/home/ricebran/.cache/codex-hitl-t024/corepack/v1/pnpm/11.11.0/bin/pnpm.cjs`,
  version `11.11.0`, SHA-256
  `67b035e322203961795e8e34ca63a08c37a4386eda94107fb3d28f3246d882ad`;
- store `/mnt/c/Users/brand/.pnpm-store/v11`;
- `.npmrc` SHA-256
  `a20d96915ced8afd8ad9b6fe00960fbcd450b558209c319fca18ca33263ebf6c`;
- `pnpm-workspace.yaml` SHA-256
  `95174f36c18b64bdd8ee8ef92757acd3a3cc73dbdcb99a4552dd14f80f51aed9`;
- root `package.json` SHA-256
  `ccc4a85fa5431636339b0cb3bf7cc248fedc4e0c217a6be5bb0180f6526ab15d`;
- `apps/api/package.json` SHA-256
  `9d9803dad1dd99ec9f61b0b7574430c9753b7084c773b69b403063f54383fccc`;
- `apps/web/package.json` SHA-256
  `3cbdca2ca1e62de0b6d5420931f8cc0b2e34ce0613297241905072caf59c3d64`;
- `apps/workers/package.json` SHA-256
  `331c47e6cd572d92d6b28c3e09feedfea8cb0a00c18bba25c8c6d842365ea757`;
- `pnpm-lock.yaml` SHA-256
  `6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa`.

### Exact retry operation

After a new exact approval, run once as argv with `shell:false` and the same
recorded minimal environment containing no token, credential, proxy, inherited
secret, telemetry, or registry authentication:

```text
[NODE, PNPM, "install", "--offline", "--frozen-lockfile",
 "--ignore-scripts", "--store-dir=/mnt/c/Users/brand/.pnpm-store/v11",
 "--config.auto-install-peers=true",
 "--config.strict-peer-dependencies=true",
 "--config.verify-store-integrity=true",
 "--config.registry=https://registry.npmjs.org/"]
```

The `true` override is required solely because it is the value already embedded
in the frozen lockfile. `--offline` forbids registry access. Any network request,
missing offline content/metadata, lockfile or protected-input write, package
graph/version deviation, lifecycle request/execution, unexpected generated
path, or nonzero exit is a hard stop. No second retry, deletion, `--force`, npm,
yarn, Corepack download, `approve-builds`, rebuild, alternate store, registry
fallback, or policy-file edit is authorized.

### Post-retry gates

Only after the one offline command exits zero:

1. prove every protected input hash remains exact;
2. require linked `@esbuild/linux-x64@0.28.1` and absence of linked
   `@esbuild/win32-x64@0.28.1`;
3. require the prebuilt Linux esbuild executable to return version `0.28.1`
   without lifecycle execution;
4. run only the existing `packages/core/src/core.test.ts` through the exact
   Node/tsx loader command;
5. run the workspace-boundary verifier, `./scripts/verify-authority.sh`, and
   `./scripts/verify.sh`;
6. record sanitized evidence and stop before the HCP-04 repair test.

On failure, preserve the observed generated state, record honest incomplete
evidence, and stop. Do not repair or restore with another package-manager
operation.

### Exact approval statement

> Approve the HCP-01 T054 generated-node_modules Linux recovery retry amendment
> exactly as recorded in HCP-01-dependencies.md. Bind it to failed-attempt
> evidence SHA-256
> `99c34f840a07a3cbc130f0f4b983766bb5f45311849467ed2bb411c0528efffa`.
> Authorize no deletion and exactly one argv-only `shell:false` pnpm 11.11.0
> `install --offline --frozen-lockfile --ignore-scripts` attempt from
> `/mnt/c/Users/brand/.pnpm-store/v11` using the recorded minimal no-secret
> environment and `--config.auto-install-peers=true` solely to match the
> immutable lockfile setting, followed only after exit zero by the recorded
> protected-hash, Linux-esbuild, loader, boundary, authority, and legacy gates.
> Preserve `.npmrc`, every manifest, `pnpm-lock.yaml`, all approved dependency
> versions and integrity records, source, contracts, migrations, infrastructure
> definitions and runtime state, secrets, disabled lifecycle restrictions, and
> every exclusion. Fail closed without another retry on any missing offline
> content, network request, mutation, lifecycle execution, mismatch, or failed
> gate. This does not authorize deletion, an `.npmrc` or lockfile change, npm,
> yarn, Corepack download, registry access, `--force`, `approve-builds`, rebuild,
> alternate store, HCP-04 work, container/database/cache/telemetry access,
> secret inspection/disclosure, production, repository upload, or T055 and
> later.

### Decision record

- **Decision**: pending; preparation only is authorized.
- **Required approver**: user in the Codex task using the exact statement above
  and the final checkpoint/proposal-evidence SHA-256 values.
- **Invalidation**: any tool/store path or hash, protected-input hash, absent
  generated-directory state, command/environment/configuration, post-gate,
  recovery rule, evidence field, or exclusion change.

### Approved retry result

**Approval**: supplied by the user against checkpoint SHA-256
`b4b93b22712862ef29283a00332f0bb3451393cc21ce9a757eda45ef477fb87f`,
retry-proposal evidence SHA-256
`566b369955333f174998dc970d5b17a7e1bd06526d4cca6d322a4bcc23d37199`,
and failed-attempt evidence SHA-256
`99c34f840a07a3cbc130f0f4b983766bb5f45311849467ed2bb411c0528efffa`.

**Result**: `incomplete_offline_retry_timeout`. Every preflight binding and
protected hash matched. No deletion occurred. The single exact offline
`shell:false` retry matched `autoInstallPeers: true`, resolved and reused all 169
packages with zero downloads, but reached its 120-second bound after adding 168
packages. It was terminated with exit code 124. No pnpm process remained after
termination, and no second retry was issued.

The resulting generated state is partial: root `node_modules` exists,
`apps/api/node_modules` and `apps/web/node_modules` are absent, the virtual store
contains `@esbuild/linux-x64@0.28.1` and no Windows esbuild package, and no
esbuild executable link was observed. All protected repository hashes remain
exact. No lifecycle script, observed network request, HCP-04 work, runtime gate,
container/database/cache/telemetry action, secret access, production action,
repository upload, or T055+ work occurred.

Because the command did not exit zero, none of the approved post-retry gates ran.
The partial generated state is preserved for review. Exact sanitized evidence is
retained in
`evidence/dependencies/t054-hcp01-generated-node-modules-linux-recovery-retry-attempt.json`.
T054 remains unchecked. This approval is consumed and cannot be retried or
reinterpreted; a new exact amendment is required before any dependency action.

## T054 Linux generated-node_modules partial-link continuation proposal

**Status**: `prepared_continuation_blocked`  
**Prepared**: 2026-07-13  
**Dependency operation authorized**: no

### Bound partial state

This proposal is bound to retry-attempt evidence SHA-256
`49102e549fdd16acd09ad76d73e449a81435fd644a165a2c7fa005416c817fe6`.
The exact offline retry timed out at 120 seconds after resolving and reusing all
169 packages, downloading zero, and adding 168. No pnpm process remains. Root
`node_modules` is partial, both application `node_modules` directories are
absent, the root virtual store contains 169 package directories including
`@esbuild/linux-x64@0.28.1`, and no Windows esbuild package is present.

No deletion, cleanup, repair, or relink outside pnpm's normal continuation of
this exact generated state is proposed. All protected paths and hashes from the
retry amendment remain binding, including `.npmrc` SHA-256
`a20d96915ced8afd8ad9b6fe00960fbcd450b558209c319fca18ca33263ebf6c`
and `pnpm-lock.yaml` SHA-256
`6e49bfb4a0f84c89b1b804c2014bbe2cc6b0dfba149f6f4cb89fa640a23f6dfa`.

### Exact continuation

After exact approval, revalidate the recorded Node/pnpm paths and hashes,
protected hashes, partial generated state, and absence of a pnpm process. Then
run the same command once, as argv with `shell:false`, the same recorded minimal
no-secret environment, and a hard 300-second bound:

```text
[NODE, PNPM, "install", "--offline", "--frozen-lockfile",
 "--ignore-scripts", "--store-dir=/mnt/c/Users/brand/.pnpm-store/v11",
 "--config.auto-install-peers=true",
 "--config.strict-peer-dependencies=true",
 "--config.verify-store-integrity=true",
 "--config.registry=https://registry.npmjs.org/"]
```

No deletion or second continuation is authorized. Any network request, missing
offline content, protected-file/graph/version mutation, lifecycle request or
execution, unexpected generated path, nonzero exit, or timeout is a hard stop.

Only after exit zero, run the protected-hash, Linux-esbuild 0.28.1, absence of
Windows esbuild, existing core loader test, workspace-boundary,
`./scripts/verify-authority.sh`, and `./scripts/verify.sh` gates. Record sanitized
evidence and stop before the HCP-04 repair test.

### Exact approval statement

> Approve the HCP-01 T054 Linux generated-node_modules partial-link
> continuation amendment exactly as recorded in HCP-01-dependencies.md. Bind it
> to retry-attempt evidence SHA-256
> `49102e549fdd16acd09ad76d73e449a81435fd644a165a2c7fa005416c817fe6`.
> Authorize no deletion and exactly one 300-second-bounded argv-only
> `shell:false` pnpm 11.11.0
> `install --offline --frozen-lockfile --ignore-scripts` continuation using the
> recorded store, minimal no-secret environment, and
> `--config.auto-install-peers=true`, followed only after exit zero by the
> recorded protected-hash, Linux-esbuild, loader, boundary, authority, and
> legacy gates. Preserve the partial generated state until that command, every
> protected file and approved dependency version, lifecycle restrictions,
> infrastructure state, secrets, and all exclusions. Fail closed without
> another continuation on any timeout, nonzero exit, network request, mutation,
> lifecycle execution, mismatch, or failed gate. Do not begin HCP-04, T054
> runtime gates, or T055 and later.

### Decision record

- **Decision**: pending; preparation only is authorized.
- **Required approver**: user in the Codex task using the exact statement and
  final checkpoint/proposal-evidence hashes.
- **Invalidation**: any bound evidence, tool/protected hash, generated-state
  fact, process state, command/environment/bound, gate, or exclusion change.

### Approved partial-link continuation result

**Approval**: supplied by the user against checkpoint SHA-256
`30b3738563d0096982ccccaa44c01bc7a3a80898e7d5dcf9c5e0a20e293090a2`,
proposal-evidence SHA-256
`569f70ec41bf18e3f4f594e66eca42b9442d0eed037d0b19db5437db4fc8d29f`,
and retry-attempt evidence SHA-256
`49102e549fdd16acd09ad76d73e449a81435fd644a165a2c7fa005416c817fe6`.

**Result**: `complete_continuation_and_post_gates_passed`. Every preflight
binding matched. The single no-deletion, argv-only, `shell:false`, offline
continuation exited zero in 126 seconds: all 169 packages were resolved, reused,
and added with zero downloads and no lifecycle execution. Root, API, and web
generated dependency directories are present. Only Linux esbuild 0.28.1 is
linked; Windows esbuild is absent; the prebuilt executable returned `0.28.1`.

Every protected hash remained exact. The existing core loader suite passed 9/9,
the workspace boundary passed for 12 workspaces and eight approved direct
dependencies, authority verification passed for two PF-033 artifacts, and
`./scripts/verify.sh` passed eight traceability requirements, ten legacy tests,
and nine compatibility tests.

No deletion, network request, lifecycle script, fallback, HCP-04 work, T054
runtime gate, infrastructure mutation, secret access, repository upload,
production action, or T055+ work occurred. Exact sanitized evidence is retained
in `evidence/dependencies/t054-hcp01-linux-partial-link-continuation.json`.
T054 remains unchecked, and work stopped before the HCP-04 repair test as
required.
