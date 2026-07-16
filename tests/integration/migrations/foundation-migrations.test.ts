import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, resolve } from "node:path";
import test from "node:test";

type JsonObject = { readonly [key: string]: unknown };

const repositoryRoot = resolve(process.cwd());
const checkpointPath = resolve(
  repositoryRoot,
  "specs/002-platform-foundation/checkpoints/HCP-03-persistence.md",
);
const migrationDirectory = resolve(repositoryRoot, "supabase/migrations");
const sqlSuitePath = resolve(repositoryRoot, "supabase/tests/000_foundation_migration_test.sql");
const targetAttestationPath = resolve(
  repositoryRoot,
  "evidence/persistence/hcp03-target-attestation.json",
);
const approvedMigrations = [
  "202607100001_foundation_bootstrap.sql",
  "202607100002_identity_tenancy_foundation.sql",
  "202607100003_control_and_evidence_foundation.sql",
] as const;

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseJson(path: string): JsonObject {
  const value: unknown = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value), path);
  return value as JsonObject;
}

function assertString(value: unknown, label: string): string {
  assert.equal(typeof value, "string", label);
  return value as string;
}

function approvedMigrationPaths(): string[] {
  const actual = existsSync(migrationDirectory)
    ? readdirSync(migrationDirectory)
        .filter((name) => name.endsWith(".sql"))
        .toSorted()
    : [];
  assert.deepEqual(
    actual,
    [...approvedMigrations],
    "T039-T041 exact migrations are not materialized",
  );
  return actual.map((name) => resolve(migrationDirectory, name));
}

function validateMigrationSources(paths: readonly string[]): void {
  const combined = paths.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.equal((combined.match(/\bcreate\s+table\b/giu) ?? []).length, 38);
  assert.equal((combined.match(/\bcreate\s+(?:or\s+replace\s+)?function\b/giu) ?? []).length, 18);
  assert.equal((combined.match(/\bcreate\s+role\b/giu) ?? []).length, 6);
  assert.match(combined, /enable\s+row\s+level\s+security/iu);
  assert.match(combined, /force\s+row\s+level\s+security/iu);
  assert.match(combined, /platform_private\.foundation_migration_ledger/u);
  assert.doesNotMatch(combined, /\bdrop\s+(?:database|schema|table|role)\b/iu);
  assert.doesNotMatch(combined, /\bdisable\s+row\s+level\s+security\b/iu);
  assert.doesNotMatch(combined, /(?<!NO)BYPASSRLS/iu);
  assert.doesNotMatch(combined, /\busing\s*\(\s*true\s*\)/iu);
  assert.doesNotMatch(combined, /\bfor\s+all\b/iu);
}

type TargetAttestation = {
  readonly application_authorized: boolean;
  readonly backup_directory: string;
  readonly database: "platform_foundation_hcp03";
  readonly database_comment: "DISPOSABLE:002-platform-foundation:HCP-03";
  readonly docker_path: string;
  readonly docker_sha256: string;
  readonly host: "127.0.0.1";
  readonly pg_dump_path: "/usr/bin/pg_dump";
  readonly pg_dump_sha256: string;
  readonly pg_dump_version: string;
  readonly port: 55432;
  readonly postgres_container: "platform-foundation-local-postgres-1";
  readonly postgres_image: "docker.io/supabase/postgres:17.6.1.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00";
  readonly postgres_major: 17;
  readonly project_name: "platform-foundation-local";
  readonly psql_path: "/usr/bin/psql";
  readonly psql_sha256: string;
  readonly psql_version: string;
  readonly target_facts_recorded: boolean;
};

const approvedDockerPath = "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe";
const approvedDockerSha256 = "7bc66b018b9da43fea986f893288bb93970d3d1217f5063201fd97c827f20732";
const approvedPostgresImage =
  "docker.io/supabase/postgres:17.6.1.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00";
const migrationPhases = [
  "empty",
  "representative_prior",
  "interrupted_001_002_then_003",
  "rolling_compatibility_and_forward_recovery",
] as const;

function readTargetAttestation(): TargetAttestation {
  assert.ok(
    existsSync(targetAttestationPath),
    "guarded target/tool attestation is absent; database access remains prohibited",
  );
  const raw = parseJson(targetAttestationPath);
  const expected = {
    application_authorized: true,
    database: "platform_foundation_hcp03",
    database_comment: "DISPOSABLE:002-platform-foundation:HCP-03",
    docker_path: approvedDockerPath,
    docker_sha256: approvedDockerSha256,
    host: "127.0.0.1",
    pg_dump_path: "/usr/bin/pg_dump",
    port: 55432,
    postgres_container: "platform-foundation-local-postgres-1",
    postgres_image: approvedPostgresImage,
    postgres_major: 17,
    project_name: "platform-foundation-local",
    psql_path: "/usr/bin/psql",
    target_facts_recorded: true,
  } as const;
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(raw[key], value, `target attestation ${key}`);
  }
  const backupDirectory = assertString(raw.backup_directory, "backup_directory");
  assert.ok(isAbsolute(backupDirectory), "backup_directory must be absolute");
  assert.ok(!backupDirectory.startsWith(repositoryRoot), "backup_directory must be external");
  assert.equal(sha256(approvedDockerPath), approvedDockerSha256);
  for (const key of ["psql_sha256", "pg_dump_sha256"] as const) {
    assert.match(assertString(raw[key], key), /^[0-9a-f]{64}$/u);
  }
  for (const key of ["psql_version", "pg_dump_version"] as const) {
    assert.match(assertString(raw[key], key), /PostgreSQL\) 17\.[0-9]+/u);
  }
  return raw as unknown as TargetAttestation;
}

function runDocker(
  attestation: TargetAttestation,
  args: readonly string[],
  input?: string,
): { readonly status: number | null; readonly stdout: Buffer } {
  const result = spawnSync(attestation.docker_path, args, {
    cwd: repositoryRoot,
    encoding: null,
    env: { LANG: "C", LC_ALL: "C" },
    input,
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: 60_000,
  });
  assert.equal(result.error, undefined, "approved Docker tool adapter could not start");
  return { status: result.status, stdout: result.stdout };
}

function runPostgresTool(
  attestation: TargetAttestation,
  tool: "/usr/bin/psql" | "/usr/bin/pg_dump" | "/usr/bin/sha256sum",
  args: readonly string[],
  input?: string,
): { readonly status: number | null; readonly stdout: Buffer } {
  return runDocker(
    attestation,
    ["exec", "--interactive", "--user=postgres", attestation.postgres_container, tool, ...args],
    input,
  );
}

function runPsql(attestation: TargetAttestation, sql: string): string {
  const result = runPostgresTool(
    attestation,
    attestation.psql_path,
    [
      "--no-psqlrc",
      "--quiet",
      "--set=ON_ERROR_STOP=1",
      `--dbname=${attestation.database}`,
      "--file=-",
    ],
    sql,
  );
  assert.equal(result.status, 0, "approved PostgreSQL command failed");
  return result.stdout.toString("utf8");
}

function attestPostgresTools(attestation: TargetAttestation): void {
  for (const [path, expectedVersion, expectedHash] of [
    [attestation.psql_path, attestation.psql_version, attestation.psql_sha256],
    [attestation.pg_dump_path, attestation.pg_dump_version, attestation.pg_dump_sha256],
  ] as const) {
    const version = runPostgresTool(attestation, path, ["--version"]);
    assert.equal(version.status, 0, `${path} version probe failed`);
    assert.equal(version.stdout.toString("utf8").trim(), expectedVersion);
    const digest = runPostgresTool(attestation, "/usr/bin/sha256sum", [path]);
    assert.equal(digest.status, 0, `${path} digest probe failed`);
    assert.equal(digest.stdout.toString("utf8").trim().split(/\s+/u)[0], expectedHash);
  }
}

function guardTarget(attestation: TargetAttestation): void {
  const guardSql = `do $guard$
declare
  relation record;
  unsafe_count bigint;
begin
  for relation in
    select format('%I.%I', schemaname, tablename) as qualified_name
    from pg_tables
    where schemaname = 'platform'
  loop
    execute format(
      'select count(*) from %s as guarded_row where row_to_json(guarded_row)::text !~* %L',
      relation.qualified_name,
      'synthetic'
    ) into unsafe_count;
    if unsafe_count <> 0 then
      raise exception 'non-synthetic platform rows are forbidden';
    end if;
    execute format(
      'select count(*) from %s as guarded_row where row_to_json(guarded_row)::text ~* %L',
      relation.qualified_name,
      '"(environment|kind|code|name)"[[:space:]]*:[[:space:]]*"(staging|production)"'
    ) into unsafe_count;
    if unsafe_count <> 0 then
      raise exception 'staging or production markers are forbidden';
    end if;
  end loop;
end;
$guard$;
select
    current_database(),
    coalesce(obj_description(oid, 'pg_database'), ''),
    current_setting('server_version_num')::integer / 10000,
    pg_is_in_recovery(),
    (select count(*) from pg_replication_slots),
    (select count(*) from pg_subscription),
    (select count(*) from pg_foreign_server)
  from pg_database
  where datname = current_database()`;
  const output = runPsql(
    attestation,
    `\\pset tuples_only on\n\\pset format unaligned\n\\pset fieldsep '|'\n${guardSql}\n`,
  );
  const fields = output.trim().split("|");
  assert.deepEqual(fields, [
    attestation.database,
    attestation.database_comment,
    String(attestation.postgres_major),
    "f",
    "0",
    "0",
    "0",
  ]);
}

function createBackup(attestation: TargetAttestation, phase: string): string {
  assert.match(phase, /^[a-z0-9_]+$/u);
  guardTarget(attestation);
  const result = runPostgresTool(attestation, attestation.pg_dump_path, [
    "--format=custom",
    "--no-owner",
    "--no-acl",
    attestation.database,
  ]);
  assert.equal(result.status, 0, "pre-migration backup failed");
  const backupPath = resolve(attestation.backup_directory, `${phase}.dump`);
  assert.ok(backupPath.startsWith(`${resolve(attestation.backup_directory)}/`));
  writeFileSync(backupPath, result.stdout, { flag: "wx", mode: 0o600 });
  const digest = sha256(backupPath);
  assert.match(digest, /^[0-9a-f]{64}$/u);
  return digest;
}

function applyMigration(attestation: TargetAttestation, path: string): void {
  guardTarget(attestation);
  const result = runPostgresTool(
    attestation,
    attestation.psql_path,
    [
      "--no-psqlrc",
      "--single-transaction",
      "--set=ON_ERROR_STOP=1",
      `--set=migration_sha256=${sha256(path)}`,
      `--dbname=${attestation.database}`,
      "--file=-",
    ],
    readFileSync(path, "utf8"),
  );
  assert.equal(result.status, 0, `migration failed: ${basename(path)}`);
}

function resetTarget(attestation: TargetAttestation): void {
  guardTarget(attestation);
  runPsql(
    attestation,
    `drop schema if exists platform cascade;
drop schema if exists platform_private cascade;
drop role if exists platform_api;
drop role if exists platform_worker;
drop role if exists platform_evidence_reader;
drop role if exists platform_runtime;
drop role if exists platform_migrator;
drop role if exists platform_owner;
`,
  );
  guardTarget(attestation);
}

function runSqlSuite(attestation: TargetAttestation): void {
  guardTarget(attestation);
  const output = runPsql(attestation, readFileSync(sqlSuitePath, "utf8"));
  assert.match(output, /foundation migration SQL acceptance: pass/u);
}

function assertLedgerCount(attestation: TargetAttestation, expected: number): void {
  guardTarget(attestation);
  const output = runPsql(
    attestation,
    `\\pset tuples_only on
\\pset format unaligned
select count(*) from platform_private.foundation_migration_ledger;
`,
  );
  assert.equal(Number(output.trim()), expected);
}

function seedRepresentativePrior(attestation: TargetAttestation): void {
  guardTarget(attestation);
  runPsql(
    attestation,
    `begin;
set local role platform_api;
select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000011'::uuid,
  '018f0000-0000-7000-8000-000000000011'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000111'::uuid,
  '018f0000-0000-7000-8000-000000000211'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000311'::uuid
);
insert into platform.users (id, auth_subject, locale, timezone, status)
values ('018f0000-0000-7000-8000-000000000011', 'synthetic-prior-user', 'en-US', 'UTC', 'active');
insert into platform.tenants (id, name, type, status, default_timezone, base_currency, created_by)
values (
  '018f0000-0000-7000-8000-000000000111', 'Synthetic Prior Tenant', 'team', 'active', 'UTC', 'USD',
  '018f0000-0000-7000-8000-000000000011'
);
insert into platform.environments (id, tenant_id, code, kind, execution_mode, status)
values (
  '018f0000-0000-7000-8000-000000000211',
  '018f0000-0000-7000-8000-000000000111',
  'synthetic-prior', 'sandbox', 'observe', 'active'
);
commit;
`,
  );
}

function assertRepresentativePriorSurvived(attestation: TargetAttestation): void {
  guardTarget(attestation);
  const output = runPsql(
    attestation,
    `\\pset tuples_only on
\\pset format unaligned
select count(*) from platform.tenants where name = 'Synthetic Prior Tenant';
`,
  );
  assert.equal(Number(output.trim()), 1);
}

function assertRollingCompatibility(attestation: TargetAttestation, ledgerCount: number): void {
  assertLedgerCount(attestation, ledgerCount);
  const output = runPsql(
    attestation,
    `\\pset tuples_only on
\\pset format unaligned
select count(*) from pg_roles where rolname in ('platform_api', 'platform_worker');
`,
  );
  assert.equal(Number(output.trim()), 2);
}

function assertForwardRecoveryBoundary(paths: readonly string[]): void {
  assert.deepEqual(
    paths.map((path) => basename(path)),
    [...approvedMigrations],
  );
  assert.equal(
    readdirSync(migrationDirectory).some((name) => /(?:down|rollback|revert)/iu.test(name)),
    false,
    "post-commit failure must not invent a reverse migration",
  );
  for (const path of paths) assert.match(sha256(path), /^[0-9a-f]{64}$/u);
}

test("HCP-03 Option A is the exact attributable authority", () => {
  const checkpoint = readFileSync(checkpointPath, "utf8");
  assert.match(checkpoint, /\*\*Status\*\*: `approved_with_conditions`/u);
  assert.match(checkpoint, /\*\*Decision\*\*: `approved_with_conditions` — Option A/u);
  assert.match(checkpoint, /Approve HCP-03 Option A and authorize T038-T042 exactly as recorded/u);
  assert.match(checkpoint, /Database application or teardown remains prohibited/u);
});

test("the exact three forward-only migration files exist", () => {
  approvedMigrationPaths();
});

test("the SQL suite contains real catalog, RLS, role, isolation, and leakage assertions", () => {
  const sql = readFileSync(sqlSuitePath, "utf8");
  for (const required of [
    "foundation_migration_ledger",
    "relforcerowsecurity",
    "rolbypassrls",
    "role_table_grants",
    "set_request_context",
    "cross-tenant insert unexpectedly succeeded",
    "transaction-local tenant context leaked",
    "pg_replication_slots",
    "pg_foreign_server",
  ]) {
    assert.ok(sql.includes(required), required);
  }
  assert.doesNotMatch(sql, /\bskip\b/iu);
});

test("migration sources match the approved object and fail-closed boundary", () => {
  validateMigrationSources(approvedMigrationPaths());
});

test("the repaired harness retains all four approved deterministic phases", () => {
  assert.deepEqual(migrationPhases, [
    "empty",
    "representative_prior",
    "interrupted_001_002_then_003",
    "rolling_compatibility_and_forward_recovery",
  ]);
  assertForwardRecoveryBoundary(approvedMigrationPaths());
});

test("four-phase application requires exact runtime amendments and a guarded target", () => {
  const paths = approvedMigrationPaths();
  const attestation = readTargetAttestation();
  attestPostgresTools(attestation);

  resetTarget(attestation);
  createBackup(attestation, "empty");
  for (const path of paths) applyMigration(attestation, path);
  runSqlSuite(attestation);

  resetTarget(attestation);
  createBackup(attestation, "representative_prior");
  applyMigration(attestation, paths[0]!);
  applyMigration(attestation, paths[1]!);
  seedRepresentativePrior(attestation);
  applyMigration(attestation, paths[2]!);
  assertRepresentativePriorSurvived(attestation);

  resetTarget(attestation);
  createBackup(attestation, "interrupted_001_002_then_003_retry");
  applyMigration(attestation, paths[0]!);
  applyMigration(attestation, paths[1]!);
  assertLedgerCount(attestation, 2);
  createBackup(attestation, "interrupted_001_002_then_003");
  applyMigration(attestation, paths[2]!);
  runSqlSuite(attestation);

  resetTarget(attestation);
  createBackup(attestation, "rolling_compatibility_and_forward_recovery");
  applyMigration(attestation, paths[0]!);
  assertRollingCompatibility(attestation, 1);
  applyMigration(attestation, paths[1]!);
  assertRollingCompatibility(attestation, 2);
  applyMigration(attestation, paths[2]!);
  runSqlSuite(attestation);
  assertForwardRecoveryBoundary(paths);
});
