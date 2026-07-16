import { randomBytes as nodeRandomBytes } from "node:crypto";

declare const uuidV7Brand: unique symbol;
declare const resourceVersionBrand: unique symbol;

export type UuidV7<Entity extends string = "UuidV7"> = string & {
  readonly [uuidV7Brand]: Entity;
};

export type ResourceVersion = number & {
  readonly [resourceVersionBrand]: "ResourceVersion";
};

export interface UuidV7GeneratorOptions {
  readonly clock?: () => number;
  readonly randomBytes?: (length: number) => Uint8Array;
}

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_UUID_TIMESTAMP = 0xffff_ffff_ffff;
const RANDOM_BITS = 74n;
const MAX_RANDOM_COUNTER = (1n << RANDOM_BITS) - 1n;
const RANDOM_B_MASK = (1n << 62n) - 1n;

function validateTimestamp(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_UUID_TIMESTAMP) {
    throw new RangeError(
      "UUIDv7 clock must return a non-negative millisecond timestamp within 48 bits",
    );
  }
  return value;
}

function randomCounter(source: (length: number) => Uint8Array): bigint {
  const bytes = source(10);
  if (!(bytes instanceof Uint8Array) || bytes.length !== 10) {
    throw new TypeError("UUIDv7 random source must return exactly the requested byte count");
  }

  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value & MAX_RANDOM_COUNTER;
}

function encodeUuidV7(timestamp: number, counter: bigint): UuidV7 {
  const bytes = new Uint8Array(16);
  let remainingTimestamp = BigInt(timestamp);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(remainingTimestamp & 0xffn);
    remainingTimestamp >>= 8n;
  }

  const randomA = Number(counter >> 62n);
  const randomB = counter & RANDOM_B_MASK;
  bytes[6] = 0x70 | (randomA >> 8);
  bytes[7] = randomA & 0xff;
  bytes[8] = 0x80 | Number((randomB >> 56n) & 0x3fn);
  for (let index = 9; index <= 15; index += 1) {
    const shift = BigInt((15 - index) * 8);
    bytes[index] = Number((randomB >> shift) & 0xffn);
  }

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as UuidV7;
}

/**
 * Creates a monotonic UUIDv7 generator. Calls made within one millisecond, or
 * while the wall clock moves backwards, advance the 74-bit random field.
 */
export function createUuidV7Generator(
  options: UuidV7GeneratorOptions = {},
): <Entity extends string = "UuidV7">() => UuidV7<Entity> {
  const clock = options.clock ?? Date.now;
  const entropy = options.randomBytes ?? ((length) => nodeRandomBytes(length));
  let lastTimestamp = -1;
  let lastCounter = -1n;

  return <Entity extends string = "UuidV7">(): UuidV7<Entity> => {
    const observedTimestamp = validateTimestamp(clock());

    if (observedTimestamp > lastTimestamp) {
      lastTimestamp = observedTimestamp;
      lastCounter = randomCounter(entropy);
    } else if (lastCounter < MAX_RANDOM_COUNTER) {
      lastCounter += 1n;
    } else {
      if (lastTimestamp >= MAX_UUID_TIMESTAMP) {
        throw new RangeError("UUIDv7 monotonic state exhausted at the maximum timestamp");
      }
      lastTimestamp += 1;
      lastCounter = randomCounter(entropy);
    }

    return encodeUuidV7(lastTimestamp, lastCounter) as UuidV7<Entity>;
  };
}

const defaultUuidV7Generator = createUuidV7Generator();

export function createUuidV7<Entity extends string = "UuidV7">(): UuidV7<Entity> {
  return defaultUuidV7Generator<Entity>();
}

export function isUuidV7(value: unknown): value is UuidV7 {
  return typeof value === "string" && UUID_V7_PATTERN.test(value);
}

export function parseUuidV7<Entity extends string = "UuidV7">(value: unknown): UuidV7<Entity> {
  if (!isUuidV7(value)) {
    throw new TypeError("Expected a canonical lowercase UUIDv7 value");
  }
  return value as UuidV7<Entity>;
}

export function uuidV7Timestamp(value: UuidV7 | string): number {
  const uuid = parseUuidV7(value);
  return Number.parseInt(uuid.slice(0, 13).replace("-", ""), 16);
}

export function parseResourceVersion(value: unknown): ResourceVersion {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new TypeError("Expected a positive, safe-integer resource version");
  }
  return value as ResourceVersion;
}

export function nextResourceVersion(current: ResourceVersion): ResourceVersion {
  if (current >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Resource version has reached the maximum safe integer");
  }
  return parseResourceVersion(current + 1);
}
