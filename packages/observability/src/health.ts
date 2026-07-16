import { nowUtc, type UtcInstant } from "../../core/src/time.js";

export type DependencyHealthStatus = "healthy" | "degraded" | "unhealthy";
export type OverallHealthStatus = DependencyHealthStatus;

export interface DependencyHealthResult {
  readonly status: DependencyHealthStatus;
  readonly code: string;
}

export interface DependencyHealthCheck {
  readonly required: boolean;
  readonly check: (signal: AbortSignal) => DependencyHealthResult | Promise<DependencyHealthResult>;
}

export interface DependencyHealthSnapshot extends DependencyHealthResult {
  readonly name: string;
  readonly required: boolean;
}

export interface LivenessSnapshot {
  readonly status: "healthy";
  readonly live: true;
  readonly checked_at: UtcInstant;
}

export interface ReadinessSnapshot {
  readonly status: OverallHealthStatus;
  readonly ready: boolean;
  readonly checked_at: UtcInstant;
  readonly dependencies: readonly DependencyHealthSnapshot[];
}

export interface HealthRegistryOptions {
  readonly clock?: () => number;
  readonly timeoutMs?: number;
}

const HEALTH_NAME_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;
const HEALTH_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;
const TIMEOUT = Symbol("health-check-timeout");

function validateResult(result: DependencyHealthResult): DependencyHealthResult {
  if (!(["healthy", "degraded", "unhealthy"] as const).includes(result.status)) {
    throw new TypeError("Dependency health status is invalid");
  }
  if (!HEALTH_CODE_PATTERN.test(result.code)) {
    throw new TypeError("Dependency health code must be stable uppercase notation");
  }
  return { status: result.status, code: result.code };
}

async function withTimeout(
  check: DependencyHealthCheck["check"],
  timeoutMs: number,
): Promise<DependencyHealthResult | typeof TIMEOUT> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => check(controller.signal)),
      new Promise<typeof TIMEOUT>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(TIMEOUT);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export class HealthRegistry {
  readonly #checks = new Map<string, DependencyHealthCheck>();
  readonly #clock: () => number;
  readonly #timeoutMs: number;

  constructor(options: HealthRegistryOptions = {}) {
    this.#clock = options.clock ?? Date.now;
    this.#timeoutMs = options.timeoutMs ?? 2_000;
    if (!Number.isInteger(this.#timeoutMs) || this.#timeoutMs < 1 || this.#timeoutMs > 30_000) {
      throw new TypeError("Health timeout must be an integer from 1 through 30000 milliseconds");
    }
  }

  register(name: string, check: DependencyHealthCheck): void {
    if (!HEALTH_NAME_PATTERN.test(name)) {
      throw new TypeError("Dependency health name must use lowercase stable notation");
    }
    if (this.#checks.has(name)) {
      throw new TypeError(`Dependency health check ${name} is already registered`);
    }
    if (typeof check.required !== "boolean" || typeof check.check !== "function") {
      throw new TypeError("Dependency health check requires a boolean classification and function");
    }
    this.#checks.set(name, check);
  }

  liveness(): LivenessSnapshot {
    return {
      status: "healthy",
      live: true,
      checked_at: nowUtc(this.#clock),
    };
  }

  async readiness(): Promise<ReadinessSnapshot> {
    const dependencies: DependencyHealthSnapshot[] = [];
    const orderedChecks = [...this.#checks.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );

    for (const [name, check] of orderedChecks) {
      let result: DependencyHealthResult;
      try {
        const checked = await withTimeout(check.check, this.#timeoutMs);
        result =
          checked === TIMEOUT
            ? { status: "unhealthy", code: "DEPENDENCY_CHECK_TIMEOUT" }
            : validateResult(checked);
      } catch {
        result = { status: "unhealthy", code: "DEPENDENCY_CHECK_FAILED" };
      }
      dependencies.push({ name, required: check.required, ...result });
    }

    const requiredFailure = dependencies.some(
      (dependency) => dependency.required && dependency.status !== "healthy",
    );
    const optionalDegradation = dependencies.some(
      (dependency) => !dependency.required && dependency.status !== "healthy",
    );
    return {
      status: requiredFailure ? "unhealthy" : optionalDegradation ? "degraded" : "healthy",
      ready: !requiredFailure,
      checked_at: nowUtc(this.#clock),
      dependencies,
    };
  }
}
