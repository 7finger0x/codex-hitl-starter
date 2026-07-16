import capabilityManifestSchema from "../../../../specs/002-platform-foundation/contracts/capability-manifest.schema.json" with { type: "json" };
import domainEventSchema from "../../../../specs/002-platform-foundation/contracts/domain-event.schema.json" with { type: "json" };
import evidenceManifestSchema from "../../../../specs/002-platform-foundation/contracts/evidence-manifest.schema.json" with { type: "json" };
import foundationApi from "../../../../specs/002-platform-foundation/contracts/foundation-api.openapi.json" with { type: "json" };
import platformConfigurationSchema from "../../../../specs/002-platform-foundation/contracts/platform-configuration.schema.json" with { type: "json" };
import traceabilitySchema from "../../../../specs/002-platform-foundation/contracts/traceability.schema.json" with { type: "json" };

export const foundationContracts = {
  capabilityManifestSchema,
  domainEventSchema,
  evidenceManifestSchema,
  foundationApi,
  platformConfigurationSchema,
  traceabilitySchema,
} as const;

export * from "../generated/foundation-contracts.js";
