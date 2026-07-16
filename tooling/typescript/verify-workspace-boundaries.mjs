import { readdir, readFile } from "node:fs/promises";
import process from "node:process";

const expected = new Map([
  ["apps/api", "@ai-trading-os/api"],
  ["apps/web", "@ai-trading-os/web"],
  ["apps/workers", "@ai-trading-os/workers"],
  ["packages/audit", "@ai-trading-os/audit"],
  ["packages/config", "@ai-trading-os/config"],
  ["packages/core", "@ai-trading-os/core"],
  ["packages/events", "@ai-trading-os/events"],
  ["packages/identity", "@ai-trading-os/identity"],
  ["packages/observability", "@ai-trading-os/observability"],
  ["packages/policy", "@ai-trading-os/policy"],
  ["packages/testing", "@ai-trading-os/testing"],
  ["packages/ui", "@ai-trading-os/ui"],
]);

const approvedOptionalFields = new Map([
  [
    "apps/api",
    {
      scripts: {
        dev: "node --import tsx src/app.ts",
        test: "node --import tsx --test src/app.test.ts",
        typecheck: "tsc --noEmit --project tsconfig.json",
      },
      dependencies: {
        "@fastify/type-provider-typebox": "5.2.0",
        "@sinclair/typebox": "0.34.49",
        fastify: "5.10.0",
      },
    },
  ],
  [
    "apps/web",
    {
      scripts: {
        build: "next build",
        dev: "next dev --hostname 0.0.0.0 --port 3000",
        start: "next start --hostname 0.0.0.0 --port 3000",
        test: "node --import tsx --test src/components/platform-shell.test.tsx",
        typecheck: "tsc --noEmit --project tsconfig.json",
      },
      dependencies: {
        next: "16.2.10",
        react: "19.2.7",
        "react-dom": "19.2.7",
      },
      devDependencies: {
        "@types/react": "19.2.17",
        "@types/react-dom": "19.2.3",
      },
    },
  ],
  [
    "apps/workers",
    {
      scripts: {
        dev: "node --import tsx src/main.ts",
        test: "node --import tsx --test src/worker.test.ts",
        typecheck: "tsc --noEmit --project tsconfig.json",
      },
    },
  ],
  [
    "packages/core",
    {
      exports: {
        ".": "./src/contracts/index.ts",
        "./contracts": "./src/contracts/index.ts",
        "./generated": "./src/generated/foundation-contracts.ts",
      },
      scripts: {
        "generate:contracts": "node --import tsx scripts/generate-contracts.ts",
        "check:contracts": "node --import tsx scripts/generate-contracts.ts --check",
        typecheck: "tsc --noEmit --project tsconfig.json",
      },
    },
  ],
  [
    "packages/testing",
    {
      scripts: {
        "test:contracts": "node --import tsx --test src/contracts/foundation-contracts.test.ts",
        typecheck: "tsc --noEmit --project tsconfig.json",
      },
    },
  ],
]);

const baseManifestKeys = new Set([
  "name",
  "version",
  "private",
  "description",
  "license",
  "type",
  "engines",
]);

function canonical(value) {
  return JSON.stringify(value, Object.keys(value ?? {}).sort());
}

const errors = [];

for (const root of ["apps", "packages"]) {
  let actualDirectories = [];
  try {
    actualDirectories = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${root}/${entry.name}`)
      .sort();
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const expectedDirectories = [...expected.keys()].filter((path) => path.startsWith(`${root}/`));
  for (const path of actualDirectories) {
    if (!expected.has(path)) {
      errors.push(`unexpected workspace directory: ${path}`);
    }
  }
  for (const path of expectedDirectories) {
    if (!actualDirectories.includes(path)) {
      errors.push(`missing workspace directory: ${path}`);
    }
  }
}

for (const [path, expectedName] of expected) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(`${path}/package.json`, "utf8"));
  } catch (error) {
    errors.push(`invalid or missing manifest: ${path}/package.json (${error.message})`);
    continue;
  }

  const required = {
    name: expectedName,
    version: "0.0.0",
    private: true,
    license: "UNLICENSED",
    type: "module",
  };
  for (const [key, value] of Object.entries(required)) {
    if (manifest[key] !== value) {
      errors.push(`${path}/package.json must set ${key}=${JSON.stringify(value)}`);
    }
  }
  if (manifest.engines?.node !== "24.18.0" || manifest.engines?.pnpm !== "11.11.0") {
    errors.push(`${path}/package.json must pin the approved Node and pnpm engines`);
  }
  if (typeof manifest.description !== "string" || manifest.description.length === 0) {
    errors.push(`${path}/package.json must describe its approved ownership boundary`);
  }
  const approved = approvedOptionalFields.get(path) ?? {};
  for (const key of Object.keys(manifest)) {
    if (!baseManifestKeys.has(key) && !Object.hasOwn(approved, key)) {
      errors.push(`${path}/package.json declares unapproved key ${key}`);
    }
  }
  for (const [key, value] of Object.entries(approved)) {
    if (canonical(manifest[key]) !== canonical(value)) {
      errors.push(`${path}/package.json must set ${key}=${JSON.stringify(value)}`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({ result: "pass", workspaces: expected.size, approvedDirectDependencies: 8 })}\n`,
  );
}
