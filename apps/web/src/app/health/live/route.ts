import { nowUtc } from "../../../../../../packages/core/src/time";
import type { Health } from "../../../../../../packages/core/src/generated/foundation-contracts";

export async function GET(): Promise<Response> {
  const body: Health = {
    status: "ok",
    service: "foundation-web",
    version: "0.0.0",
    time: nowUtc(),
    checks: { process: "ok" },
  };
  return Response.json(body, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
