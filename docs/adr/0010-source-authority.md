# ADR-0010: Preserve the Normative Product Paper as Repository Authority

**Status**: Accepted for implementation; HCP-06 approved  
**Date**: 2026-07-10  
**Owner**: Product Architecture  
**Review date**: 2026-10-10  
**Requirements**: PF-033, SC-014

## Context

Final Production Paper v3 is the approved product and architecture authority.
Verified PDF/DOCX copies and a manifest are present. HCP-06 approves their exact
repository storage, ownership, Internal classification, redistribution basis,
paths, sizes, and hashes under Option A.

## Alternatives

1. Commit both PDF and DOCX plus a manifest: strongest offline resolution, with
   approximately 1.7 MB of binary Git history and a required redistribution basis.
2. Commit a manifest resolving immutable controlled organization artifacts: avoids
   binary storage, but depends on durable access and resolution procedures.
3. Keep hashes only in `spec.md`: rejected because the source cannot be resolved.
4. Reference the local Downloads paths: rejected because they are not portable or
   repository-owned.

## Decision

Use a version-controlled manifest as the canonical resolver. HCP-06 selected
Option A: repository copies of both artifacts owned by 7 Finger Studios and
classified Internal. Any owner, classification, redistribution-basis, path,
size, hash, or storage-option change requires a new attributable decision.

## Consequences

- CI and future contributors can verify the normative input deterministically.
- Option A increases repository size; Option B introduces controlled-access
  availability and credential-policy considerations.
- A mismatch or resolution failure blocks Phase 1 acceptance.

## Security impact

Classification and redistribution rights are reviewed before publication. The
manifest contains no access token or secret. Controlled resolution must not expose
credentials in logs, errors, or evidence.

## Rollback and migration

Corrections use a superseding attributable manifest/ADR and new hashes; no history
rewrite or unapproved deletion. Release evidence records the exact authority
version used.

## Validation

T019-T021 validate the current decision, metadata, repository path containment,
non-symlink artifact resolution, sizes, and SHA-256 hashes. T166-T168 will bind
the accepted ADR and authority hashes to the candidate revision.
