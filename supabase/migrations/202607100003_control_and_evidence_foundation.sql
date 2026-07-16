-- T041 / HCP-03 Option A: additive control and evidence foundation.
-- Apply only through the separately approved guarded PostgreSQL 17 path.
-- The caller supplies migration_sha256 from this exact source file.

create table platform.capability_definitions (
  id uuid primary key,
  code text not null unique,
  route_pattern text not null,
  action text not null,
  permission_id uuid not null references platform.permissions (id) on delete restrict,
  status text not null default 'active',
  description text not null,
  created_at timestamptz not null default transaction_timestamp(),
  constraint capability_definitions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint capability_definitions__code_shape
    check (char_length(code) between 3 and 128 and code ~ '^[a-z][a-z0-9_.-]*$'),
  constraint capability_definitions__route_shape
    check (char_length(route_pattern) between 1 and 512 and route_pattern = btrim(route_pattern)),
  constraint capability_definitions__action_shape
    check (char_length(action) between 1 and 128 and action ~ '^[a-z][a-z0-9_.-]*$'),
  constraint capability_definitions__status check (status in ('active', 'disabled', 'retired')),
  constraint capability_definitions__description_shape
    check (char_length(description) between 1 and 2000)
);

create table platform.policy_sets (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  family text not null,
  active_version_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, family),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint policy_sets__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint policy_sets__family_shape
    check (char_length(family) between 1 and 128 and family ~ '^[a-z][a-z0-9_.-]*$'),
  constraint policy_sets__status check (status in ('active', 'archived')),
  constraint policy_sets__version_positive check (version >= 1)
);

create table platform.policy_versions (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  policy_set_id uuid not null,
  version_number integer not null,
  schema_version text not null,
  content jsonb not null,
  content_sha256 text not null,
  authored_by uuid not null references platform.users (id) on delete restrict,
  reviewed_by uuid references platform.users (id) on delete restrict,
  status text not null default 'draft',
  effective_at timestamptz,
  superseded_by_id uuid,
  source_reference text,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, policy_set_id, version_number),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, policy_set_id)
    references platform.policy_sets (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, superseded_by_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  constraint policy_versions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint policy_versions__version_number check (version_number >= 1),
  constraint policy_versions__schema_version_shape
    check (char_length(schema_version) between 1 and 64 and schema_version ~ '^[A-Za-z0-9._-]+$'),
  constraint policy_versions__content
    check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 1048576),
  constraint policy_versions__content_sha256 check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint policy_versions__status
    check (status in ('draft', 'in_review', 'approved', 'scheduled', 'effective', 'superseded', 'retired', 'rejected')),
  constraint policy_versions__effective_time
    check (status not in ('effective', 'superseded', 'retired') or effective_at is not null),
  constraint policy_versions__source_reference_shape
    check (source_reference is null or char_length(source_reference) between 1 and 512)
);

alter table platform.policy_sets
  add constraint policy_sets__active_version
  foreign key (tenant_id, environment_id, active_version_id)
  references platform.policy_versions (tenant_id, environment_id, id)
  on delete restrict;

create table platform.policy_rules (
  tenant_id uuid not null,
  environment_id uuid not null,
  policy_version_id uuid not null,
  id uuid not null,
  rule_code text not null,
  priority integer not null,
  effect text not null,
  conditions jsonb not null,
  reason_code text not null,
  approval_requirement jsonb,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, policy_version_id, id),
  unique (tenant_id, environment_id, policy_version_id, rule_code),
  foreign key (tenant_id, environment_id, policy_version_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  constraint policy_rules__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint policy_rules__code_shape
    check (char_length(rule_code) between 1 and 128 and rule_code ~ '^[a-z][a-z0-9_.-]*$'),
  constraint policy_rules__priority check (priority between -1000000 and 1000000),
  constraint policy_rules__effect check (effect in ('allow', 'require_approval', 'deny')),
  constraint policy_rules__conditions
    check (jsonb_typeof(conditions) = 'object' and octet_length(conditions::text) <= 65536),
  constraint policy_rules__reason_code_shape
    check (char_length(reason_code) between 1 and 128 and reason_code ~ '^[A-Z][A-Z0-9_]*$'),
  constraint policy_rules__approval_requirement
    check (
      approval_requirement is null
      or (jsonb_typeof(approval_requirement) = 'object' and octet_length(approval_requirement::text) <= 32768)
    )
);

create table platform.configuration_sets (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  family text not null,
  active_version_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, family),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint configuration_sets__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint configuration_sets__family_shape
    check (char_length(family) between 1 and 128 and family ~ '^[a-z][a-z0-9_.-]*$'),
  constraint configuration_sets__status check (status in ('active', 'archived')),
  constraint configuration_sets__version_positive check (version >= 1)
);

create table platform.secret_references (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  provider text not null,
  path_identifier text not null,
  purpose text not null,
  owner_membership_id uuid not null,
  classification text not null,
  status text not null default 'active',
  rotated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, id),
  unique (tenant_id, environment_id, provider, path_identifier),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_membership_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint secret_references__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint secret_references__provider_shape
    check (char_length(provider) between 1 and 128 and provider ~ '^[a-z][a-z0-9_.-]*$'),
  constraint secret_references__path_identifier_shape
    check (
      char_length(path_identifier) between 1 and 512
      and path_identifier = btrim(path_identifier)
      and path_identifier !~ '[[:cntrl:][:space:]]'
    ),
  constraint secret_references__purpose_shape check (char_length(purpose) between 1 and 500),
  constraint secret_references__classification
    check (classification in ('sandbox', 'paper', 'staging', 'production', 'custom')),
  constraint secret_references__status check (status in ('active', 'rotating', 'revoked', 'expired')),
  constraint secret_references__state_time check (status <> 'revoked' or revoked_at is not null),
  constraint secret_references__version_positive check (version >= 1)
);

create table platform.configuration_versions (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  configuration_set_id uuid not null,
  version_number integer not null,
  schema_id text not null,
  schema_version text not null,
  canonical_content jsonb not null,
  content_sha256 text not null,
  authored_by uuid not null references platform.users (id) on delete restrict,
  validation_status text not null,
  compatibility_status text not null,
  approval_status text not null,
  status text not null default 'draft',
  secret_reference_ids jsonb not null default '[]'::jsonb,
  effective_at timestamptz,
  superseded_by_id uuid,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, configuration_set_id, version_number),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, configuration_set_id)
    references platform.configuration_sets (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, superseded_by_id)
    references platform.configuration_versions (tenant_id, environment_id, id) on delete restrict,
  constraint configuration_versions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint configuration_versions__version_number check (version_number >= 1),
  constraint configuration_versions__schema_id_shape
    check (char_length(schema_id) between 1 and 256 and schema_id ~ '^[A-Za-z0-9._:/-]+$'),
  constraint configuration_versions__schema_version_shape
    check (char_length(schema_version) between 1 and 64 and schema_version ~ '^[A-Za-z0-9._-]+$'),
  constraint configuration_versions__content
    check (jsonb_typeof(canonical_content) = 'object' and octet_length(canonical_content::text) <= 1048576),
  constraint configuration_versions__content_sha256 check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint configuration_versions__validation_status check (validation_status in ('valid', 'invalid')),
  constraint configuration_versions__compatibility_status
    check (compatibility_status in ('compatible', 'incompatible')),
  constraint configuration_versions__approval_status
    check (approval_status in ('not_required', 'pending', 'approved', 'rejected')),
  constraint configuration_versions__status
    check (status in ('draft', 'in_review', 'approved', 'scheduled', 'effective', 'superseded', 'retired', 'rejected')),
  constraint configuration_versions__activation_guard
    check (
      status not in ('effective', 'superseded', 'retired')
      or (
        effective_at is not null
        and validation_status = 'valid'
        and compatibility_status = 'compatible'
        and approval_status in ('not_required', 'approved')
      )
    ),
  constraint configuration_versions__secret_reference_ids
    check (jsonb_typeof(secret_reference_ids) = 'array' and octet_length(secret_reference_ids::text) <= 32768)
);

alter table platform.configuration_sets
  add constraint configuration_sets__active_version
  foreign key (tenant_id, environment_id, active_version_id)
  references platform.configuration_versions (tenant_id, environment_id, id)
  on delete restrict;

create table platform.capability_exposures (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  capability_definition_id uuid not null references platform.capability_definitions (id) on delete restrict,
  exposure_version integer not null,
  policy_version_id uuid,
  configuration_version_id uuid,
  conditions jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  effective_at timestamptz,
  superseded_by_id uuid,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, capability_definition_id, exposure_version),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, policy_version_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, configuration_version_id)
    references platform.configuration_versions (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, superseded_by_id)
    references platform.capability_exposures (tenant_id, environment_id, id) on delete restrict,
  constraint capability_exposures__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint capability_exposures__version check (exposure_version >= 1),
  constraint capability_exposures__conditions
    check (jsonb_typeof(conditions) = 'object' and octet_length(conditions::text) <= 32768),
  constraint capability_exposures__status
    check (status in ('draft', 'approved', 'scheduled', 'effective', 'superseded', 'retired', 'rejected')),
  constraint capability_exposures__effective_time
    check (status not in ('effective', 'superseded', 'retired') or effective_at is not null)
);

create table platform.approval_requests (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  principal_id uuid not null,
  principal_type text not null,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  resource_version integer not null,
  request_sha256 text not null,
  policy_version_id uuid,
  policy_sha256 text not null,
  reason text not null,
  required_approver_scope jsonb not null,
  authentication_strength text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, policy_version_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  constraint approval_requests__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint approval_requests__principal_type
    check (principal_type in ('user', 'service', 'support', 'system')),
  constraint approval_requests__action_shape
    check (char_length(action) between 1 and 128 and action ~ '^[a-z][a-z0-9_.-]*$'),
  constraint approval_requests__resource_type_shape
    check (char_length(resource_type) between 1 and 64 and resource_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint approval_requests__resource_version check (resource_version >= 1),
  constraint approval_requests__request_sha256 check (request_sha256 ~ '^[0-9a-f]{64}$'),
  constraint approval_requests__policy_sha256 check (policy_sha256 ~ '^[0-9a-f]{64}$'),
  constraint approval_requests__reason_shape check (char_length(reason) between 1 and 2000),
  constraint approval_requests__approver_scope
    check (
      jsonb_typeof(required_approver_scope) = 'object'
      and octet_length(required_approver_scope::text) <= 32768
    ),
  constraint approval_requests__authentication_strength_shape
    check (
      char_length(authentication_strength) between 1 and 64
      and authentication_strength ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint approval_requests__status
    check (status in ('pending', 'approved', 'denied', 'change_requested', 'revoked', 'expired', 'consumed')),
  constraint approval_requests__expiry check (expires_at > created_at),
  constraint approval_requests__version_positive check (version >= 1)
);

create table platform.approval_actions (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  approval_request_id uuid not null,
  action text not null,
  actor_id uuid not null,
  actor_type text not null,
  reason text not null,
  correlation_id uuid not null,
  occurred_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, approval_request_id)
    references platform.approval_requests (tenant_id, environment_id, id) on delete restrict,
  constraint approval_actions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint approval_actions__action
    check (action in ('approve', 'deny', 'request_change', 'revoke', 'expire')),
  constraint approval_actions__actor_type
    check (actor_type in ('user', 'service', 'support', 'system')),
  constraint approval_actions__reason_shape check (char_length(reason) between 1 and 2000)
);

create table platform.support_access_grants (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  support_principal_id uuid not null,
  resource_scope jsonb not null,
  reason text not null,
  step_up_evidence_reference text not null,
  issued_by uuid not null references platform.users (id) on delete restrict,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint support_access_grants__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint support_access_grants__scope
    check (jsonb_typeof(resource_scope) = 'object' and octet_length(resource_scope::text) <= 32768),
  constraint support_access_grants__reason_shape check (char_length(reason) between 1 and 2000),
  constraint support_access_grants__step_up_reference_shape
    check (char_length(step_up_evidence_reference) between 1 and 512),
  constraint support_access_grants__time_order
    check (expires_at > starts_at and (revoked_at is null or revoked_at >= starts_at)),
  constraint support_access_grants__status
    check (status in ('active', 'revoked', 'expired')),
  constraint support_access_grants__state_time check (status <> 'revoked' or revoked_at is not null),
  constraint support_access_grants__version_positive check (version >= 1)
);

create table platform.authorization_decisions (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  principal_id uuid not null,
  principal_type text not null,
  user_id uuid references platform.users (id) on delete restrict,
  permission_id uuid not null references platform.permissions (id) on delete restrict,
  resource_type text not null,
  resource_id uuid not null,
  resource_version integer not null,
  canonical_input_sha256 text not null,
  membership_version integer,
  role_versions jsonb not null default '[]'::jsonb,
  configuration_version_id uuid,
  policy_version_id uuid,
  approval_request_id uuid,
  authentication_strength text not null,
  matched_rules jsonb not null,
  decision text not null,
  reason_codes text[] not null,
  correlation_id uuid not null,
  trace_id text not null,
  occurred_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, configuration_version_id)
    references platform.configuration_versions (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, policy_version_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, approval_request_id)
    references platform.approval_requests (tenant_id, environment_id, id) on delete restrict,
  constraint authorization_decisions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint authorization_decisions__principal_type
    check (principal_type in ('user', 'service', 'support', 'system')),
  constraint authorization_decisions__resource_type_shape
    check (char_length(resource_type) between 1 and 64 and resource_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint authorization_decisions__resource_version check (resource_version >= 1),
  constraint authorization_decisions__input_sha256
    check (canonical_input_sha256 ~ '^[0-9a-f]{64}$'),
  constraint authorization_decisions__membership_version
    check (membership_version is null or membership_version >= 1),
  constraint authorization_decisions__role_versions
    check (jsonb_typeof(role_versions) = 'array' and octet_length(role_versions::text) <= 32768),
  constraint authorization_decisions__authentication_strength_shape
    check (
      char_length(authentication_strength) between 1 and 64
      and authentication_strength ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint authorization_decisions__matched_rules
    check (jsonb_typeof(matched_rules) = 'array' and octet_length(matched_rules::text) <= 65536),
  constraint authorization_decisions__decision
    check (decision in ('allow', 'require_approval', 'deny')),
  constraint authorization_decisions__reason_codes
    check (
      cardinality(reason_codes) between 1 and 128
      and array_position(reason_codes, null) is null
      and octet_length(array_to_string(reason_codes, ',')) <= 8192
    ),
  constraint authorization_decisions__trace_id_shape
    check (char_length(trace_id) between 1 and 128 and trace_id ~ '^[A-Za-z0-9_-]+$')
);

create table platform.audit_events (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  actor_type text not null,
  actor_id uuid not null,
  user_id uuid references platform.users (id) on delete restrict,
  session_id uuid references platform.session_records (id) on delete restrict,
  service_identity_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  resource_version integer,
  reason text not null,
  correlation_id uuid not null,
  trace_id text not null,
  authorization_decision_id uuid,
  policy_version_id uuid,
  policy_sha256 text not null,
  request_sha256 text not null,
  outcome text not null,
  reason_code text not null,
  error_code text,
  before_reference text,
  after_reference text,
  schema_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default transaction_timestamp(),
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, service_identity_id)
    references platform.service_identities (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, authorization_decision_id)
    references platform.authorization_decisions (tenant_id, environment_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, policy_version_id)
    references platform.policy_versions (tenant_id, environment_id, id) on delete restrict,
  constraint audit_events__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint audit_events__actor_type check (actor_type in ('user', 'service', 'support', 'system')),
  constraint audit_events__action_shape
    check (char_length(action) between 1 and 128 and action ~ '^[a-z][a-z0-9_.-]*$'),
  constraint audit_events__resource_type_shape
    check (char_length(resource_type) between 1 and 64 and resource_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint audit_events__resource_version check (resource_version is null or resource_version >= 1),
  constraint audit_events__reason_shape check (char_length(reason) between 1 and 2000),
  constraint audit_events__trace_id_shape
    check (char_length(trace_id) between 1 and 128 and trace_id ~ '^[A-Za-z0-9_-]+$'),
  constraint audit_events__policy_sha256 check (policy_sha256 ~ '^[0-9a-f]{64}$'),
  constraint audit_events__request_sha256 check (request_sha256 ~ '^[0-9a-f]{64}$'),
  constraint audit_events__outcome check (outcome in ('success', 'failure', 'denied')),
  constraint audit_events__reason_code_shape
    check (char_length(reason_code) between 1 and 128 and reason_code ~ '^[A-Z][A-Z0-9_]*$'),
  constraint audit_events__error_code_shape
    check (error_code is null or (char_length(error_code) between 1 and 128 and error_code ~ '^[A-Z][A-Z0-9_]*$')),
  constraint audit_events__reference_shapes
    check (
      (before_reference is null or char_length(before_reference) between 1 and 512)
      and (after_reference is null or char_length(after_reference) between 1 and 512)
    ),
  constraint audit_events__schema_version_shape
    check (char_length(schema_version) between 1 and 64 and schema_version ~ '^[A-Za-z0-9._-]+$'),
  constraint audit_events__metadata
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 65536)
);

create table platform.idempotency_records (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  principal_id uuid not null,
  command_type text not null,
  idempotency_key text not null,
  request_sha256 text not null,
  result_reference text,
  status text not null default 'in_progress',
  expires_at timestamptz not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, principal_id, command_type, idempotency_key),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint idempotency_records__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint idempotency_records__command_type_shape
    check (char_length(command_type) between 1 and 128 and command_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint idempotency_records__key_shape
    check (char_length(idempotency_key) between 8 and 256 and idempotency_key !~ '[[:cntrl:][:space:]]'),
  constraint idempotency_records__request_sha256 check (request_sha256 ~ '^[0-9a-f]{64}$'),
  constraint idempotency_records__result_reference_shape
    check (result_reference is null or char_length(result_reference) between 1 and 512),
  constraint idempotency_records__status
    check (status in ('in_progress', 'completed', 'failed', 'expired')),
  constraint idempotency_records__expiry check (expires_at > created_at),
  constraint idempotency_records__version_positive check (version >= 1)
);

create table platform.outbox_events (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  event_id uuid not null,
  event_type text not null,
  event_version integer not null,
  producer text not null,
  subject_type text not null,
  subject_id uuid not null,
  actor_type text not null,
  actor_id uuid not null,
  correlation_id uuid not null,
  causation_id uuid,
  occurred_at timestamptz not null,
  idempotency_key text not null,
  trace_context text not null,
  payload jsonb not null,
  payload_sha256 text not null,
  state text not null default 'pending',
  lease_owner text,
  lease_expires_at timestamptz,
  delivery_attempt_count integer not null default 0,
  published_at timestamptz,
  reconciled_at timestamptz,
  last_error_code text,
  next_attempt_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, event_id),
  unique (tenant_id, environment_id, idempotency_key),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint outbox_events__ids_uuidv7
    check (
      id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and event_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint outbox_events__event_type_shape
    check (char_length(event_type) between 3 and 128 and event_type ~ '^[a-z][a-z0-9_.-]*\.v[1-9][0-9]*$'),
  constraint outbox_events__event_version check (event_version >= 1),
  constraint outbox_events__producer_shape
    check (char_length(producer) between 1 and 128 and producer ~ '^[a-z][a-z0-9_.-]*$'),
  constraint outbox_events__subject_type_shape
    check (char_length(subject_type) between 1 and 64 and subject_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint outbox_events__actor_type check (actor_type in ('user', 'service', 'support', 'system')),
  constraint outbox_events__idempotency_key_shape
    check (char_length(idempotency_key) between 8 and 256 and idempotency_key !~ '[[:cntrl:][:space:]]'),
  constraint outbox_events__trace_context_shape
    check (char_length(trace_context) between 1 and 512),
  constraint outbox_events__payload
    check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1048576),
  constraint outbox_events__payload_sha256 check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  constraint outbox_events__state
    check (state in ('pending', 'leased', 'published', 'uncertain', 'reconciled', 'dead_letter')),
  constraint outbox_events__lease_pair
    check ((lease_owner is null) = (lease_expires_at is null)),
  constraint outbox_events__attempt_count check (delivery_attempt_count >= 0),
  constraint outbox_events__last_error_code_shape
    check (
      last_error_code is null
      or (char_length(last_error_code) between 1 and 128 and last_error_code ~ '^[A-Z][A-Z0-9_]*$')
    ),
  constraint outbox_events__version_positive check (version >= 1)
);

create table platform.inbox_receipts (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  consumer text not null,
  idempotency_key text not null,
  event_id uuid not null,
  payload_sha256 text not null,
  first_seen_at timestamptz not null default transaction_timestamp(),
  last_seen_at timestamptz not null default transaction_timestamp(),
  result_reference text,
  status text not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (consumer, tenant_id, idempotency_key),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint inbox_receipts__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint inbox_receipts__consumer_shape
    check (char_length(consumer) between 1 and 128 and consumer ~ '^[a-z][a-z0-9_.-]*$'),
  constraint inbox_receipts__key_shape
    check (char_length(idempotency_key) between 8 and 256 and idempotency_key !~ '[[:cntrl:][:space:]]'),
  constraint inbox_receipts__payload_sha256 check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  constraint inbox_receipts__time_order check (last_seen_at >= first_seen_at),
  constraint inbox_receipts__result_reference_shape
    check (result_reference is null or char_length(result_reference) between 1 and 512),
  constraint inbox_receipts__status check (status in ('received', 'processed', 'failed', 'conflict')),
  constraint inbox_receipts__version_positive check (version >= 1)
);

create table platform.delivery_attempts (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  outbox_event_id uuid not null,
  target text not null,
  attempt_number integer not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  outcome text not null,
  error_code text,
  error_message text,
  trace_id text not null,
  next_retry_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, outbox_event_id, target, attempt_number),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, outbox_event_id)
    references platform.outbox_events (tenant_id, environment_id, id) on delete restrict,
  constraint delivery_attempts__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint delivery_attempts__target_shape
    check (char_length(target) between 1 and 256 and target = btrim(target)),
  constraint delivery_attempts__attempt_number check (attempt_number >= 1),
  constraint delivery_attempts__time_order check (completed_at is null or completed_at >= started_at),
  constraint delivery_attempts__outcome
    check (outcome in ('published', 'failed', 'uncertain', 'reconciled', 'dead_letter')),
  constraint delivery_attempts__error_code_shape
    check (error_code is null or (char_length(error_code) between 1 and 128 and error_code ~ '^[A-Z][A-Z0-9_]*$')),
  constraint delivery_attempts__error_message_shape
    check (error_message is null or char_length(error_message) between 1 and 2000),
  constraint delivery_attempts__trace_id_shape
    check (char_length(trace_id) between 1 and 128 and trace_id ~ '^[A-Za-z0-9_-]+$')
);

create table platform.jobs (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  job_type text not null,
  job_version integer not null,
  payload_reference text not null,
  payload_sha256 text not null,
  unique_key text not null,
  priority integer not null default 0,
  state text not null default 'pending',
  lease_owner text,
  lease_expires_at timestamptz,
  progress jsonb not null default '{}'::jsonb,
  correlation_id uuid not null,
  trace_id text not null,
  scheduled_at timestamptz not null default transaction_timestamp(),
  cancelled_at timestamptz,
  attempt_count integer not null default 0,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, job_type, unique_key),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint jobs__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint jobs__type_shape
    check (char_length(job_type) between 1 and 128 and job_type ~ '^[a-z][a-z0-9_.-]*$'),
  constraint jobs__job_version check (job_version >= 1),
  constraint jobs__payload_reference_shape
    check (char_length(payload_reference) between 1 and 512 and payload_reference !~ '[[:cntrl:][:space:]]'),
  constraint jobs__payload_sha256 check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  constraint jobs__unique_key_shape
    check (char_length(unique_key) between 8 and 256 and unique_key !~ '[[:cntrl:][:space:]]'),
  constraint jobs__priority check (priority between -1000000 and 1000000),
  constraint jobs__state
    check (state in ('pending', 'leased', 'running', 'succeeded', 'failed', 'cancelled', 'abandoned')),
  constraint jobs__lease_pair check ((lease_owner is null) = (lease_expires_at is null)),
  constraint jobs__progress
    check (jsonb_typeof(progress) = 'object' and octet_length(progress::text) <= 32768),
  constraint jobs__trace_id_shape
    check (char_length(trace_id) between 1 and 128 and trace_id ~ '^[A-Za-z0-9_-]+$'),
  constraint jobs__attempt_count check (attempt_count >= 0),
  constraint jobs__version_positive check (version >= 1)
);

create table platform.job_attempts (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  job_id uuid not null,
  attempt_number integer not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  outcome text not null,
  error_code text,
  error_message text,
  trace_id text not null,
  result_reference text,
  next_retry_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, id),
  unique (tenant_id, environment_id, job_id, attempt_number),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, job_id)
    references platform.jobs (tenant_id, environment_id, id) on delete restrict,
  constraint job_attempts__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint job_attempts__attempt_number check (attempt_number >= 1),
  constraint job_attempts__time_order check (completed_at is null or completed_at >= started_at),
  constraint job_attempts__outcome
    check (outcome in ('succeeded', 'failed', 'cancelled', 'abandoned')),
  constraint job_attempts__error_code_shape
    check (error_code is null or (char_length(error_code) between 1 and 128 and error_code ~ '^[A-Z][A-Z0-9_]*$')),
  constraint job_attempts__error_message_shape
    check (error_message is null or char_length(error_message) between 1 and 2000),
  constraint job_attempts__trace_id_shape
    check (char_length(trace_id) between 1 and 128 and trace_id ~ '^[A-Za-z0-9_-]+$'),
  constraint job_attempts__result_reference_shape
    check (result_reference is null or char_length(result_reference) between 1 and 512)
);

create table platform.evidence_manifests (
  id uuid primary key,
  scope_type text not null,
  tenant_id uuid,
  environment_id uuid,
  source_revision text not null,
  worktree_classification text not null,
  policy_hashes jsonb not null default '{}'::jsonb,
  configuration_hashes jsonb not null default '{}'::jsonb,
  lock_hashes jsonb not null default '{}'::jsonb,
  generator_version text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  checks jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  failures jsonb not null default '[]'::jsonb,
  artifacts jsonb not null default '[]'::jsonb,
  status text not null default 'collecting',
  created_at timestamptz not null default transaction_timestamp(),
  foreign key (tenant_id) references platform.tenants (id) on delete restrict,
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  constraint evidence_manifests__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint evidence_manifests__scope
    check (
      (scope_type = 'repository' and tenant_id is null and environment_id is null)
      or (scope_type = 'tenant' and tenant_id is not null and environment_id is not null)
    ),
  constraint evidence_manifests__source_revision_shape
    check (source_revision ~ '^[0-9a-f]{40,64}$'),
  constraint evidence_manifests__worktree_classification
    check (worktree_classification in ('clean', 'documented_dirty')),
  constraint evidence_manifests__hash_documents
    check (
      jsonb_typeof(policy_hashes) = 'object'
      and jsonb_typeof(configuration_hashes) = 'object'
      and jsonb_typeof(lock_hashes) = 'object'
      and octet_length(policy_hashes::text) <= 65536
      and octet_length(configuration_hashes::text) <= 65536
      and octet_length(lock_hashes::text) <= 65536
    ),
  constraint evidence_manifests__generator_version_shape
    check (char_length(generator_version) between 1 and 128),
  constraint evidence_manifests__time_order
    check (completed_at is null or completed_at >= started_at),
  constraint evidence_manifests__documents
    check (
      jsonb_typeof(checks) = 'array'
      and jsonb_typeof(warnings) = 'array'
      and jsonb_typeof(failures) = 'array'
      and jsonb_typeof(artifacts) = 'array'
      and octet_length(checks::text) <= 1048576
      and octet_length(warnings::text) <= 262144
      and octet_length(failures::text) <= 262144
      and octet_length(artifacts::text) <= 1048576
    ),
  constraint evidence_manifests__status
    check (status in ('collecting', 'complete_pass', 'complete_fail', 'incomplete')),
  constraint evidence_manifests__completion_time
    check (status = 'collecting' or completed_at is not null)
);

create table platform.audit_exports (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  environment_id uuid,
  filter_document jsonb not null,
  requested_by uuid not null references platform.users (id) on delete restrict,
  requested_at timestamptz not null default transaction_timestamp(),
  produced_at timestamptz,
  row_count bigint,
  schema_version text not null,
  artifact_reference text,
  artifact_sha256 text,
  integrity_metadata jsonb not null default '{}'::jsonb,
  classification text not null,
  expires_at timestamptz not null,
  audit_event_id uuid,
  status text not null default 'pending',
  primary key (tenant_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id, audit_event_id)
    references platform.audit_events (tenant_id, environment_id, id) on delete restrict,
  constraint audit_exports__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint audit_exports__environment_audit_pair
    check ((environment_id is null) = (audit_event_id is null)),
  constraint audit_exports__filter
    check (jsonb_typeof(filter_document) = 'object' and octet_length(filter_document::text) <= 65536),
  constraint audit_exports__row_count check (row_count is null or row_count >= 0),
  constraint audit_exports__schema_version_shape
    check (char_length(schema_version) between 1 and 64 and schema_version ~ '^[A-Za-z0-9._-]+$'),
  constraint audit_exports__artifact_pair
    check ((artifact_reference is null) = (artifact_sha256 is null)),
  constraint audit_exports__artifact_reference_shape
    check (artifact_reference is null or char_length(artifact_reference) between 1 and 512),
  constraint audit_exports__artifact_sha256
    check (artifact_sha256 is null or artifact_sha256 ~ '^[0-9a-f]{64}$'),
  constraint audit_exports__integrity_metadata
    check (jsonb_typeof(integrity_metadata) = 'object' and octet_length(integrity_metadata::text) <= 65536),
  constraint audit_exports__classification
    check (classification in ('internal', 'confidential', 'restricted')),
  constraint audit_exports__expiry check (expires_at > requested_at),
  constraint audit_exports__status
    check (status in ('pending', 'running', 'complete', 'failed', 'expired'))
);

create table platform.deployment_records (
  id uuid primary key,
  deployment_environment text not null,
  source_revision text not null,
  artifact_digest text not null,
  migration_versions jsonb not null,
  configuration_versions jsonb not null,
  actor_ci_identity text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  health_result text not null,
  recovery_reference text not null,
  evidence_manifest_id uuid not null references platform.evidence_manifests (id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  constraint deployment_records__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint deployment_records__environment
    check (deployment_environment in ('local', 'preview', 'development')),
  constraint deployment_records__source_revision_shape
    check (source_revision ~ '^[0-9a-f]{40,64}$'),
  constraint deployment_records__artifact_digest_shape
    check (artifact_digest ~ '^sha256:[0-9a-f]{64}$'),
  constraint deployment_records__version_documents
    check (
      jsonb_typeof(migration_versions) = 'array'
      and jsonb_typeof(configuration_versions) = 'array'
      and octet_length(migration_versions::text) <= 65536
      and octet_length(configuration_versions::text) <= 65536
    ),
  constraint deployment_records__actor_shape
    check (char_length(actor_ci_identity) between 1 and 256),
  constraint deployment_records__time_order
    check (completed_at is null or completed_at >= started_at),
  constraint deployment_records__health_result
    check (health_result in ('pending', 'healthy', 'degraded', 'failed')),
  constraint deployment_records__recovery_reference_shape
    check (char_length(recovery_reference) between 1 and 512)
);

create trigger policy_sets__touch_version
before update on platform.policy_sets
for each row execute function platform_private.touch_versioned_row();

create trigger approval_requests__touch_version
before update on platform.approval_requests
for each row execute function platform_private.touch_versioned_row();

create trigger support_access_grants__touch_version
before update on platform.support_access_grants
for each row execute function platform_private.touch_versioned_row();

create trigger configuration_sets__touch_version
before update on platform.configuration_sets
for each row execute function platform_private.touch_versioned_row();

create trigger secret_references__touch_version
before update on platform.secret_references
for each row execute function platform_private.touch_versioned_row();

create trigger idempotency_records__touch_version
before update on platform.idempotency_records
for each row execute function platform_private.touch_versioned_row();

create trigger outbox_events__touch_version
before update on platform.outbox_events
for each row execute function platform_private.touch_versioned_row();

create trigger inbox_receipts__touch_version
before update on platform.inbox_receipts
for each row execute function platform_private.touch_versioned_row();

create trigger jobs__touch_version
before update on platform.jobs
for each row execute function platform_private.touch_versioned_row();

create trigger authorization_decisions__append_only
before update or delete on platform.authorization_decisions
for each row execute function platform_private.reject_row_mutation();

create trigger approval_actions__append_only
before update or delete on platform.approval_actions
for each row execute function platform_private.reject_row_mutation();

create trigger audit_events__append_only
before update or delete on platform.audit_events
for each row execute function platform_private.reject_row_mutation();

create trigger delivery_attempts__append_only
before update or delete on platform.delivery_attempts
for each row execute function platform_private.reject_row_mutation();

create trigger job_attempts__append_only
before update or delete on platform.job_attempts
for each row execute function platform_private.reject_row_mutation();

create trigger policy_versions__published_immutable
before update or delete on platform.policy_versions
for each row execute function platform_private.protect_published_version();

create trigger policy_rules__published_immutable
before update or delete on platform.policy_rules
for each row execute function platform_private.protect_published_version();

create trigger configuration_versions__published_immutable
before update or delete on platform.configuration_versions
for each row execute function platform_private.protect_published_version();

create trigger capability_exposures__published_immutable
before update or delete on platform.capability_exposures
for each row execute function platform_private.protect_published_version();

create trigger outbox_events__payload_immutable
before update or delete on platform.outbox_events
for each row execute function platform_private.protect_outbox_payload();

create trigger evidence_manifests__completed_immutable
before update or delete on platform.evidence_manifests
for each row execute function platform_private.protect_completed_evidence();

create trigger secret_references__environment_guard
before insert or update on platform.secret_references
for each row execute function platform_private.guard_secret_reference_environment();

create trigger configuration_versions__environment_guard
before insert or update on platform.configuration_versions
for each row execute function platform_private.guard_secret_reference_environment();

alter table platform.policy_sets enable row level security;
alter table platform.policy_sets force row level security;
alter table platform.policy_versions enable row level security;
alter table platform.policy_versions force row level security;
alter table platform.policy_rules enable row level security;
alter table platform.policy_rules force row level security;
alter table platform.capability_exposures enable row level security;
alter table platform.capability_exposures force row level security;
alter table platform.approval_requests enable row level security;
alter table platform.approval_requests force row level security;
alter table platform.approval_actions enable row level security;
alter table platform.approval_actions force row level security;
alter table platform.support_access_grants enable row level security;
alter table platform.support_access_grants force row level security;
alter table platform.authorization_decisions enable row level security;
alter table platform.authorization_decisions force row level security;
alter table platform.configuration_sets enable row level security;
alter table platform.configuration_sets force row level security;
alter table platform.configuration_versions enable row level security;
alter table platform.configuration_versions force row level security;
alter table platform.secret_references enable row level security;
alter table platform.secret_references force row level security;
alter table platform.audit_events enable row level security;
alter table platform.audit_events force row level security;
alter table platform.idempotency_records enable row level security;
alter table platform.idempotency_records force row level security;
alter table platform.outbox_events enable row level security;
alter table platform.outbox_events force row level security;
alter table platform.inbox_receipts enable row level security;
alter table platform.inbox_receipts force row level security;
alter table platform.delivery_attempts enable row level security;
alter table platform.delivery_attempts force row level security;
alter table platform.jobs enable row level security;
alter table platform.jobs force row level security;
alter table platform.job_attempts enable row level security;
alter table platform.job_attempts force row level security;
alter table platform.evidence_manifests enable row level security;
alter table platform.evidence_manifests force row level security;
alter table platform.audit_exports enable row level security;
alter table platform.audit_exports force row level security;

create policy policy_sets__select on platform.policy_sets
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_sets__insert on platform.policy_sets
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_sets__update on platform.policy_sets
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy policy_versions__select on platform.policy_versions
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_versions__insert on platform.policy_versions
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_versions__update on platform.policy_versions
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy policy_rules__select on platform.policy_rules
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_rules__insert on platform.policy_rules
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy policy_rules__update on platform.policy_rules
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy capability_exposures__select on platform.capability_exposures
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy capability_exposures__insert on platform.capability_exposures
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy capability_exposures__update on platform.capability_exposures
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy approval_requests__select on platform.approval_requests
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy approval_requests__insert on platform.approval_requests
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy approval_requests__update on platform.approval_requests
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy approval_actions__select on platform.approval_actions
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy approval_actions__insert on platform.approval_actions
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy support_access_grants__select on platform.support_access_grants
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy support_access_grants__insert on platform.support_access_grants
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy support_access_grants__update on platform.support_access_grants
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy authorization_decisions__select on platform.authorization_decisions
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy authorization_decisions__insert on platform.authorization_decisions
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy configuration_sets__select on platform.configuration_sets
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy configuration_sets__insert on platform.configuration_sets
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy configuration_sets__update on platform.configuration_sets
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy configuration_versions__select on platform.configuration_versions
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy configuration_versions__insert on platform.configuration_versions
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy configuration_versions__update on platform.configuration_versions
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy secret_references__select on platform.secret_references
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy secret_references__insert on platform.secret_references
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy secret_references__update on platform.secret_references
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy audit_events__select on platform.audit_events
for select to platform_evidence_reader
using (platform_private.environment_matches(tenant_id, environment_id));
create policy audit_events__insert on platform.audit_events
for insert to platform_api, platform_worker
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy idempotency_records__select on platform.idempotency_records
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));
create policy idempotency_records__insert on platform.idempotency_records
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy idempotency_records__update on platform.idempotency_records
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy outbox_events__select on platform.outbox_events
for select to platform_api, platform_worker
using (platform_private.environment_matches(tenant_id, environment_id));
create policy outbox_events__insert on platform.outbox_events
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy outbox_events__update on platform.outbox_events
for update to platform_worker
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy inbox_receipts__insert on platform.inbox_receipts
for insert to platform_worker
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy delivery_attempts__insert on platform.delivery_attempts
for insert to platform_worker
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy jobs__select on platform.jobs
for select to platform_api, platform_worker
using (platform_private.environment_matches(tenant_id, environment_id));
create policy jobs__insert on platform.jobs
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));
create policy jobs__update on platform.jobs
for update to platform_api, platform_worker
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy job_attempts__insert on platform.job_attempts
for insert to platform_worker
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy evidence_manifests__select on platform.evidence_manifests
for select to platform_evidence_reader
using (
  (scope_type = 'tenant' and platform_private.environment_matches(tenant_id, environment_id))
  or (
    scope_type = 'repository'
    and platform.current_tenant_id() is null
    and platform.current_environment_id() is null
  )
);
create policy evidence_manifests__insert on platform.evidence_manifests
for insert to platform_worker
with check (
  (scope_type = 'tenant' and platform_private.environment_matches(tenant_id, environment_id))
  or (
    scope_type = 'repository'
    and platform.current_tenant_id() is null
    and platform.current_environment_id() is null
  )
);
create policy evidence_manifests__update on platform.evidence_manifests
for update to platform_worker
using (
  status = 'collecting'
  and (
    (scope_type = 'tenant' and platform_private.environment_matches(tenant_id, environment_id))
    or (
      scope_type = 'repository'
      and platform.current_tenant_id() is null
      and platform.current_environment_id() is null
    )
  )
)
with check (
  (scope_type = 'tenant' and platform_private.environment_matches(tenant_id, environment_id))
  or (
    scope_type = 'repository'
    and platform.current_tenant_id() is null
    and platform.current_environment_id() is null
  )
);

create policy audit_exports__select on platform.audit_exports
for select to platform_api, platform_evidence_reader
using (platform_private.tenant_matches(tenant_id));
create policy audit_exports__insert on platform.audit_exports
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));
create policy audit_exports__update on platform.audit_exports
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

grant select on table platform.capability_definitions
  to platform_api, platform_worker;

grant select, insert on table
  platform.policy_sets,
  platform.policy_versions,
  platform.policy_rules,
  platform.capability_exposures,
  platform.approval_requests,
  platform.approval_actions,
  platform.support_access_grants,
  platform.authorization_decisions,
  platform.configuration_sets,
  platform.configuration_versions,
  platform.secret_references,
  platform.idempotency_records,
  platform.outbox_events,
  platform.jobs,
  platform.audit_exports
  to platform_api;

grant update (active_version_id, status) on table platform.policy_sets
  to platform_api;
grant update (
  reviewed_by,
  status,
  effective_at,
  superseded_by_id,
  source_reference
) on table platform.policy_versions to platform_api;
grant update (
  priority,
  effect,
  conditions,
  reason_code,
  approval_requirement
) on table platform.policy_rules to platform_api;
grant update (
  policy_version_id,
  configuration_version_id,
  conditions,
  status,
  effective_at,
  superseded_by_id
) on table platform.capability_exposures to platform_api;
grant update (status, expires_at) on table platform.approval_requests
  to platform_api;
grant update (expires_at, revoked_at, status) on table platform.support_access_grants
  to platform_api;
grant update (active_version_id, status) on table platform.configuration_sets
  to platform_api;
grant update (
  validation_status,
  compatibility_status,
  approval_status,
  status,
  effective_at,
  superseded_by_id
) on table platform.configuration_versions to platform_api;
grant update (
  purpose,
  owner_membership_id,
  status,
  rotated_at,
  revoked_at
) on table platform.secret_references to platform_api;
grant update (result_reference, status, expires_at) on table platform.idempotency_records
  to platform_api;
grant update (
  priority,
  state,
  lease_owner,
  lease_expires_at,
  progress,
  scheduled_at,
  cancelled_at,
  attempt_count
) on table platform.jobs to platform_api;
grant update (
  produced_at,
  row_count,
  artifact_reference,
  artifact_sha256,
  integrity_metadata,
  expires_at,
  audit_event_id,
  status
) on table platform.audit_exports to platform_api;

grant insert on table platform.audit_events
  to platform_api, platform_worker;

grant select on table platform.outbox_events, platform.jobs
  to platform_worker;
grant update (
  state,
  lease_owner,
  lease_expires_at,
  delivery_attempt_count,
  published_at,
  reconciled_at,
  last_error_code,
  next_attempt_at
) on table platform.outbox_events to platform_worker;
grant update (
  priority,
  state,
  lease_owner,
  lease_expires_at,
  progress,
  scheduled_at,
  cancelled_at,
  attempt_count
) on table platform.jobs to platform_worker;
grant insert on table
  platform.inbox_receipts,
  platform.delivery_attempts,
  platform.job_attempts,
  platform.evidence_manifests,
  platform.deployment_records
  to platform_worker;
grant update (
  completed_at,
  checks,
  warnings,
  failures,
  artifacts,
  status
) on table platform.evidence_manifests to platform_worker;

grant select on table
  platform.audit_events,
  platform.evidence_manifests,
  platform.audit_exports,
  platform.deployment_records
  to platform_evidence_reader;

insert into platform_private.foundation_migration_ledger (
  migration_id,
  source_sha256,
  applied_by,
  tool_version
) values (
  '202607100003_control_and_evidence_foundation',
  :'migration_sha256',
  session_user,
  'psql-17'
);


