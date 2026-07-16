import { createHash } from "node:crypto";

export type CanonicalJsonPrimitive = boolean | null | number | string;
export type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

function failure(reason: string): never {
  throw new TypeError(`Value cannot be represented as canonical JSON: ${reason}`);
}

function assertDataDescriptor(descriptor: PropertyDescriptor | undefined): PropertyDescriptor {
  if (descriptor === undefined || "get" in descriptor || "set" in descriptor) {
    return failure("accessor properties are forbidden");
  }
  if (!descriptor.enumerable) {
    return failure("non-enumerable properties are forbidden");
  }
  return descriptor;
}

function serialize(value: unknown, ancestors: Set<object>): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) return failure("numbers must be finite");
      return JSON.stringify(value);
    case "undefined":
    case "bigint":
    case "symbol":
    case "function":
      return failure(`${typeof value} values are forbidden`);
    case "object":
      break;
  }

  if (ancestors.has(value)) return failure("cyclic references are forbidden");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value);
      const expectedKeyCount = value.length + 1;
      if (ownKeys.length !== expectedKeyCount || !ownKeys.includes("length")) {
        return failure("arrays must not have sparse slots or extra properties");
      }

      const parts: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) return failure("sparse arrays are forbidden");
        const descriptor = assertDataDescriptor(
          Object.getOwnPropertyDescriptor(value, String(index)),
        );
        parts.push(serialize(descriptor.value, ancestors));
      }
      return `[${parts.join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      return failure("only plain objects and arrays are supported");
    }

    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key === "symbol")) {
      return failure("symbol properties are forbidden");
    }

    const stringKeys = keys as string[];
    stringKeys.sort();
    const fields = stringKeys.map((key) => {
      const descriptor = assertDataDescriptor(Object.getOwnPropertyDescriptor(value, key));
      return `${JSON.stringify(key)}:${serialize(descriptor.value, ancestors)}`;
    });
    return `{${fields.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

/** Serializes the JSON data model with deterministic recursive key ordering. */
export function canonicalJson(value: unknown): string {
  return serialize(value, new Set());
}

/** Returns a lowercase SHA-256 digest of the canonical UTF-8 representation. */
export function canonicalSha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}
