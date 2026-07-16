-- T042 / HCP-03 Option A: deterministic synthetic local/CI fixtures only.
-- Apply only after migrations 001-003 through a separately guarded local path.
-- These identifiers, references, names, and hashes are fixtures, not live data.

\set ON_ERROR_STOP on

begin;
set local role platform_api;

-- Synthetic identities. The shared user intentionally belongs to both tenants.
select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000001'::uuid,
  '018f0000-0000-7000-8000-000000000001'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000901'::uuid
);
insert into platform.users (
  id,
  auth_subject,
  locale,
  timezone,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000001'::uuid,
  'synthetic://foundation/shared-user',
  'en-US',
  'UTC',
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);

select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000002'::uuid,
  '018f0000-0000-7000-8000-000000000002'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000902'::uuid
);
insert into platform.users (
  id,
  auth_subject,
  locale,
  timezone,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000002'::uuid,
  'synthetic://foundation/alpha-admin',
  'en-US',
  'UTC',
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);

select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000003'::uuid,
  '018f0000-0000-7000-8000-000000000003'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000202'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000903'::uuid
);
insert into platform.users (
  id,
  auth_subject,
  locale,
  timezone,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000003'::uuid,
  'synthetic://foundation/beta-admin',
  'en-US',
  'UTC',
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);

-- Tenant Alpha uses the same local codes and resource names as Tenant Beta.
select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000002'::uuid,
  '018f0000-0000-7000-8000-000000000002'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000911'::uuid
);
insert into platform.tenants (
  id,
  name,
  type,
  status,
  default_timezone,
  base_currency,
  created_by,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  'Synthetic Tenant Alpha',
  'team',
  'active',
  'UTC',
  'USD',
  '018f0000-0000-7000-8000-000000000002'::uuid,
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.environments (
  tenant_id,
  id,
  code,
  kind,
  execution_mode,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  'local',
  'sandbox',
  'observe',
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.tenant_members (
  tenant_id,
  id,
  user_id,
  status,
  joined_at,
  invited_by,
  created_at,
  updated_at
) values
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000301'::uuid,
    '018f0000-0000-7000-8000-000000000002'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '018f0000-0000-7000-8000-000000000002'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000302'::uuid,
    '018f0000-0000-7000-8000-000000000001'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '018f0000-0000-7000-8000-000000000002'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.membership_environment_access (
  tenant_id,
  environment_id,
  membership_id,
  status,
  effective_at,
  resource_scope,
  created_at
) values
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000201'::uuid,
    '018f0000-0000-7000-8000-000000000301'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '{"fixture":"alpha-admin"}'::jsonb,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000201'::uuid,
    '018f0000-0000-7000-8000-000000000302'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '{"fixture":"shared-user"}'::jsonb,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.teams (
  tenant_id,
  id,
  name,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000401'::uuid,
  'Shared Research',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.team_members (
  tenant_id,
  team_id,
  membership_id,
  status,
  joined_at,
  created_at
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000401'::uuid,
  '018f0000-0000-7000-8000-000000000302'::uuid,
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.roles (
  tenant_id,
  id,
  name,
  description,
  status,
  template_code,
  created_at,
  updated_at
) values
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000501'::uuid,
    'Operator',
    'Synthetic tenant-local administrator fixture',
    'active',
    'fixture.operator',
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000502'::uuid,
    'Observer',
    'Synthetic tenant-local shared-user fixture',
    'active',
    'fixture.observer',
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.member_roles (
  tenant_id,
  id,
  membership_id,
  role_id,
  environment_id,
  team_id,
  issued_by_member_id,
  effective_at,
  status,
  created_at
) values
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000601'::uuid,
    '018f0000-0000-7000-8000-000000000301'::uuid,
    '018f0000-0000-7000-8000-000000000501'::uuid,
    '018f0000-0000-7000-8000-000000000201'::uuid,
    null,
    '018f0000-0000-7000-8000-000000000301'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000101'::uuid,
    '018f0000-0000-7000-8000-000000000602'::uuid,
    '018f0000-0000-7000-8000-000000000302'::uuid,
    '018f0000-0000-7000-8000-000000000502'::uuid,
    '018f0000-0000-7000-8000-000000000201'::uuid,
    '018f0000-0000-7000-8000-000000000401'::uuid,
    '018f0000-0000-7000-8000-000000000301'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.service_identities (
  tenant_id,
  environment_id,
  id,
  name,
  owner_membership_id,
  resource_scope,
  action_scope,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  '018f0000-0000-7000-8000-000000000701'::uuid,
  'fixture-runner',
  '018f0000-0000-7000-8000-000000000301'::uuid,
  '{"fixture":"cross-tenant-isolation","resource":"shared-research"}'::jsonb,
  array['fixture.read', 'fixture.execute']::text[],
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);

-- Tenant Beta repeats Alpha's environment, team, role, and service names.
select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000003'::uuid,
  '018f0000-0000-7000-8000-000000000003'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000202'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000912'::uuid
);
insert into platform.tenants (
  id,
  name,
  type,
  status,
  default_timezone,
  base_currency,
  created_by,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000102'::uuid,
  'Synthetic Tenant Beta',
  'team',
  'active',
  'UTC',
  'USD',
  '018f0000-0000-7000-8000-000000000003'::uuid,
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.environments (
  tenant_id,
  id,
  code,
  kind,
  execution_mode,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000202'::uuid,
  'local',
  'sandbox',
  'observe',
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.tenant_members (
  tenant_id,
  id,
  user_id,
  status,
  joined_at,
  invited_by,
  created_at,
  updated_at
) values
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000303'::uuid,
    '018f0000-0000-7000-8000-000000000003'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '018f0000-0000-7000-8000-000000000003'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000304'::uuid,
    '018f0000-0000-7000-8000-000000000001'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '018f0000-0000-7000-8000-000000000003'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.membership_environment_access (
  tenant_id,
  environment_id,
  membership_id,
  status,
  effective_at,
  resource_scope,
  created_at
) values
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000202'::uuid,
    '018f0000-0000-7000-8000-000000000303'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '{"fixture":"beta-admin"}'::jsonb,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000202'::uuid,
    '018f0000-0000-7000-8000-000000000304'::uuid,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz,
    '{"fixture":"shared-user"}'::jsonb,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.teams (
  tenant_id,
  id,
  name,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000402'::uuid,
  'Shared Research',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.team_members (
  tenant_id,
  team_id,
  membership_id,
  status,
  joined_at,
  created_at
) values (
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000402'::uuid,
  '018f0000-0000-7000-8000-000000000304'::uuid,
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);
insert into platform.roles (
  tenant_id,
  id,
  name,
  description,
  status,
  template_code,
  created_at,
  updated_at
) values
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000503'::uuid,
    'Operator',
    'Synthetic tenant-local administrator fixture',
    'active',
    'fixture.operator',
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000504'::uuid,
    'Observer',
    'Synthetic tenant-local shared-user fixture',
    'active',
    'fixture.observer',
    '2026-01-01T00:00:00Z'::timestamptz,
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.member_roles (
  tenant_id,
  id,
  membership_id,
  role_id,
  environment_id,
  team_id,
  issued_by_member_id,
  effective_at,
  status,
  created_at
) values
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000603'::uuid,
    '018f0000-0000-7000-8000-000000000303'::uuid,
    '018f0000-0000-7000-8000-000000000503'::uuid,
    '018f0000-0000-7000-8000-000000000202'::uuid,
    null,
    '018f0000-0000-7000-8000-000000000303'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '018f0000-0000-7000-8000-000000000102'::uuid,
    '018f0000-0000-7000-8000-000000000604'::uuid,
    '018f0000-0000-7000-8000-000000000304'::uuid,
    '018f0000-0000-7000-8000-000000000504'::uuid,
    '018f0000-0000-7000-8000-000000000202'::uuid,
    '018f0000-0000-7000-8000-000000000402'::uuid,
    '018f0000-0000-7000-8000-000000000303'::uuid,
    '2026-01-01T00:00:00Z'::timestamptz,
    'active',
    '2026-01-01T00:00:00Z'::timestamptz
  );
insert into platform.service_identities (
  tenant_id,
  environment_id,
  id,
  name,
  owner_membership_id,
  resource_scope,
  action_scope,
  status,
  created_at,
  updated_at
) values (
  '018f0000-0000-7000-8000-000000000102'::uuid,
  '018f0000-0000-7000-8000-000000000202'::uuid,
  '018f0000-0000-7000-8000-000000000702'::uuid,
  'fixture-runner',
  '018f0000-0000-7000-8000-000000000303'::uuid,
  '{"fixture":"cross-tenant-isolation","resource":"shared-research"}'::jsonb,
  array['fixture.read', 'fixture.execute']::text[],
  'active',
  '2026-01-01T00:00:00Z'::timestamptz,
  '2026-01-01T00:00:00Z'::timestamptz
);

-- Attack fixture pair: while one tenant context is set, the other tenant's
-- environment, team, role, membership, and service UUIDs are target IDs only.
-- Cross-tenant read, insert, update, and delete attempts must fail without
-- returning or changing the target row. The shared user must not widen scope.

commit;
