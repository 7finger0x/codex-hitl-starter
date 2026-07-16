import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { format } from "prettier";

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonObject | JsonPrimitive | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const featureContractDirectory = resolve(repositoryRoot, "specs/002-platform-foundation/contracts");
const generatedPath = resolve(
  repositoryRoot,
  "packages/core/src/generated/foundation-contracts.ts",
);
const sourceManifestPath = resolve(
  repositoryRoot,
  "packages/core/src/contracts/contract-sources.json",
);
const checkOnly = process.argv.slice(2).includes("--check");

const sources = [
  ["foundationApi", "foundation-api.openapi.json"],
  ["domainEvent", "domain-event.schema.json"],
  ["capabilityManifest", "capability-manifest.schema.json"],
  ["platformConfiguration", "platform-configuration.schema.json"],
  ["evidenceManifest", "evidence-manifest.schema.json"],
  ["traceability", "traceability.schema.json"],
] as const;

function asObject(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as JsonObject;
}

function asString(value: JsonValue | undefined, label: string): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`);
  return value;
}

function parseJson(path: string): JsonObject {
  return asObject(JSON.parse(readFileSync(path, "utf8")), path);
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function resolvePointer(document: JsonObject, reference: string): JsonValue {
  if (!reference.startsWith("#/")) {
    throw new Error(`Only internal approved references can be generated: ${reference}`);
  }
  let current: JsonValue = document;
  for (const encoded of reference.slice(2).split("/")) {
    const token = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    const object = asObject(current, reference);
    if (!(token in object)) throw new Error(`Unresolved reference: ${reference}`);
    current = object[token] as JsonValue;
  }
  return current;
}

function union(values: string[]): string {
  return [...new Set(values)].join(" | ");
}

function renderType(schemaValue: JsonValue, document: JsonObject, depth = 0): string {
  if (typeof schemaValue === "boolean") return schemaValue ? "unknown" : "never";
  const schema = asObject(schemaValue, "schema");
  if (typeof schema.$ref === "string") {
    const reference = schema.$ref;
    const match = /^#\/components\/schemas\/([A-Za-z_][A-Za-z0-9_]*)$/.exec(reference);
    if (match?.[1]) return match[1];
    return renderType(resolvePointer(document, reference), document, depth);
  }
  if (Array.isArray(schema.enum)) {
    return union(schema.enum.map((value) => JSON.stringify(value)));
  }
  if ("const" in schema) return JSON.stringify(schema.const);
  for (const keyword of ["oneOf", "anyOf"] as const) {
    if (Array.isArray(schema[keyword])) {
      return union(schema[keyword].map((value) => renderType(value, document, depth)));
    }
  }
  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map((value) => renderType(value, document, depth)).join(" & ");
  }
  if (Array.isArray(schema.type)) {
    return union(
      schema.type.map((type) => {
        const narrowed: JsonObject = { ...schema, type };
        delete narrowed.enum;
        delete narrowed.oneOf;
        return renderType(narrowed, document, depth);
      }),
    );
  }
  if (schema.type === "array") {
    const item = schema.items ?? {};
    return `ReadonlyArray<${renderType(item, document, depth)}>`;
  }
  if (schema.type === "null") return "null";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "string") return "string";

  const properties =
    schema.properties === undefined ? undefined : asObject(schema.properties, "properties");
  if (properties !== undefined) {
    const required = new Set(
      Array.isArray(schema.required)
        ? schema.required.map((value) => asString(value, "required property"))
        : [],
    );
    const indent = "  ".repeat(depth + 1);
    const closingIndent = "  ".repeat(depth);
    const lines = Object.entries(properties).map(([name, property]) => {
      const optional = required.has(name) ? "" : "?";
      return `${indent}readonly ${JSON.stringify(name)}${optional}: ${renderType(property, document, depth + 1)};`;
    });
    return `{\n${lines.join("\n")}\n${closingIndent}}`;
  }
  if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) {
    const valueType =
      schema.additionalProperties === true
        ? "unknown"
        : renderType(schema.additionalProperties, document, depth);
    return `Readonly<Record<string, ${valueType}>>`;
  }
  return "Readonly<Record<string, unknown>>";
}

function operationInventory(api: JsonObject): Array<{
  readonly method: string;
  readonly operationId: string;
  readonly path: string;
}> {
  const methods = new Set(["delete", "get", "head", "options", "patch", "post", "put"]);
  const inventory: Array<{ method: string; operationId: string; path: string }> = [];
  for (const [path, rawPath] of Object.entries(asObject(api.paths, "OpenAPI paths"))) {
    for (const [method, rawOperation] of Object.entries(asObject(rawPath, path))) {
      if (!methods.has(method)) continue;
      const operation = asObject(rawOperation, `${method} ${path}`);
      inventory.push({
        method: method.toUpperCase(),
        operationId: asString(operation.operationId, `${method} ${path} operationId`),
        path,
      });
    }
  }
  return inventory;
}

async function generateBindings(documents: Readonly<Record<string, JsonObject>>): Promise<string> {
  const api = documents.foundationApi;
  if (api === undefined) throw new Error("foundation API source is missing");
  const schemas = asObject(asObject(api.components, "components").schemas, "schemas");
  const declarations = Object.entries(schemas)
    .map(([name, schema]) => `export type ${name} = ${renderType(schema, api)};`)
    .join("\n\n");
  const standalone = [
    ["DomainEvent", "domainEvent"],
    ["CapabilityManifest", "capabilityManifest"],
    ["PlatformConfiguration", "platformConfiguration"],
    ["EvidenceManifest", "evidenceManifest"],
    ["TraceabilityGraph", "traceability"],
  ] as const;
  const rootDeclarations = standalone
    .map(([typeName, key]) => {
      const document = documents[key];
      if (document === undefined) throw new Error(`${key} source is missing`);
      return `export type ${typeName} = ${renderType(document, document)};`;
    })
    .join("\n\n");
  const hashes = Object.fromEntries(
    sources.map(([key, filename]) => [key, sha256(resolve(featureContractDirectory, filename))]),
  );
  const unformatted = `// THIS FILE IS GENERATED. DO NOT EDIT.\n// Source: HCP-02-approved JSON contracts via scripts/generate-contracts.ts.\n\nexport const foundationOperations = ${JSON.stringify(operationInventory(api), null, 2)} as const;\n\nexport type FoundationOperation = (typeof foundationOperations)[number];\nexport type FoundationOperationId = FoundationOperation["operationId"];\nexport type FoundationHttpMethod = FoundationOperation["method"];\n\nexport const contractSourceSha256 = ${JSON.stringify(hashes, null, 2)} as const;\n\n${declarations}\n\n${rootDeclarations}\n`;
  return format(unformatted, {
    endOfLine: "lf",
    parser: "typescript",
    printWidth: 100,
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "all",
  });
}

function generateSourceManifest(): string {
  const manifest = {
    schema_version: 1,
    authority: "HCP-02 approved Option A",
    authority_record: "specs/002-platform-foundation/checkpoints/HCP-02-public-contracts.md",
    sources: sources.map(([kind, filename]) => ({
      kind,
      path: `specs/002-platform-foundation/contracts/${filename}`,
      sha256: sha256(resolve(featureContractDirectory, filename)),
    })),
    historical_exclusions: [
      "specs/002-platform-foundation/contracts/openapi.yaml",
      "specs/002-platform-foundation/contracts/event-envelope.schema.json",
    ],
    external_publication: false,
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

const documents = Object.fromEntries(
  sources.map(([key, filename]) => [key, parseJson(resolve(featureContractDirectory, filename))]),
);
const expectedBindings = await generateBindings(documents);
const expectedManifest = generateSourceManifest();

if (checkOnly) {
  const generatedArtifacts: Array<readonly [string, string]> = [
    [generatedPath, expectedBindings],
    [sourceManifestPath, expectedManifest],
  ];
  const mismatches = generatedArtifacts.filter(
    ([path, expected]) => !existsSync(path) || readFileSync(path, "utf8") !== expected,
  );
  if (mismatches.length > 0) {
    for (const [path] of mismatches) process.stderr.write(`generated contract drift: ${path}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("generated contracts: current\n");
  }
} else {
  mkdirSync(dirname(generatedPath), { recursive: true });
  mkdirSync(dirname(sourceManifestPath), { recursive: true });
  writeFileSync(generatedPath, expectedBindings, "utf8");
  writeFileSync(sourceManifestPath, expectedManifest, "utf8");
  process.stdout.write("generated contracts: updated\n");
}
