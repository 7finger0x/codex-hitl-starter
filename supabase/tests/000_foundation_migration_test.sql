\set ON_ERROR_STOP on

-- T038 real-PostgreSQL acceptance suite for HCP-03 Option A.
-- This file is intentionally authored before the three approved migrations.
-- It creates only transaction-scoped synthetic rows and temporary assertions.

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $assertion$
begin
  if condition is distinct from true then
    raise exception 'foundation migration assertion failed: %', message;
  end if;
end;
$assertion$;

select pg_temp.assert_true(
  current_database() = 'platform_foundation_hcp03',
  'wrong database name'
);

select pg_temp.assert_true(
  coalesce(obj_description(oid, 'pg_database'), '') =
    'DISPOSABLE:002-platform-foundation:HCP-03',
  'database comment differs'
  from pg_database
  where datname = current_database()
);

select pg_temp.assert_true(
  current_setting('server_version_num')::integer between 170000 and 179999,
  'PostgreSQL major version is not 17'
);

select pg_temp.assert_true(not pg_is_in_recovery(), 'target is in recovery');
select pg_temp.assert_true(
  not exists (select 1 from pg_replication_slots),
  'replication slots are forbidden on the disposable target'
);
select pg_temp.assert_true(
  not exists (select 1 from pg_subscription),
  'subscriptions are forbidden on the disposable target'
);
select pg_temp.assert_true(
  not exists (select 1 from pg_foreign_server),
  'foreign servers are forbidden on the disposable target'
);

select pg_temp.assert_true(
  (
    select array_agg(nspname order by nspname)
    from pg_namespace
    where nspname like 'platform%'
  ) = array['platform', 'platform_private'],
  'exact platform schema inventory differs'
);

select pg_temp.assert_true(
  (
    select array_agg(rolname order by rolname)
    from pg_roles
    where rolname like 'platform_%'
  ) = array[
    'platform_api',
    'platform_evidence_reader',
    'platform_migrator',
    'platform_owner',
    'platform_runtime',
    'platform_worker'
  ],
  'exact role inventory differs'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_roles
    where rolname like 'platform_%'
      and (
        rolcanlogin
        or rolsuper
        or rolcreatedb
        or rolcreaterole
        or rolreplication
        or rolbypassrls
      )
  ),
  'a platform role has a prohibited attribute'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_roles
    where rolname in (
      'platform_migrator',
      'platform_runtime',
      'platform_api',
      'platform_worker',
      'platform_evidence_reader'
    )
      and rolinherit
  ),
  'a NOINHERIT role unexpectedly inherits privileges'
);

select pg_temp.assert_true(
  pg_has_role('platform_migrator', 'platform_owner', 'MEMBER'),
  'migrator cannot SET ROLE to the owner'
);
select pg_temp.assert_true(
  pg_has_role('platform_api', 'platform_runtime', 'MEMBER')
    and pg_has_role('platform_worker', 'platform_runtime', 'MEMBER')
    and pg_has_role('platform_evidence_reader', 'platform_runtime', 'MEMBER'),
  'runtime group membership differs'
);
select pg_temp.assert_true(
  not pg_has_role('platform_api', 'platform_owner', 'MEMBER')
    and not pg_has_role('platform_worker', 'platform_owner', 'MEMBER')
    and not pg_has_role('platform_evidence_reader', 'platform_owner', 'MEMBER'),
  'a runtime role can reach the object owner'
);

select pg_temp.assert_true(
  (
    select array_agg(n.nspname || '.' || c.relname order by n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and n.nspname in ('platform', 'platform_private')
  ) = array[
    'platform.api_credentials',
    'platform.approval_actions',
    'platform.approval_requests',
    'platform.audit_events',
    'platform.audit_exports',
    'platform.authorization_decisions',
    'platform.capability_definitions',
    'platform.capability_exposures',
    'platform.configuration_sets',
    'platform.configuration_versions',
    'platform.delivery_attempts',
    'platform.deployment_records',
    'platform.environments',
    'platform.evidence_manifests',
    'platform.idempotency_records',
    'platform.inbox_receipts',
    'platform.invitations',
    'platform.job_attempts',
    'platform.jobs',
    'platform.member_roles',
    'platform.membership_environment_access',
    'platform.outbox_events',
    'platform.permissions',
    'platform.policy_rules',
    'platform.policy_sets',
    'platform.policy_versions',
    'platform.role_permissions',
    'platform.roles',
    'platform.secret_references',
    'platform.service_identities',
    'platform.session_records',
    'platform.support_access_grants',
    'platform.team_members',
    'platform.teams',
    'platform.tenant_members',
    'platform.tenants',
    'platform.users',
    'platform_private.foundation_migration_ledger'
  ],
  'exact 38-table inventory differs'
);

select pg_temp.assert_true(
  (
    select array_agg(p.proname order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('platform', 'platform_private')
  ) = array[
    'clear_request_context',
    'current_authentication_strength',
    'current_correlation_id',
    'current_environment_id',
    'current_principal_id',
    'current_principal_type',
    'current_tenant_id',
    'current_user_id',
    'environment_matches',
    'guard_secret_reference_environment',
    'protect_completed_evidence',
    'protect_outbox_payload',
    'protect_published_version',
    'reject_row_mutation',
    'require_request_context',
    'set_request_context',
    'tenant_matches',
    'touch_versioned_row'
  ],
  'exact 18-function inventory differs'
);

select pg_temp.assert_true(
  (
    select count(*) = 3
      and bool_and(migration_id in (
        '202607100001_foundation_bootstrap',
        '202607100002_identity_tenancy_foundation',
        '202607100003_control_and_evidence_foundation'
      ))
      and bool_and(source_sha256 ~ '^[0-9a-f]{64}$')
    from platform_private.foundation_migration_ledger
  ),
  'migration ledger entries or checksums differ'
);

with expected(table_name) as (
  values
    ('users'),
    ('tenants'),
    ('environments'),
    ('tenant_members'),
    ('membership_environment_access'),
    ('teams'),
    ('team_members'),
    ('invitations'),
    ('roles'),
    ('role_permissions'),
    ('member_roles'),
    ('session_records'),
    ('service_identities'),
    ('api_credentials'),
    ('authorization_decisions'),
    ('capability_exposures'),
    ('policy_sets'),
    ('policy_versions'),
    ('policy_rules'),
    ('approval_requests'),
    ('approval_actions'),
    ('support_access_grants'),
    ('configuration_sets'),
    ('configuration_versions'),
    ('secret_references'),
    ('audit_events'),
    ('idempotency_records'),
    ('outbox_events'),
    ('inbox_receipts'),
    ('delivery_attempts'),
    ('jobs'),
    ('job_attempts'),
    ('evidence_manifests'),
    ('audit_exports')
)
select pg_temp.assert_true(
  not exists (
    select 1
    from expected e
    left join pg_class c on c.relname = e.table_name
    left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'platform'
    where c.oid is null or not c.relrowsecurity or not c.relforcerowsecurity
  ),
  'one or more scoped tables does not enable and force RLS'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform'
      and p.polcmd in ('*', 'd')
  ),
  'RLS policies must be command-specific and must not allow delete'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema in ('platform', 'platform_private')
      and grantee in (
        'platform_runtime',
        'platform_api',
        'platform_worker',
        'platform_evidence_reader'
      )
      and privilege_type in ('DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ),
  'runtime role has a prohibited table privilege'
);

select pg_temp.assert_true(
  not has_schema_privilege('public', 'platform', 'USAGE')
    and not has_schema_privilege('public', 'platform_private', 'USAGE'),
  'PUBLIC can use a platform schema'
);

select pg_temp.assert_true(
  not has_schema_privilege('platform_api', 'platform_private', 'CREATE')
    and not has_schema_privilege('platform_worker', 'platform_private', 'CREATE'),
  'runtime role can create private objects'
);

-- The API and worker must be able to invoke the approved private context setter.
-- PostgreSQL requires schema USAGE in addition to function EXECUTE; this assertion
-- intentionally exposes any grant-inventory contradiction rather than bypassing it.
select pg_temp.assert_true(
  has_schema_privilege('platform_api', 'platform_private', 'USAGE')
    and has_function_privilege(
      'platform_api',
      'platform_private.set_request_context(uuid,uuid,text,uuid,uuid,text,uuid)',
      'EXECUTE'
    )
    and has_schema_privilege('platform_worker', 'platform_private', 'USAGE')
    and has_function_privilege(
      'platform_worker',
      'platform_private.set_request_context(uuid,uuid,text,uuid,uuid,text,uuid)',
      'EXECUTE'
    )
    and has_schema_privilege(
      'platform_evidence_reader',
      'platform_private',
      'USAGE'
    )
    and not has_function_privilege(
      'platform_evidence_reader',
      'platform_private.set_request_context(uuid,uuid,text,uuid,uuid,text,uuid)',
      'EXECUTE'
    ),
  'API/worker cannot execute the approved request-context setter'
);

select pg_temp.assert_true(
  (
    select bool_and(
      has_function_privilege(
        role_name,
        'platform_private.require_request_context()',
        'EXECUTE'
      )
      and has_function_privilege(
        role_name,
        'platform_private.tenant_matches(uuid)',
        'EXECUTE'
      )
      and has_function_privilege(
        role_name,
        'platform_private.environment_matches(uuid,uuid)',
        'EXECUTE'
      )
      and not has_function_privilege(
        role_name,
        'platform_private.clear_request_context()',
        'EXECUTE'
      )
      and not has_function_privilege(
        role_name,
        'platform_private.touch_versioned_row()',
        'EXECUTE'
      )
    )
    from unnest(array[
      'platform_api',
      'platform_worker',
      'platform_evidence_reader'
    ]) as roles(role_name)
  ),
  'private helper execution grants differ from the allowlist'
);

select pg_temp.assert_true(
  not has_schema_privilege('platform_runtime', 'platform_private', 'USAGE')
    and not has_schema_privilege('public', 'platform_private', 'USAGE'),
  'the private schema is exposed beyond the three concrete runtime roles'
);

with tenant_tables(table_name) as (
  values
    ('environments'),
    ('tenant_members'),
    ('membership_environment_access'),
    ('teams'),
    ('team_members'),
    ('invitations'),
    ('roles'),
    ('role_permissions'),
    ('member_roles'),
    ('service_identities'),
    ('api_credentials'),
    ('authorization_decisions'),
    ('capability_exposures'),
    ('policy_sets'),
    ('policy_versions'),
    ('policy_rules'),
    ('approval_requests'),
    ('approval_actions'),
    ('support_access_grants'),
    ('configuration_sets'),
    ('configuration_versions'),
    ('secret_references'),
    ('audit_events'),
    ('idempotency_records'),
    ('outbox_events'),
    ('inbox_receipts'),
    ('delivery_attempts'),
    ('jobs'),
    ('job_attempts'),
    ('audit_exports')
)
select pg_temp.assert_true(
  not exists (
    select 1
    from tenant_tables t
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'platform'
        and c.table_name = t.table_name
        and c.column_name = 'tenant_id'
        and c.data_type = 'uuid'
        and c.is_nullable = 'NO'
    )
  ),
  'tenant-owned table lacks a non-null UUID tenant_id'
);

with environment_tables(table_name) as (
  values
    ('membership_environment_access'),
    ('service_identities'),
    ('api_credentials'),
    ('authorization_decisions'),
    ('capability_exposures'),
    ('policy_sets'),
    ('policy_versions'),
    ('policy_rules'),
    ('approval_requests'),
    ('approval_actions'),
    ('support_access_grants'),
    ('configuration_sets'),
    ('configuration_versions'),
    ('secret_references'),
    ('audit_events'),
    ('idempotency_records'),
    ('outbox_events'),
    ('inbox_receipts'),
    ('delivery_attempts'),
    ('jobs'),
    ('job_attempts')
)
select pg_temp.assert_true(
  not exists (
    select 1
    from environment_tables t
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'platform'
        and c.table_name = t.table_name
        and c.column_name = 'environment_id'
        and c.data_type = 'uuid'
        and c.is_nullable = 'NO'
    )
  ),
  'environment-scoped table lacks a non-null UUID environment_id'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_constraint fk
    join pg_class child on child.oid = fk.conrelid
    join pg_namespace child_namespace on child_namespace.oid = child.relnamespace
    join pg_class parent on parent.oid = fk.confrelid
    join pg_namespace parent_namespace on parent_namespace.oid = parent.relnamespace
    join pg_attribute child_tenant
      on child_tenant.attrelid = child.oid and child_tenant.attname = 'tenant_id'
    join pg_attribute parent_tenant
      on parent_tenant.attrelid = parent.oid and parent_tenant.attname = 'tenant_id'
    where fk.contype = 'f'
      and child_namespace.nspname = 'platform'
      and parent_namespace.nspname = 'platform'
      and not (
        child_tenant.attnum = any(fk.conkey)
        and parent_tenant.attnum = any(fk.confkey)
      )
  ),
  'a tenant-owned foreign key omits tenant_id'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_constraint fk
    join pg_class child on child.oid = fk.conrelid
    join pg_namespace child_namespace on child_namespace.oid = child.relnamespace
    join pg_class parent on parent.oid = fk.confrelid
    join pg_namespace parent_namespace on parent_namespace.oid = parent.relnamespace
    join pg_attribute child_environment
      on child_environment.attrelid = child.oid
      and child_environment.attname = 'environment_id'
    join pg_attribute parent_environment
      on parent_environment.attrelid = parent.oid
      and parent_environment.attname = 'environment_id'
    where fk.contype = 'f'
      and child_namespace.nspname = 'platform'
      and parent_namespace.nspname = 'platform'
      and not (
        child_environment.attnum = any(fk.conkey)
        and parent_environment.attnum = any(fk.confkey)
      )
  ),
  'an environment-owned foreign key omits environment_id'
);

select pg_temp.assert_true(
  (
    select count(*)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform'
      and not t.tgisinternal
      and t.tgname like '%__touch_version'
  ) = 19,
  'version trigger count differs'
);

select pg_temp.assert_true(
  (
    select array_agg(c.relname order by c.relname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform'
      and not t.tgisinternal
      and t.tgname like '%__append_only'
  ) = array[
    'approval_actions',
    'audit_events',
    'authorization_decisions',
    'delivery_attempts',
    'job_attempts'
  ],
  'append-only trigger inventory differs'
);

select pg_temp.assert_true(
  (
    select array_agg(c.relname order by c.relname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform'
      and not t.tgisinternal
      and t.tgname like '%__published_immutable'
  ) = array[
    'capability_exposures',
    'configuration_versions',
    'policy_rules',
    'policy_versions'
  ],
  'published-version trigger inventory differs'
);

-- Synthetic RLS and transaction-local context exercise.
begin;
set local role platform_api;

select platform_private.set_request_context(
  '018f0000-0000-7000-8000-000000000001'::uuid,
  '018f0000-0000-7000-8000-000000000001'::uuid,
  'user',
  '018f0000-0000-7000-8000-000000000101'::uuid,
  '018f0000-0000-7000-8000-000000000201'::uuid,
  'strong',
  '018f0000-0000-7000-8000-000000000301'::uuid
);

insert into platform.users (
  id,
  auth_subject,
  locale,
  timezone,
  status
) values (
  '018f0000-0000-7000-8000-000000000001'::uuid,
  'synthetic-auth-subject-a',
  'en-US',
  'UTC',
  'active'
);

insert into platform.tenants (
  id,
  name,
  type,
  status,
  default_timezone,
  base_currency,
  created_by
) values (
  '018f0000-0000-7000-8000-000000000101'::uuid,
  'Synthetic Tenant A',
  'team',
  'active',
  'UTC',
  'USD',
  '018f0000-0000-7000-8000-000000000001'::uuid
);

insert into platform.environments (
  id,
  tenant_id,
  code,
  kind,
  execution_mode,
  status
) values (
  '018f0000-0000-7000-8000-000000000201'::uuid,
  '018f0000-0000-7000-8000-000000000101'::uuid,
  'sandbox',
  'sandbox',
  'observe',
  'active'
);

select pg_temp.assert_true(
  (select count(*) from platform.tenants) = 1,
  'tenant A cannot read its own row'
);

do $cross_tenant_write$
begin
  begin
    insert into platform.environments (
      id,
      tenant_id,
      code,
      kind,
      execution_mode,
      status
    ) values (
      '018f0000-0000-7000-8000-000000000202'::uuid,
      '018f0000-0000-7000-8000-000000000102'::uuid,
      'forbidden',
      'sandbox',
      'observe',
      'active'
    );
    raise exception 'cross-tenant insert unexpectedly succeeded';
  exception
    when insufficient_privilege or check_violation or foreign_key_violation then
      null;
  end;
end;
$cross_tenant_write$;

rollback;

begin;
set local role platform_api;
select pg_temp.assert_true(
  platform.current_tenant_id() is null,
  'transaction-local tenant context leaked after rollback'
);
rollback;

select 'foundation migration SQL acceptance: pass' as result;
