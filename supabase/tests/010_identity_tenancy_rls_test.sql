\set ON_ERROR_STOP on

-- T056 / US1 red test: real PostgreSQL catalog and RLS prerequisites.
-- Synthetic row fixtures and lifecycle functions arrive with T063; this test
-- must remain red until that separately approved migration is implemented.

begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $assertion$
begin
  if condition is distinct from true then
    raise exception 'US1 identity/RLS assertion failed: %', message;
  end if;
end;
$assertion$;

select pg_temp.assert_true(
  current_database() = 'platform_foundation_hcp03',
  'wrong disposable database'
);

select pg_temp.assert_true(
  coalesce(shobj_description(oid, 'pg_database'), '') =
    'DISPOSABLE:002-platform-foundation:HCP-03',
  'disposable database comment differs'
)
from pg_database
where datname = current_database();

select pg_temp.assert_true(
  (
    select array_agg(c.relname::text order by c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform'
      and c.relname in (
        'api_credentials',
        'environments',
        'invitations',
        'roles',
        'service_identities',
        'session_records',
        'teams',
        'tenant_members',
        'tenants',
        'users'
      )
      and c.relrowsecurity
      and c.relforcerowsecurity
  ) = array[
    'api_credentials',
    'environments',
    'invitations',
    'roles',
    'service_identities',
    'session_records',
    'teams',
    'tenant_members',
    'tenants',
    'users'
  ],
  'identity table RLS/FORCE inventory differs'
);

select pg_temp.assert_true(
  exists (
    select 1
    from pg_roles
    where rolname = 'platform_api'
      and not rolsuper
      and not rolbypassrls
      and not rolinherit
      and not rolcanlogin
  ),
  'platform_api role could bypass tenant RLS'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'platform'
      and tablename in (
        'api_credentials',
        'environments',
        'invitations',
        'roles',
        'service_identities',
        'session_records',
        'teams',
        'tenant_members',
        'tenants'
      )
      and (
        coalesce(qual, '') ~* '\mtrue\M'
        or coalesce(with_check, '') ~* '\mtrue\M'
      )
  ),
  'tenant RLS contains an unconditional policy expression'
);

select pg_temp.assert_true(
  (
    select array_agg(p.proname::text order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform'
      and p.proname in (
        'accept_invitation',
        'create_tenant',
        'select_session_context'
      )
  ) = array[
    'accept_invitation',
    'create_tenant',
    'select_session_context'
  ],
  'US1 guarded lifecycle functions are not implemented'
);

rollback;
