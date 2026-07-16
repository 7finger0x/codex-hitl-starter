import { readFile } from "node:fs/promises";
import process from "node:process";

const required = new Map([
  [
    ".gitignore",
    [
      "node_modules/",
      ".venv/",
      "supabase/.temp/",
      "coverage/",
      "playwright-report/",
      "**/.terraform/",
      ".container-cache/",
      ".env.*",
      "!.env.*.example",
    ],
  ],
  [".dockerignore", ["node_modules/", ".venv/", "coverage/", "**/.terraform/", ".env.*"]],
  [".prettierignore", ["node_modules/", "coverage/", "playwright-report/", "pnpm-lock.yaml"]],
  [".npmignore", ["node_modules/", "evidence/", "docs/authority/", ".env.*", "secrets/"]],
]);

const errors = [];
for (const [path, patterns] of required) {
  let lines;
  try {
    lines = new Set(
      (await readFile(path, "utf8"))
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#")),
    );
  } catch (error) {
    errors.push(`missing ignore file: ${path} (${error.message})`);
    continue;
  }
  for (const pattern of patterns) {
    if (!lines.has(pattern)) {
      errors.push(`${path} is missing required pattern: ${pattern}`);
    }
  }
  if (path === ".gitignore") {
    for (const controlled of ["evidence/", "evidence/**", "docs/authority/"]) {
      if (lines.has(controlled)) {
        errors.push(`${path} must not hide controlled path: ${controlled}`);
      }
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({ result: "pass", files: required.size, controlledEvidenceVisible: true })}\n`,
  );
}
