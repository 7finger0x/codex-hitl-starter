import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(process.cwd());
const composePath = resolve(repositoryRoot, "compose.yaml");
const composeSource = readFileSync(composePath, "utf8");
const expectedComposeSha256 = "e2472ad738ed3279bdcb40ffacd295a243ccc581e530b16c16b901802eee8282";
const expectedCapabilities = ["CHOWN", "DAC_OVERRIDE", "FOWNER", "SETGID", "SETUID"];
const expectedTmpfs = [
  "/tmp:size=64m,mode=1777,nosuid,nodev,noexec",
  "/var/run/postgresql:size=16m,mode=0755,uid=100,gid=101,nosuid,nodev,noexec",
];

function serviceSource(name: string, nextName: string): string {
  const start = composeSource.indexOf(`  ${name}:\n`);
  const end = composeSource.indexOf(`  ${nextName}:\n`, start + 1);
  assert.notEqual(start, -1, `${name} service is missing`);
  assert.notEqual(end, -1, `${nextName} service boundary is missing`);
  return composeSource.slice(start, end);
}

test("Postgres receives only the bounded entrypoint capabilities", () => {
  const postgres = serviceSource("postgres", "auth");
  const expectedBlock = [
    "    cap_add:",
    ...expectedCapabilities.map((capability) => `      - ${capability}`),
  ].join("\n");

  assert.equal((composeSource.match(/^\s{4}cap_add:$/gmu) ?? []).length, 1);
  assert.match(postgres, new RegExp(`${expectedBlock.replaceAll("\n", "\\n")}\\n    tmpfs:`, "u"));
  assert.deepEqual(
    [...postgres.matchAll(/^\s{6}- ([A-Z_]+)$/gmu)].map((match) => match[1]),
    expectedCapabilities,
  );
});

test("Postgres receives the exact writable runtime tmpfs override", () => {
  const postgres = serviceSource("postgres", "auth");
  const expectedBlock = ["    tmpfs:", ...expectedTmpfs.map((entry) => `      - ${entry}`)].join(
    "\n",
  );

  assert.equal((postgres.match(/^\s{4}tmpfs:$/gmu) ?? []).length, 1);
  assert.match(postgres, new RegExp(`${expectedBlock.replaceAll("\n", "\\n")}\\n    image:`, "u"));
  assert.match(postgres, /\/var\/run\/postgresql:size=16m,mode=0755,uid=100,gid=101,nosuid,nodev,noexec/u);
  assert.deepEqual(
    [...postgres.matchAll(/^\s{6}- (.+)$/gmu)]
      .map((match) => match[1])
      .filter((entry) => entry.startsWith("/")),
    expectedTmpfs,
  );
});

test("the repair preserves every surrounding Postgres boundary", () => {
  const postgres = serviceSource("postgres", "auth");
  const sharedSecurity = composeSource.slice(
    composeSource.indexOf("x-runtime-security:"),
    composeSource.indexOf("x-http-health:"),
  );

  assert.match(sharedSecurity, /cap_drop:\n    - ALL/u);
  assert.match(sharedSecurity, /no-new-privileges:true/u);
  assert.match(sharedSecurity, /read_only: true/u);
  assert.match(
    postgres,
    /docker\.io\/supabase\/postgres:17\.6\.1\.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00/u,
  );
  assert.match(postgres, /PGDATA: \/var\/lib\/postgresql\/data\/pgdata/u);
  assert.match(postgres, /foundation_postgres_data:\/var\/lib\/postgresql\/data/u);
  assert.match(postgres, /foundation_data/u);
  assert.match(postgres, /cpus: "2\.00"/u);
  assert.match(postgres, /mem_limit: 2g/u);
  assert.match(postgres, /pg_isready --host 127\.0\.0\.1 --port 5432/u);
  assert.doesNotMatch(postgres, /^\s{4}user:/mu);
  assert.doesNotMatch(postgres, /privileged:/u);
});

test("the approved repair produces the exact reviewed Compose bytes", () => {
  const digest = createHash("sha256").update(composeSource).digest("hex");
  assert.equal(digest, expectedComposeSha256);
});
