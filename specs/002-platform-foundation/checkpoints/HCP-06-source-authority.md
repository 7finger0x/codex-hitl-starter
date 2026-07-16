# HCP-06: Normative Source Authority

**Status**: `approved`  
**Protected action**: Copying/committing the external paper files or committing a manifest that resolves to controlled organization artifacts  
**Blocks**: T021 and all Phase 1 acceptance claims under PF-033  
**Prepared**: 2026-07-10

## Verified source inventory

| Format | Current external path | Bytes | Modified (America/Los_Angeles) | SHA-256 | Hash result |
|---|---|---:|---|---|---|
| PDF | `/mnt/c/Users/brand/Downloads/AI_Trading_OS_Hermes_Final_Production_Paper_v3.pdf` | 1,574,532 | 2026-07-10 02:56:26 -0700 | `9d075a82a6088ef446442a1113f59a6023196fd5304c12a4e7eaefdedee66a61` | Matches approved spec |
| DOCX | `/mnt/c/Users/brand/Downloads/AI_Trading_OS_Hermes_Final_Production_Paper_v3.docx` | 127,602 | 2026-07-10 02:56:22 -0700 | `72a37bb2aec0cde1d103d98b292b4f1073f4373bf1e96a270a473438b4ecc4dc` | Matches approved spec |

The source paths are outside the repository. Hash-matching repository copies are
accepted under the exact Option A approval recorded below. No file was deleted or
transmitted externally.

## Decision options

### Option A: Commit both controlled artifacts

Proposed paths:

- `docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.pdf`
- `docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.docx`
- `docs/authority/final-production-paper-v3.manifest.json`

The manifest will contain title, version, effective date, classification, owner,
license/redistribution basis, both repository-relative paths, sizes, hashes, and
verification instructions.

### Option B: Commit a resolvable controlled manifest

Proposed path:

- `docs/authority/final-production-paper-v3.manifest.json`

This option requires user-provided immutable organization artifact URIs or IDs,
access classification, controlling owner, version/effective date, license or
redistribution basis, both expected hashes, and deterministic resolution and
verification instructions. A local Downloads path is not acceptable.

## Approved governance facts

- Controlling organization/owner: 7 Finger Studios.
- Repository classification: Internal.
- Redistribution basis: the user confirmed that 7 Finger Studios owns both
  artifacts and that the user is authorized on its behalf to commit and
  redistribute them within this repository for this project.
- Storage decision: Option A, limited to the exact paths, sizes, and hashes in
  this record.

## Impact and recovery

- Option A adds approximately 1.7 MB of binary source authority to Git history.
- Option B avoids binary storage but depends on durable controlled access.
- Either option makes the verified hashes a release input and blocks acceptance on
  mismatch or failed resolution.
- A mistaken decision is corrected through a new attributable manifest/commit and
  superseding ADR; history rewrite or unapproved deletion is prohibited.

## Approved scope

HCP-06 covers only the hash-identified Option A artifacts, manifest, and
deterministic verifier described in this record. It does not authorize external
publication, production deployment, or any other human checkpoint.

## Decision record

- Decision: `approved`
- Selected option: Option A, repository-owned PDF and DOCX plus manifest.
- Approved artifacts:
  - `docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.pdf`
  - `docs/authority/AI_Trading_OS_Hermes_Final_Production_Paper_v3.docx`
  - `docs/authority/final-production-paper-v3.manifest.json`
  - `scripts/verify-authority.sh`
- Owner/classification/redistribution basis: 7 Finger Studios; Internal;
  user-confirmed ownership and authorization for repository use in this project.
- Conditions: invalidated by any owner, classification, redistribution-basis,
  storage-option, artifact-path, byte-size, or hash change.
- Decision timestamp: `2026-07-10T04:47:06-07:00`.
- Expiry: none stated.

### Audit history

Governance remediation temporarily classified the pre-existing artifacts as
pending while task numbering and authority were reconciled. The exact user
approval above remains the latest attributable HCP-06 decision available to this
task; both events are retained rather than silently deleting the remediation
history.

## Implementation evidence

- Repository PDF SHA-256:
  `9d075a82a6088ef446442a1113f59a6023196fd5304c12a4e7eaefdedee66a61`
  (1,574,532 bytes).
- Repository DOCX SHA-256:
  `72a37bb2aec0cde1d103d98b292b4f1073f4373bf1e96a270a473438b4ecc4dc`
  (127,602 bytes).
- `./scripts/verify-authority.sh` validates the approved metadata, decision,
  repository path containment, non-symlink files, sizes, and hashes.
- The verifier passed on 2026-07-10 against both approved repository artifacts.
- No external publication, deployment, credential access, or network transfer
  was performed.
