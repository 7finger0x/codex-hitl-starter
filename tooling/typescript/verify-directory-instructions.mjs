import { readFile } from "node:fs/promises";
import process from "node:process";

const commonRequirements = [
  "supplement the root `AGENTS.md`",
  "All root instructions remain in force",
  "obey the stricter rule and stop",
  "exact approval",
];

const files = new Map([
  ["apps/api/AGENTS.md", ["HCP-02", "public contract", "boundary", "Validate all external input"]],
  ["supabase/AGENTS.md", ["HCP-03", "migration", "RLS", "BYPASSRLS", "destructive"]],
  ["infra/AGENTS.md", ["HCP-04", "HCP-07", "production", "secret", "infrastructure"]],
  [
    "tooling/codex-hitl/AGENTS.md",
    ["HCP-05", "shell=False", "engineering policy", "legacy", "secret"],
  ],
]);

const errors = [];
for (const [path, requirements] of files) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    errors.push(`missing instruction file: ${path} (${error.message})`);
    continue;
  }

  const normalized = text.replace(/\s+/g, " ");
  for (const phrase of [...commonRequirements, ...requirements]) {
    if (!normalized.includes(phrase)) {
      errors.push(`${path} is missing required phrase: ${phrase}`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({ result: "pass", files: files.size, rootRulesWeakened: false })}\n`,
  );
}
