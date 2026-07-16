declare const utcInstantBrand: unique symbol;

export type UtcInstant = string & {
  readonly [utcInstantBrand]: "UtcInstant";
};

const UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function parseUtcInstant(value: unknown): UtcInstant {
  if (typeof value !== "string" || !UTC_INSTANT_PATTERN.test(value)) {
    throw new TypeError("Expected a millisecond-precise UTC instant ending in Z");
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw new TypeError("Expected a valid, normalized UTC instant");
  }
  return value as UtcInstant;
}

export function formatUtcInstant(value: Date | number): UtcInstant {
  const date = typeof value === "number" ? new Date(value) : value;
  if (!(date instanceof Date) || !Number.isFinite(Date.prototype.getTime.call(date))) {
    throw new TypeError("Cannot format an invalid UTC instant");
  }
  return parseUtcInstant(Date.prototype.toISOString.call(date));
}

export function nowUtc(clock: () => number = Date.now): UtcInstant {
  const value = clock();
  if (!Number.isSafeInteger(value)) {
    throw new TypeError("UTC clock must return safe-integer epoch milliseconds");
  }
  return formatUtcInstant(value);
}

export function utcEpochMilliseconds(value: UtcInstant | string): number {
  return new Date(parseUtcInstant(value)).getTime();
}
