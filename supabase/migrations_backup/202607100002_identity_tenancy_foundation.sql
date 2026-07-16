-- T040 / HCP-03 Option A: additive identity and tenancy foundation.
-- Apply only through the separately approved guarded PostgreSQL 17 path.
-- The caller supplies migration_sha256 from this exact source file.

create table platform.users (
  id uuid primary key,
  auth_subject text not null unique,
  locale text not null,
  timezone text not null,
  status text not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  constraint users__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint users__auth_subject_shape
    check (
      char_length(auth_subject) between 1 and 512
      and auth_subject = btrim(auth_subject)
      and auth_subject !~ '[[:cntrl:]]'
    ),
  constraint users__locale_shape
    check (
      char_length(locale) between 2 and 35
      and locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'
    ),
  constraint users__timezone_shape
    check (
      char_length(timezone) between 1 and 64
      and timezone ~ '^[A-Za-z0-9_+./-]+$'
    ),
  constraint users__status
    check (status in ('active', 'suspended', 'disabled')),
  constraint users__version_positive check (version >= 1)
);

create table platform.permissions (
  id uuid primary key,
  code text not null unique,
  resource_type text not null,
  action text not null,
  sensitivity text not null,
  description text not null,
  created_at timestamptz not null default transaction_timestamp(),
  constraint permissions__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint permissions__code_shape
    check (
      code = resource_type || '.' || action
      and char_length(code) between 3 and 129
      and code ~ '^[a-z][a-z0-9_.-]*\.[a-z][a-z0-9_.-]*$'
    ),
  constraint permissions__resource_type_shape
    check (
      char_length(resource_type) between 1 and 64
      and resource_type ~ '^[a-z][a-z0-9_.-]*$'
    ),
  constraint permissions__action_shape
    check (
      char_length(action) between 1 and 64
      and action ~ '^[a-z][a-z0-9_.-]*$'
    ),
  constraint permissions__sensitivity
    check (sensitivity in ('low', 'standard', 'high', 'critical')),
  constraint permissions__description_shape
    check (char_length(description) between 1 and 2000)
);

create table platform.tenants (
  id uuid primary key,
  name text not null,
  type text not null,
  status text not null,
  default_timezone text not null,
  base_currency text not null,
  created_by uuid not null references platform.users (id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  constraint tenants__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint tenants__name_shape
    check (
      char_length(name) between 1 and 200
      and name = btrim(name)
      and name !~ '[[:cntrl:]]'
    ),
  constraint tenants__type
    check (
      type in (
        'individual',
        'team',
        'coaching',
        'enterprise',
        'hermes_operator',
        'hybrid',
        'platform_internal'
      )
    ),
  constraint tenants__status
    check (status in ('provisioning', 'active', 'suspended', 'closed')),
  constraint tenants__timezone_shape
    check (
      char_length(default_timezone) between 1 and 64
      and default_timezone ~ '^[A-Za-z0-9_+./-]+$'
    ),
  constraint tenants__base_currency_shape
    check (
      char_length(base_currency) between 2 and 32
      and base_currency ~ '^[A-Z0-9._:-]+$'
    ),
  constraint tenants__version_positive check (version >= 1)
);

create table platform.environments (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  code text not null,
  kind text not null,
  execution_mode text not null default 'observe',
  status text not null,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, id),
  unique (tenant_id, code),
  constraint environments__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint environments__code_shape
    check (
      char_length(code) between 1 and 64
      and code ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint environments__kind
    check (kind in ('sandbox', 'paper', 'staging', 'production', 'custom')),
  constraint environments__execution_mode_shape
    check (
      char_length(execution_mode) between 1 and 64
      and execution_mode ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint environments__status
    check (status in ('active', 'suspended', 'archived')),
  constraint environments__version_positive check (version >= 1)
);

create table platform.tenant_members (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  user_id uuid not null references platform.users (id) on delete restrict,
  status text not null,
  joined_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  invited_by uuid references platform.users (id) on delete restrict,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, id),
  unique (tenant_id, user_id),
  constraint tenant_members__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint tenant_members__status
    check (status in ('invited', 'active', 'suspended', 'removed')),
  constraint tenant_members__state_timestamps
    check (
      (status <> 'active' or joined_at is not null)
      and (status <> 'suspended' or suspended_at is not null)
      and (status <> 'removed' or removed_at is not null)
    ),
  constraint tenant_members__timestamp_order
    check (
      (suspended_at is null or joined_at is null or suspended_at >= joined_at)
      and (removed_at is null or joined_at is null or removed_at >= joined_at)
    ),
  constraint tenant_members__version_positive check (version >= 1)
);

create table platform.membership_environment_access (
  tenant_id uuid not null,
  environment_id uuid not null,
  membership_id uuid not null,
  status text not null,
  effective_at timestamptz not null default transaction_timestamp(),
  expires_at timestamptz,
  resource_scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, environment_id, membership_id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, membership_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint membership_environment_access__status
    check (status in ('active', 'suspended', 'expired', 'revoked')),
  constraint membership_environment_access__expiry
    check (expires_at is null or expires_at > effective_at),
  constraint membership_environment_access__scope
    check (
      jsonb_typeof(resource_scope) = 'object'
      and octet_length(resource_scope::text) <= 32768
    )
);

create table platform.teams (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, id),
  unique (tenant_id, normalized_name),
  constraint teams__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint teams__name_shape
    check (
      char_length(name) between 1 and 200
      and name = btrim(name)
      and name !~ '[[:cntrl:]]'
    ),
  constraint teams__version_positive check (version >= 1)
);

create table platform.team_members (
  tenant_id uuid not null,
  team_id uuid not null,
  membership_id uuid not null,
  status text not null default 'active',
  joined_at timestamptz not null default transaction_timestamp(),
  removed_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, team_id, membership_id),
  foreign key (tenant_id, team_id)
    references platform.teams (tenant_id, id) on delete restrict,
  foreign key (tenant_id, membership_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint team_members__status check (status in ('active', 'removed')),
  constraint team_members__state_timestamp
    check (status <> 'removed' or removed_at is not null),
  constraint team_members__timestamp_order
    check (removed_at is null or removed_at >= joined_at)
);

create table platform.invitations (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  normalized_target text not null,
  scope jsonb not null,
  scope_fingerprint text not null,
  token_key_id text not null,
  token_verifier text not null,
  requested_by_member_id uuid not null,
  expires_at timestamptz not null,
  status text not null default 'pending',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, id),
  foreign key (tenant_id, requested_by_member_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint invitations__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint invitations__target_shape
    check (
      char_length(normalized_target) between 3 and 320
      and normalized_target = btrim(normalized_target)
      and normalized_target !~ '[[:cntrl:]]'
    ),
  constraint invitations__scope
    check (
      jsonb_typeof(scope) = 'object'
      and octet_length(scope::text) <= 32768
    ),
  constraint invitations__scope_fingerprint
    check (scope_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint invitations__token_key_id_shape
    check (
      char_length(token_key_id) between 1 and 128
      and token_key_id ~ '^[A-Za-z0-9._:-]+$'
    ),
  constraint invitations__token_verifier
    check (token_verifier ~ '^[0-9a-f]{64}$'),
  constraint invitations__status
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  constraint invitations__state_timestamps
    check (
      (status <> 'accepted' or accepted_at is not null)
      and (status <> 'revoked' or revoked_at is not null)
    ),
  constraint invitations__expiry check (expires_at > created_at),
  constraint invitations__version_positive check (version >= 1)
);

create unique index invitations__one_pending_scope
  on platform.invitations (tenant_id, normalized_target, scope_fingerprint)
  where status = 'pending';

create table platform.roles (
  tenant_id uuid not null references platform.tenants (id) on delete restrict,
  id uuid not null,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  description text not null,
  status text not null,
  template_code text,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, id),
  unique (tenant_id, normalized_name),
  unique (tenant_id, template_code),
  constraint roles__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint roles__name_shape
    check (
      char_length(name) between 1 and 200
      and name = btrim(name)
      and name !~ '[[:cntrl:]]'
    ),
  constraint roles__description_shape
    check (char_length(description) between 1 and 2000),
  constraint roles__status check (status in ('active', 'disabled', 'archived')),
  constraint roles__template_code_shape
    check (
      template_code is null
      or (
        char_length(template_code) between 1 and 128
        and template_code ~ '^[a-z][a-z0-9_.-]*$'
      )
    ),
  constraint roles__version_positive check (version >= 1)
);

create table platform.role_permissions (
  tenant_id uuid not null,
  role_id uuid not null,
  permission_id uuid not null references platform.permissions (id) on delete restrict,
  effect text not null,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, role_id, permission_id),
  foreign key (tenant_id, role_id)
    references platform.roles (tenant_id, id) on delete restrict,
  constraint role_permissions__effect check (effect in ('allow', 'deny')),
  constraint role_permissions__conditions
    check (
      jsonb_typeof(conditions) = 'object'
      and octet_length(conditions::text) <= 32768
    )
);

create table platform.member_roles (
  tenant_id uuid not null,
  id uuid not null,
  membership_id uuid not null,
  role_id uuid not null,
  environment_id uuid,
  team_id uuid,
  resource_type text,
  resource_id uuid,
  issued_by_member_id uuid not null,
  effective_at timestamptz not null default transaction_timestamp(),
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default transaction_timestamp(),
  primary key (tenant_id, id),
  foreign key (tenant_id, membership_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  foreign key (tenant_id, role_id)
    references platform.roles (tenant_id, id) on delete restrict,
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, team_id)
    references platform.teams (tenant_id, id) on delete restrict,
  foreign key (tenant_id, issued_by_member_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint member_roles__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint member_roles__resource_pair
    check ((resource_type is null) = (resource_id is null)),
  constraint member_roles__resource_type_shape
    check (
      resource_type is null
      or (
        char_length(resource_type) between 1 and 64
        and resource_type ~ '^[a-z][a-z0-9_.-]*$'
      )
    ),
  constraint member_roles__status
    check (status in ('active', 'suspended', 'expired', 'revoked')),
  constraint member_roles__expiry
    check (expires_at is null or expires_at > effective_at)
);

create table platform.session_records (
  id uuid primary key,
  user_id uuid not null references platform.users (id) on delete restrict,
  session_reference_hash text not null unique,
  issued_at timestamptz not null,
  last_seen_at timestamptz not null,
  revoked_at timestamptz,
  authentication_method text not null,
  authentication_strength text not null,
  device_metadata_class text not null,
  selected_tenant_id uuid,
  selected_environment_id uuid,
  revocation_reason text,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  foreign key (selected_tenant_id)
    references platform.tenants (id) on delete restrict,
  foreign key (selected_tenant_id, selected_environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (selected_tenant_id, user_id)
    references platform.tenant_members (tenant_id, user_id) on delete restrict,
  constraint session_records__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint session_records__reference_hash
    check (session_reference_hash ~ '^[0-9a-f]{64}$'),
  constraint session_records__time_order
    check (
      last_seen_at >= issued_at
      and (revoked_at is null or revoked_at >= issued_at)
    ),
  constraint session_records__authentication_method_shape
    check (
      char_length(authentication_method) between 1 and 64
      and authentication_method ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint session_records__authentication_strength_shape
    check (
      char_length(authentication_strength) between 1 and 64
      and authentication_strength ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint session_records__device_class_shape
    check (
      char_length(device_metadata_class) between 1 and 64
      and device_metadata_class ~ '^[a-z][a-z0-9_-]*$'
    ),
  constraint session_records__selection_pair
    check (selected_environment_id is null or selected_tenant_id is not null),
  constraint session_records__revocation_reason_shape
    check (
      revocation_reason is null
      or char_length(revocation_reason) between 1 and 500
    ),
  constraint session_records__version_positive check (version >= 1)
);

create table platform.service_identities (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  name text not null,
  owner_membership_id uuid not null,
  resource_scope jsonb not null default '{}'::jsonb,
  action_scope text[] not null,
  status text not null,
  expires_at timestamptz,
  last_rotated_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id)
    references platform.environments (tenant_id, id) on delete restrict,
  foreign key (tenant_id, owner_membership_id)
    references platform.tenant_members (tenant_id, id) on delete restrict,
  constraint service_identities__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint service_identities__name_shape
    check (
      char_length(name) between 1 and 200
      and name = btrim(name)
      and name !~ '[[:cntrl:]]'
    ),
  constraint service_identities__resource_scope
    check (
      jsonb_typeof(resource_scope) = 'object'
      and octet_length(resource_scope::text) <= 32768
    ),
  constraint service_identities__action_scope
    check (
      cardinality(action_scope) between 1 and 128
      and array_position(action_scope, null) is null
      and octet_length(array_to_string(action_scope, ',')) <= 8192
    ),
  constraint service_identities__status
    check (status in ('active', 'suspended', 'revoked', 'expired')),
  constraint service_identities__expiry
    check (expires_at is null or expires_at > created_at),
  constraint service_identities__rotation_time
    check (last_rotated_at is null or last_rotated_at >= created_at),
  constraint service_identities__version_positive check (version >= 1)
);

create table platform.api_credentials (
  tenant_id uuid not null,
  environment_id uuid not null,
  id uuid not null,
  service_identity_id uuid not null,
  public_prefix text not null unique,
  credential_verifier text not null,
  maximum_scope jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  issued_at timestamptz not null default transaction_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  version integer not null default 1,
  primary key (tenant_id, environment_id, id),
  foreign key (tenant_id, environment_id, service_identity_id)
    references platform.service_identities (tenant_id, environment_id, id)
    on delete restrict,
  constraint api_credentials__id_uuidv7
    check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint api_credentials__public_prefix_shape
    check (
      char_length(public_prefix) between 8 and 64
      and public_prefix ~ '^[A-Za-z0-9_-]+$'
    ),
  constraint api_credentials__verifier
    check (credential_verifier ~ '^[0-9a-f]{64}$'),
  constraint api_credentials__maximum_scope
    check (
      jsonb_typeof(maximum_scope) = 'object'
      and octet_length(maximum_scope::text) <= 32768
    ),
  constraint api_credentials__status
    check (status in ('active', 'revoked', 'expired')),
  constraint api_credentials__time_order
    check (
      expires_at > issued_at
      and (revoked_at is null or revoked_at >= issued_at)
      and (last_used_at is null or last_used_at >= issued_at)
    ),
  constraint api_credentials__version_positive check (version >= 1)
);

create trigger users__touch_version
before update on platform.users
for each row execute function platform_private.touch_versioned_row();

create trigger tenants__touch_version
before update on platform.tenants
for each row execute function platform_private.touch_versioned_row();

create trigger environments__touch_version
before update on platform.environments
for each row execute function platform_private.touch_versioned_row();

create trigger tenant_members__touch_version
before update on platform.tenant_members
for each row execute function platform_private.touch_versioned_row();

create trigger teams__touch_version
before update on platform.teams
for each row execute function platform_private.touch_versioned_row();

create trigger invitations__touch_version
before update on platform.invitations
for each row execute function platform_private.touch_versioned_row();

create trigger roles__touch_version
before update on platform.roles
for each row execute function platform_private.touch_versioned_row();

create trigger session_records__touch_version
before update on platform.session_records
for each row execute function platform_private.touch_versioned_row();

create trigger service_identities__touch_version
before update on platform.service_identities
for each row execute function platform_private.touch_versioned_row();

create trigger api_credentials__touch_version
before update on platform.api_credentials
for each row execute function platform_private.touch_versioned_row();

alter table platform.users enable row level security;
alter table platform.users force row level security;
alter table platform.tenants enable row level security;
alter table platform.tenants force row level security;
alter table platform.environments enable row level security;
alter table platform.environments force row level security;
alter table platform.tenant_members enable row level security;
alter table platform.tenant_members force row level security;
alter table platform.membership_environment_access enable row level security;
alter table platform.membership_environment_access force row level security;
alter table platform.teams enable row level security;
alter table platform.teams force row level security;
alter table platform.team_members enable row level security;
alter table platform.team_members force row level security;
alter table platform.invitations enable row level security;
alter table platform.invitations force row level security;
alter table platform.roles enable row level security;
alter table platform.roles force row level security;
alter table platform.role_permissions enable row level security;
alter table platform.role_permissions force row level security;
alter table platform.member_roles enable row level security;
alter table platform.member_roles force row level security;
alter table platform.session_records enable row level security;
alter table platform.session_records force row level security;
alter table platform.service_identities enable row level security;
alter table platform.service_identities force row level security;
alter table platform.api_credentials enable row level security;
alter table platform.api_credentials force row level security;

create policy users__select on platform.users
for select to platform_api
using (id = platform.current_user_id());

create policy users__insert on platform.users
for insert to platform_api
with check (id = platform.current_user_id());

create policy users__update on platform.users
for update to platform_api
using (id = platform.current_user_id())
with check (id = platform.current_user_id());

create policy tenants__select on platform.tenants
for select to platform_api
using (platform_private.tenant_matches(id));

create policy tenants__insert on platform.tenants
for insert to platform_api
with check (
  platform_private.tenant_matches(id)
  and created_by = platform.current_user_id()
);

create policy tenants__update on platform.tenants
for update to platform_api
using (platform_private.tenant_matches(id))
with check (platform_private.tenant_matches(id));

create policy environments__select on platform.environments
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy environments__insert on platform.environments
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy environments__update on platform.environments
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy tenant_members__select on platform.tenant_members
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy tenant_members__insert on platform.tenant_members
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy tenant_members__update on platform.tenant_members
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy membership_environment_access__select
on platform.membership_environment_access
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));

create policy membership_environment_access__insert
on platform.membership_environment_access
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy membership_environment_access__update
on platform.membership_environment_access
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy teams__select on platform.teams
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy teams__insert on platform.teams
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy teams__update on platform.teams
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy team_members__select on platform.team_members
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy team_members__insert on platform.team_members
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy team_members__update on platform.team_members
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy invitations__select on platform.invitations
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy invitations__insert on platform.invitations
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy invitations__update on platform.invitations
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy roles__select on platform.roles
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy roles__insert on platform.roles
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy roles__update on platform.roles
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy role_permissions__select on platform.role_permissions
for select to platform_api
using (platform_private.tenant_matches(tenant_id));

create policy role_permissions__insert on platform.role_permissions
for insert to platform_api
with check (platform_private.tenant_matches(tenant_id));

create policy role_permissions__update on platform.role_permissions
for update to platform_api
using (platform_private.tenant_matches(tenant_id))
with check (platform_private.tenant_matches(tenant_id));

create policy member_roles__select on platform.member_roles
for select to platform_api
using (
  platform_private.tenant_matches(tenant_id)
  and (
    environment_id is null
    or platform_private.environment_matches(tenant_id, environment_id)
  )
);

create policy member_roles__insert on platform.member_roles
for insert to platform_api
with check (
  platform_private.tenant_matches(tenant_id)
  and (
    environment_id is null
    or platform_private.environment_matches(tenant_id, environment_id)
  )
);

create policy member_roles__update on platform.member_roles
for update to platform_api
using (
  platform_private.tenant_matches(tenant_id)
  and (
    environment_id is null
    or platform_private.environment_matches(tenant_id, environment_id)
  )
)
with check (
  platform_private.tenant_matches(tenant_id)
  and (
    environment_id is null
    or platform_private.environment_matches(tenant_id, environment_id)
  )
);

create policy session_records__select on platform.session_records
for select to platform_api
using (user_id = platform.current_user_id());

create policy session_records__insert on platform.session_records
for insert to platform_api
with check (user_id = platform.current_user_id());

create policy session_records__update on platform.session_records
for update to platform_api
using (user_id = platform.current_user_id())
with check (user_id = platform.current_user_id());

create policy service_identities__select on platform.service_identities
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));

create policy service_identities__insert on platform.service_identities
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy service_identities__update on platform.service_identities
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy api_credentials__select on platform.api_credentials
for select to platform_api
using (platform_private.environment_matches(tenant_id, environment_id));

create policy api_credentials__insert on platform.api_credentials
for insert to platform_api
with check (platform_private.environment_matches(tenant_id, environment_id));

create policy api_credentials__update on platform.api_credentials
for update to platform_api
using (platform_private.environment_matches(tenant_id, environment_id))
with check (platform_private.environment_matches(tenant_id, environment_id));

grant select on table platform.permissions to platform_api, platform_worker;

grant select, insert on table
  platform.users,
  platform.tenants,
  platform.environments,
  platform.tenant_members,
  platform.membership_environment_access,
  platform.teams,
  platform.team_members,
  platform.invitations,
  platform.roles,
  platform.role_permissions,
  platform.member_roles,
  platform.session_records,
  platform.service_identities,
  platform.api_credentials
to platform_api;

grant update (locale, timezone, status)
on platform.users to platform_api;

grant update (name, type, status, default_timezone, base_currency)
on platform.tenants to platform_api;

grant update (code, kind, execution_mode, status)
on platform.environments to platform_api;

grant update (status, joined_at, suspended_at, removed_at)
on platform.tenant_members to platform_api;

grant update (status, effective_at, expires_at, resource_scope)
on platform.membership_environment_access to platform_api;

grant update (name)
on platform.teams to platform_api;

grant update (status, removed_at)
on platform.team_members to platform_api;

grant update (status, accepted_at, revoked_at)
on platform.invitations to platform_api;

grant update (name, description, status)
on platform.roles to platform_api;

grant update (effect, conditions)
on platform.role_permissions to platform_api;

grant update (
  team_id,
  resource_type,
  resource_id,
  effective_at,
  expires_at,
  status
)
on platform.member_roles to platform_api;

grant update (
  last_seen_at,
  revoked_at,
  authentication_strength,
  device_metadata_class,
  selected_tenant_id,
  selected_environment_id,
  revocation_reason
)
on platform.session_records to platform_api;

grant update (
  name,
  resource_scope,
  action_scope,
  status,
  expires_at,
  last_rotated_at
)
on platform.service_identities to platform_api;

grant update (
  maximum_scope,
  status,
  expires_at,
  revoked_at,
  last_used_at
)
on platform.api_credentials to platform_api;

insert into platform_private.foundation_migration_ledger (
  migration_id,
  source_sha256,
  applied_by,
  tool_version
) values (
  '202607100002_identity_tenancy_foundation',
  :'migration_sha256',
  session_user,
  'psql-17'
);



