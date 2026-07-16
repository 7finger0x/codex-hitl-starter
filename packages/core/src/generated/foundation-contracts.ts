// THIS FILE IS GENERATED. DO NOT EDIT.
// Source: HCP-02-approved JSON contracts via scripts/generate-contracts.ts.

export const foundationOperations = [
  {
    method: "GET",
    operationId: "getLiveness",
    path: "/health/live",
  },
  {
    method: "GET",
    operationId: "getReadiness",
    path: "/health/ready",
  },
  {
    method: "GET",
    operationId: "getSession",
    path: "/v1/session",
  },
  {
    method: "PUT",
    operationId: "selectSessionContext",
    path: "/v1/session/context",
  },
  {
    method: "GET",
    operationId: "listTenants",
    path: "/v1/tenants",
  },
  {
    method: "POST",
    operationId: "createTenant",
    path: "/v1/tenants",
  },
  {
    method: "PUT",
    operationId: "replaceMemberRoleAssignments",
    path: "/v1/tenants/{tenantId}/members/{memberId}/role-assignments",
  },
  {
    method: "GET",
    operationId: "getCapabilities",
    path: "/v1/capabilities",
  },
  {
    method: "POST",
    operationId: "createConfigurationVersion",
    path: "/v1/configuration-versions",
  },
  {
    method: "POST",
    operationId: "activateConfigurationVersion",
    path: "/v1/configuration-versions/{versionId}/activate",
  },
  {
    method: "GET",
    operationId: "searchAuditEvents",
    path: "/v1/audit-events",
  },
  {
    method: "POST",
    operationId: "createAuditExport",
    path: "/v1/audit-exports",
  },
  {
    method: "GET",
    operationId: "listMemberships",
    path: "/v1/tenants/{tenantId}/members",
  },
  {
    method: "PATCH",
    operationId: "updateMembership",
    path: "/v1/tenants/{tenantId}/members/{memberId}",
  },
  {
    method: "GET",
    operationId: "listInvitations",
    path: "/v1/tenants/{tenantId}/invitations",
  },
  {
    method: "POST",
    operationId: "createInvitation",
    path: "/v1/tenants/{tenantId}/invitations",
  },
  {
    method: "POST",
    operationId: "acceptInvitation",
    path: "/v1/invitations/{invitationId}/accept",
  },
  {
    method: "POST",
    operationId: "revokeInvitation",
    path: "/v1/tenants/{tenantId}/invitations/{invitationId}/revoke",
  },
  {
    method: "GET",
    operationId: "listPermissions",
    path: "/v1/permissions",
  },
  {
    method: "GET",
    operationId: "listRoles",
    path: "/v1/tenants/{tenantId}/roles",
  },
  {
    method: "POST",
    operationId: "createRole",
    path: "/v1/tenants/{tenantId}/roles",
  },
  {
    method: "GET",
    operationId: "getRole",
    path: "/v1/tenants/{tenantId}/roles/{roleId}",
  },
  {
    method: "PATCH",
    operationId: "updateRole",
    path: "/v1/tenants/{tenantId}/roles/{roleId}",
  },
  {
    method: "GET",
    operationId: "listEnvironments",
    path: "/v1/tenants/{tenantId}/environments",
  },
  {
    method: "POST",
    operationId: "createEnvironment",
    path: "/v1/tenants/{tenantId}/environments",
  },
  {
    method: "GET",
    operationId: "getEnvironment",
    path: "/v1/tenants/{tenantId}/environments/{environmentId}",
  },
  {
    method: "PATCH",
    operationId: "updateEnvironment",
    path: "/v1/tenants/{tenantId}/environments/{environmentId}",
  },
  {
    method: "GET",
    operationId: "listServiceIdentities",
    path: "/v1/tenants/{tenantId}/service-identities",
  },
  {
    method: "POST",
    operationId: "createServiceIdentity",
    path: "/v1/tenants/{tenantId}/service-identities",
  },
  {
    method: "GET",
    operationId: "getServiceIdentity",
    path: "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}",
  },
  {
    method: "PATCH",
    operationId: "updateServiceIdentity",
    path: "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}",
  },
  {
    method: "POST",
    operationId: "issueServiceCredential",
    path: "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials",
  },
  {
    method: "POST",
    operationId: "revokeServiceCredential",
    path: "/v1/tenants/{tenantId}/service-identities/{serviceIdentityId}/credentials/{credentialId}/revoke",
  },
  {
    method: "GET",
    operationId: "listSupportAccessRequests",
    path: "/v1/support-access-requests",
  },
  {
    method: "POST",
    operationId: "createSupportAccessRequest",
    path: "/v1/support-access-requests",
  },
  {
    method: "GET",
    operationId: "getSupportAccessRequest",
    path: "/v1/support-access-requests/{requestId}",
  },
  {
    method: "POST",
    operationId: "grantSupportAccess",
    path: "/v1/support-access-requests/{requestId}/grant",
  },
  {
    method: "POST",
    operationId: "denySupportAccess",
    path: "/v1/support-access-requests/{requestId}/deny",
  },
  {
    method: "GET",
    operationId: "listSupportAccessGrants",
    path: "/v1/support-access-grants",
  },
  {
    method: "POST",
    operationId: "revokeSupportAccess",
    path: "/v1/support-access-grants/{grantId}/revoke",
  },
  {
    method: "GET",
    operationId: "listEvidenceRuns",
    path: "/v1/evidence-runs",
  },
  {
    method: "POST",
    operationId: "startEvidenceRun",
    path: "/v1/evidence-runs",
  },
  {
    method: "GET",
    operationId: "getEvidenceRun",
    path: "/v1/evidence-runs/{runId}",
  },
  {
    method: "GET",
    operationId: "listCapabilityDefinitions",
    path: "/v1/capability-definitions",
  },
  {
    method: "POST",
    operationId: "registerCapabilityDefinition",
    path: "/v1/capability-definitions",
  },
  {
    method: "GET",
    operationId: "getCapabilityDefinition",
    path: "/v1/capability-definitions/{capabilityId}",
  },
  {
    method: "GET",
    operationId: "getCapabilityExposures",
    path: "/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures",
  },
  {
    method: "PUT",
    operationId: "replaceCapabilityExposures",
    path: "/v1/tenants/{tenantId}/environments/{environmentId}/capability-exposures",
  },
] as const;

export type FoundationOperation = (typeof foundationOperations)[number];
export type FoundationOperationId = FoundationOperation["operationId"];
export type FoundationHttpMethod = FoundationOperation["method"];

export const contractSourceSha256 = {
  foundationApi: "a923218bd0a2093d1d05ad65d7576bafd8828ff89eb6941b2605e52b540810cc",
  domainEvent: "219754d7e785d5dbf861e16f1fe8c6751c8f6c25bd4a1eff8fb1b5600a192812",
  capabilityManifest: "6e6ebae61c85aa13d6eb6c62630ffedf7cd9bb666b64446a175aa0bf475a1a37",
  platformConfiguration: "346d5b7d1c12f8dbfbf5c68ab5b2657807673c35384138769df271c8d104a936",
  evidenceManifest: "49152b5b461c1a0bc14e1ed6024b072fe599364dfe5ef44cf1e98cbf253aa901",
  traceability: "eec08c72b379d6ec99997c93619a00b54dc2e516ae8fda9c613d0d53eabc211f",
} as const;

export type OperationMetadata = {
  readonly correlation_id: string;
  readonly audit_event_id: string;
  readonly version: number;
  readonly warnings: ReadonlyArray<string>;
};

export type PageMetadata = {
  readonly next_cursor: string | null;
  readonly has_more: boolean;
  readonly limit: number;
};

export type ReasonRequest = {
  readonly reason: string;
};

export type ResourceScope = {
  readonly resource_types: ReadonlyArray<string>;
  readonly resource_ids: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
};

export type Membership = {
  readonly id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly status: "invited" | "active" | "suspended" | "removed";
  readonly role_ids: ReadonlyArray<string>;
  readonly environment_ids: ReadonlyArray<string>;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type MembershipPage = {
  readonly items: ReadonlyArray<Membership>;
  readonly page: PageMetadata;
};

export type UpdateMembershipRequest = {
  readonly status?: "active" | "suspended" | "removed";
  readonly role_ids?: ReadonlyArray<string>;
  readonly environment_ids?: ReadonlyArray<string>;
  readonly reason: string;
};

export type AcceptInvitationRequest = {
  readonly invitation_proof: string;
};

export type InvitationPage = {
  readonly items: ReadonlyArray<Invitation>;
  readonly page: PageMetadata;
};

export type Permission = {
  readonly id: string;
  readonly code: string;
  readonly resource_type: string;
  readonly action: string;
  readonly sensitivity: "low" | "standard" | "high" | "critical";
  readonly description: string;
};

export type PermissionPage = {
  readonly items: ReadonlyArray<Permission>;
  readonly page: PageMetadata;
};

export type RoleEffect = {
  readonly permission_code: string;
  readonly effect: "allow" | "deny";
  readonly conditions: {
    readonly environment_ids?: ReadonlyArray<string>;
    readonly team_ids?: ReadonlyArray<string>;
    readonly resource_ids?: ReadonlyArray<string>;
  };
};

export type Role = {
  readonly id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly description: string;
  readonly status: "active" | "retired";
  readonly effects: ReadonlyArray<RoleEffect>;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type RolePage = {
  readonly items: ReadonlyArray<Role>;
  readonly page: PageMetadata;
};

export type CreateRoleRequest = {
  readonly name: string;
  readonly description: string;
  readonly effects: ReadonlyArray<RoleEffect>;
  readonly reason: string;
};

export type UpdateRoleRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly status?: "active" | "retired";
  readonly effects?: ReadonlyArray<RoleEffect>;
  readonly reason: string;
};

export type TenantEnvironment = {
  readonly id: string;
  readonly tenant_id: string;
  readonly code: string;
  readonly kind: "sandbox" | "paper" | "staging" | "production" | "custom";
  readonly execution_mode: "observe" | "simulate" | "execute";
  readonly status: "active" | "suspended" | "archived";
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type EnvironmentPage = {
  readonly items: ReadonlyArray<TenantEnvironment>;
  readonly page: PageMetadata;
};

export type CreateEnvironmentRequest = {
  readonly code: string;
  readonly kind: "sandbox" | "paper" | "staging" | "production" | "custom";
  readonly execution_mode: "observe" | "simulate" | "execute";
  readonly reason: string;
};

export type UpdateEnvironmentRequest = {
  readonly execution_mode?: "observe" | "simulate" | "execute";
  readonly status?: "active" | "suspended" | "archived";
  readonly reason: string;
};

export type ServiceIdentity = {
  readonly id: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly name: string;
  readonly owner_id: string;
  readonly scope: ResourceScope;
  readonly status: "active" | "suspended" | "revoked" | "expired";
  readonly expires_at: string;
  readonly credential_prefixes: ReadonlyArray<string>;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type ServiceIdentityPage = {
  readonly items: ReadonlyArray<ServiceIdentity>;
  readonly page: PageMetadata;
};

export type CreateServiceIdentityRequest = {
  readonly name: string;
  readonly owner_id: string;
  readonly scope: ResourceScope;
  readonly expires_at: string;
  readonly reason: string;
};

export type UpdateServiceIdentityRequest = {
  readonly name?: string;
  readonly scope?: ResourceScope;
  readonly status?: "active" | "suspended" | "revoked";
  readonly expires_at?: string;
  readonly reason: string;
};

export type IssueServiceCredentialRequest = {
  readonly expires_at: string;
  readonly reason: string;
};

export type ServiceCredentialIssued = {
  readonly credential_id: string;
  readonly prefix: string;
  readonly one_time_credential: string;
  readonly expires_at: string;
  readonly metadata: OperationMetadata;
};

export type SupportAccessRequest = {
  readonly id: string;
  readonly support_principal_id: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly resource_scope: ResourceScope;
  readonly reason: string;
  readonly step_up_evidence_id: string;
  readonly starts_at: string;
  readonly expires_at: string;
  readonly status: "pending" | "granted" | "denied" | "expired" | "revoked";
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type SupportAccessRequestPage = {
  readonly items: ReadonlyArray<SupportAccessRequest>;
  readonly page: PageMetadata;
};

export type CreateSupportAccessRequest = {
  readonly support_principal_id: string;
  readonly resource_scope: ResourceScope;
  readonly reason: string;
  readonly step_up_evidence_id: string;
  readonly starts_at: string;
  readonly expires_at: string;
};

export type GrantSupportAccessRequest = {
  readonly issuer_id: string;
  readonly reason: string;
  readonly expires_at: string;
};

export type SupportAccessGrant = {
  readonly id: string;
  readonly request_id: string;
  readonly support_principal_id: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly resource_scope: ResourceScope;
  readonly issuer_id: string;
  readonly starts_at: string;
  readonly expires_at: string;
  readonly status: "active" | "expired" | "revoked";
  readonly audit_reference: string;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type SupportAccessGrantPage = {
  readonly items: ReadonlyArray<SupportAccessGrant>;
  readonly page: PageMetadata;
};

export type EvidenceRun = {
  readonly id: string;
  readonly source_revision: string;
  readonly worktree_state: "clean" | "documented-dirty";
  readonly check_profile: "foundation" | "control-plane" | "full";
  readonly scope: "tenant_environment" | "repository";
  readonly requester_id: string;
  readonly status:
    "queued" | "running" | "complete_pass" | "complete_fail" | "incomplete" | "cancelled";
  readonly started_at: string;
  readonly completed_at: string | null;
  readonly manifest_reference: string | null;
  readonly manifest_sha256: string | null;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type EvidenceRunPage = {
  readonly items: ReadonlyArray<EvidenceRun>;
  readonly page: PageMetadata;
};

export type StartEvidenceRunRequest = {
  readonly source_revision: string;
  readonly worktree_state: "clean" | "documented-dirty";
  readonly check_profile: "foundation" | "control-plane" | "full";
  readonly scope: "tenant_environment" | "repository";
};

export type CapabilityDefinitionPage = {
  readonly items: ReadonlyArray<CapabilityDefinition>;
  readonly page: PageMetadata;
};

export type CapabilityExposure = {
  readonly capability_id: string;
  readonly enabled: boolean;
  readonly policy_version_id: string;
  readonly configuration_version_id: string;
};

export type CapabilityExposureSet = {
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly exposures: ReadonlyArray<CapabilityExposure>;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type ReplaceCapabilityExposuresRequest = {
  readonly exposures: ReadonlyArray<CapabilityExposure>;
  readonly reason: string;
};

export type Health = {
  readonly status: "ok" | "degraded" | "unavailable";
  readonly service: string;
  readonly version: string;
  readonly time: string;
  readonly checks: Readonly<Record<string, "ok" | "degraded" | "unavailable">>;
};

export type Tenant = {
  readonly id: string;
  readonly name: string;
  readonly type:
    | "individual"
    | "team"
    | "coaching"
    | "enterprise"
    | "hermes_operator"
    | "hybrid"
    | "platform_internal";
  readonly status: "provisioning" | "active" | "suspended" | "closed";
  readonly version: number;
};

export type CreateTenantRequest = {
  readonly name: string;
  readonly type:
    | "individual"
    | "team"
    | "coaching"
    | "enterprise"
    | "hermes_operator"
    | "hybrid"
    | "platform_internal";
  readonly default_timezone: string;
  readonly base_currency: string;
  readonly default_environment: "sandbox" | "paper";
};

export type CreateTenantResponse = {
  readonly tenant: Tenant;
  readonly membership_id: string;
  readonly environment_id: string;
  readonly audit_event_id: string;
  readonly correlation_id: string;
};

export type Session = {
  readonly session_id: string;
  readonly user_id: string;
  readonly authentication_strength: "single_factor" | "multi_factor" | "phishing_resistant";
  readonly active_tenant_id?: string | null;
  readonly active_environment_id?: string | null;
  readonly tenant_contexts: ReadonlyArray<{
    readonly tenant_id: string;
    readonly membership_id: string;
    readonly environments: ReadonlyArray<string>;
  }>;
};

export type SelectContextRequest = {
  readonly tenant_id: string;
  readonly environment_id: string;
};

export type ContextSelection = {
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly membership_version: number;
  readonly capability_manifest: Readonly<Record<string, unknown>>;
};

export type CreateInvitationRequest = {
  readonly email: string;
  readonly role_ids: ReadonlyArray<string>;
  readonly environment_ids: ReadonlyArray<string>;
  readonly expires_in_seconds?: number;
};

export type Invitation = {
  readonly id: string;
  readonly tenant_id: string;
  readonly target_hint: string;
  readonly status: "pending" | "accepted" | "expired" | "revoked";
  readonly expires_at: string;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type RoleAssignmentRequest = {
  readonly assignments: ReadonlyArray<{
    readonly role_id: string;
    readonly environment_id: string;
    readonly resource_scope: Readonly<Record<string, unknown>>;
  }>;
  readonly reason: string;
};

export type MemberAccess = {
  readonly member_id: string;
  readonly version: number;
  readonly assignments: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly audit_event_id: string;
};

export type RegisterCapabilityRequest = {
  readonly code: string;
  readonly required_permissions: ReadonlyArray<string>;
  readonly routes: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
  readonly schema_version: number;
};

export type CapabilityDefinition = {
  readonly id: string;
  readonly code: string;
  readonly required_permissions: ReadonlyArray<string>;
  readonly routes: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
  readonly schema_version: number;
  readonly version: number;
  readonly metadata: OperationMetadata;
};

export type ConfigurationVersionRequest = {
  readonly configuration_set_id: string;
  readonly schema_id: string;
  readonly schema_version: number;
  readonly values: Readonly<Record<string, unknown>>;
  readonly reason: string;
};

export type ConfigurationVersion = {
  readonly id: string;
  readonly version: number;
  readonly status:
    | "draft"
    | "in_review"
    | "approved"
    | "scheduled"
    | "effective"
    | "superseded"
    | "retired"
    | "rejected";
  readonly content_sha256: string;
  readonly validation: "valid" | "invalid" | "incompatible";
  readonly audit_event_id?: string | null;
};

export type ActivationRequest = {
  readonly reason: string;
  readonly approval_request_id?: string | null;
};

export type AuditEvent = {
  readonly id: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly occurred_at: string;
  readonly actor: Readonly<Record<string, unknown>>;
  readonly action: string;
  readonly resource: Readonly<Record<string, unknown>>;
  readonly decision: Readonly<Record<string, unknown>>;
  readonly correlation_id: string;
  readonly outcome: "succeeded" | "failed" | "denied";
};

export type AuditExportRequest = {
  readonly from: string;
  readonly to: string;
  readonly format: "jsonl" | "csv";
  readonly filters?: Readonly<Record<string, unknown>>;
};

export type AuditExport = {
  readonly id: string;
  readonly status: "queued" | "running" | "complete" | "failed";
  readonly manifest_sha256: string | null;
  readonly artifact_reference?: string | null;
  readonly audit_event_id: string;
};

export type ErrorResponse = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly correlation_id: string;
    readonly retryable: boolean;
    readonly retry_guidance: string;
    readonly details?: {
      readonly field?: string;
      readonly reason_code?: string;
      readonly retry_after_seconds?: number;
    };
  };
};

export type DomainEvent = {
  readonly event_id: string;
  readonly event_type: string;
  readonly schema_version: number;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly producer: {
    readonly service: string;
    readonly version: string;
  };
  readonly subject: {
    readonly type: string;
    readonly id: string;
    readonly version: number;
  };
  readonly actor: {
    readonly type: "user" | "service" | "system";
    readonly id: string;
    readonly session_id?: string | null;
  };
  readonly correlation_id: string;
  readonly causation_id: string | null;
  readonly idempotency_key: string;
  readonly occurred_at: string;
  readonly published_at?: string | null;
  readonly trace_context: {
    readonly traceparent: string;
    readonly tracestate?: string | null;
  };
  readonly provenance?: {
    readonly source?: string;
    readonly source_reference?: string | null;
  };
  readonly data: Readonly<Record<string, unknown>>;
};

export type CapabilityManifest = {
  readonly manifest_id: string;
  readonly tenant_id: string;
  readonly environment_id: string;
  readonly principal_id: string;
  readonly membership_version: number;
  readonly policy_version: number;
  readonly configuration_version: number;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly capabilities: ReadonlyArray<{
    readonly code: string;
    readonly routes: ReadonlyArray<string>;
    readonly actions: ReadonlyArray<string>;
    readonly constraints?: Readonly<Record<string, unknown>>;
  }>;
  readonly signature: {
    readonly algorithm: "EdDSA";
    readonly key_id: string;
    readonly value: string;
  };
};

export type PlatformConfiguration = {
  readonly schema_version: 1;
  readonly capabilities: {
    readonly enabled: ReadonlyArray<string>;
  };
  readonly session: {
    readonly idle_timeout_seconds: number;
    readonly absolute_timeout_seconds: number;
    readonly step_up_max_age_seconds: number;
  };
  readonly audit: {
    readonly fail_closed_actions: ReadonlyArray<string>;
    readonly export_retention_days: number;
  };
  readonly events: {
    readonly lease_seconds: number;
    readonly max_attempts: number;
    readonly base_retry_seconds: number;
  };
  readonly limits: {
    readonly api_requests_per_minute: number;
    readonly audit_export_rows: number;
  };
  readonly secret_references?: Readonly<Record<string, string>>;
};

export type EvidenceManifest = Readonly<Record<string, unknown>> &
  Readonly<Record<string, unknown>>;

export type TraceabilityGraph = Readonly<Record<string, unknown>>;
