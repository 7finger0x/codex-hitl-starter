-- T039 / HCP-03 Option A: additive Phase 1 persistence bootstrap.
-- Apply only through the separately approved guarded PostgreSQL 17 path.
-- The caller supplies migration_sha256 from this exact source file.

revoke create on schema public from public;

create role platform_owner
with
  nologin
  inherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

create role platform_migrator
with
  nologin
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

create role platform_runtime
with
  nologin
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

create role platform_api
with
  nologin
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

create role platform_worker
with
  nologin
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

create role platform_evidence_reader
with
  nologin
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls;

grant platform_owner to platform_migrator;
grant platform_runtime to platform_api, platform_worker, platform_evidence_reader;

create schema
if not exists platform;
create schema
if not exists platform_private;

revoke all privileges on schema platform from public;
revoke all privileges on schema platform_private from public;

set local role
platform_owner;

alter default privileges for role platform_owner in schema platform
revoke all privileges on tables from public;
alter default privileges for role platform_owner in schema platform
revoke all privileges on sequences from public;
alter default privileges for role platform_owner in schema platform
revoke execute on functions from public;
alter default privileges for role platform_owner in schema platform_private
revoke all privileges on tables from public;
alter default privileges for role platform_owner in schema platform_private
revoke all privileges on sequences from public;
alter default privileges for role platform_owner in schema platform_private
revoke execute on functions from public;

create table platform_private.foundation_migration_ledger
(
  migration_id text primary key,
  source_sha256 text not null,
  applied_at timestamptz not null default transaction_timestamp(),
  applied_by name not null,
  tool_version text not null,
  constraint foundation_migration_ledger__migration_id_shape
    check (
      char_length(migration_id) between 1 and 128
    and migration_id
  ~ '^[0-9]{12}_[a-z][a-z0-9_]*$'
    ),
  constraint foundation_migration_ledger__source_sha256_shape
    check
  (source_sha256 ~ '^[0-9a-f]{64}$'),
  constraint foundation_migration_ledger__tool_version_shape
    check
  (char_length
  (tool_version) between 1 and 128)
);

  revoke all privileges on table platform_private.foundation_migration_ledger
  from public;
  grant select, insert on table platform_private.foundation_migration_ledger
  to platform_migrator;

  create function platform.current_user_id()
returns uuid
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select nullif(current_setting('platform.user_id', true), '')
  ::uuid
$function$;

  create function platform.current_principal_id()
returns uuid
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select nullif(current_setting('platform.principal_id', true), '')
  ::uuid
$function$;

  create function platform.current_principal_type()
returns text
language plpgsql
stable
  set search_path
  = pg_catalog
as $function$
  declare
  setting_value text := nullif
  (current_setting
  ('platform.principal_type', true), '');
  begin
    if setting_value is null then
    return null;
  end
  if;

  if setting_value not in ('user', 'service', 'support', 'system') then
    raise exception using
      errcode = '22023',
      message = 'invalid platform principal type';
  end
  if;

  return setting_value;
  end;
$function$;

  create function platform.current_tenant_id()
returns uuid
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select nullif(current_setting('platform.tenant_id', true), '')
  ::uuid
$function$;

  create function platform.current_environment_id()
returns uuid
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select nullif(current_setting('platform.environment_id', true), '')
  ::uuid
$function$;

  create function platform.current_authentication_strength()
returns text
language plpgsql
stable
  set search_path
  = pg_catalog
as $function$
  declare
  setting_value text := nullif
  (
    current_setting
  ('platform.authentication_strength', true),
    ''
  );
  begin
    if setting_value is null then
    return null;
  end
  if;

  if char_length(setting_value) > 64
    or setting_value !~ '^[a-z][a-z0-9_]*$'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid platform authentication strength';
  end
  if;

  return setting_value;
  end;
$function$;

  create function platform.current_correlation_id()
returns uuid
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select nullif(current_setting('platform.correlation_id', true), '')
  ::uuid
$function$;

  create function platform_private.set_request_context(
  p_user_id uuid,
  p_principal_id uuid,
  p_principal_type text,
  p_tenant_id uuid,
  p_environment_id uuid,
  p_authentication_strength text,
  p_correlation_id uuid
)
returns void
language plpgsql
security definer
  set search_path
  = pg_catalog
as $function$
  begin
    if p_user_id is null
      or p_principal_id is null
      or p_tenant_id is null
      or p_environment_id is null
      or p_correlation_id is null
  then
    raise exception using
      errcode = '22004',
      message = 'request context UUID values must be non-null';
  end
  if;

  if p_principal_type is null
    or p_principal_type not in ('user', 'service', 'support', 'system')
  then
    raise exception using
      errcode = '22023',
      message = 'invalid request principal type';
  end
  if;

  if p_authentication_strength is null
    or char_length(p_authentication_strength) not between 1 and 64
    or p_authentication_strength !~ '^[a-z][a-z0-9_]*$'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid request authentication strength';
  end
  if;

  perform set_config
  ('platform.user_id', p_user_id::text, true);
  perform set_config
  ('platform.principal_id', p_principal_id::text, true);
  perform set_config
  ('platform.principal_type', p_principal_type, true);
  perform set_config
  ('platform.tenant_id', p_tenant_id::text, true);
  perform set_config
  ('platform.environment_id', p_environment_id::text, true);
  perform set_config
  (
    'platform.authentication_strength',
    p_authentication_strength,
    true
  );
  perform set_config
  ('platform.correlation_id', p_correlation_id::text, true);
  end;
$function$;

  create function platform_private.clear_request_context()
returns void
language plpgsql
  set search_path
  = pg_catalog
as $function$
  begin
  perform set_config
  ('platform.user_id', '', true);
  perform set_config
  ('platform.principal_id', '', true);
  perform set_config
  ('platform.principal_type', '', true);
  perform set_config
  ('platform.tenant_id', '', true);
  perform set_config
  ('platform.environment_id', '', true);
  perform set_config
  ('platform.authentication_strength', '', true);
  perform set_config
  ('platform.correlation_id', '', true);
  end;
$function$;

  create function platform_private.require_request_context()
returns void
language plpgsql
stable
  set search_path
  = pg_catalog
as $function$
  begin
    if platform.current_principal_id() is null
      or platform.current_principal_type() is null
      or platform.current_tenant_id() is null
      or platform.current_environment_id() is null
      or platform.current_authentication_strength() is null
      or platform.current_correlation_id() is null
  then
    raise exception using
      errcode = '22004',
      message = 'verified request context is required';
  end
  if;
end;
$function$;

  create function platform_private.tenant_matches(candidate_tenant_id uuid)
returns boolean
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select candidate_tenant_id
  is not null
    and platform.current_tenant_id
  () is not null
    and candidate_tenant_id = platform.current_tenant_id
  ()
$function$;

  create function platform_private.environment_matches(
  candidate_tenant_id uuid,
  candidate_environment_id uuid
)
returns boolean
language sql
stable
  set search_path
  = pg_catalog
as $function$
  select candidate_tenant_id
  is not null
    and candidate_environment_id is not null
    and platform.current_tenant_id
  () is not null
    and platform.current_environment_id
  () is not null
    and candidate_tenant_id = platform.current_tenant_id
  ()
    and candidate_environment_id = platform.current_environment_id
  ()
$function$;

  create function platform_private.touch_versioned_row()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  begin
    if new.version is distinct from old.version then
    raise exception using
      errcode = '23514',
      message = 'caller-selected row versions are prohibited';
  end
  if;

  new.version := old.version + 1;
  new.updated_at := transaction_timestamp
  ();
  return new;
  end;
$function$;

  create function platform_private.reject_row_mutation()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  begin
  raise exception using
    errcode = '55000',
    message = 'append-only row mutation is prohibited';
  end;
$function$;

  create function platform_private.protect_outbox_payload()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  declare
  old_document jsonb;
  new_document jsonb;
  mutable_columns constant text[] := array[
    'state',
    'lease_owner',
    'lease_expires_at',
    'delivery_attempt_count',
    'published_at',
    'reconciled_at',
    'last_error_code',
    'next_attempt_at',
    'updated_at',
    'version'
  ];
  begin
    if tg_op = 'DELETE' then
    raise exception using
      errcode = '55000',
      message = 'outbox deletion is prohibited';
  end
  if;

  if tg_op <> 'UPDATE' then
    raise exception using
      errcode = '55000',
      message = 'unsupported outbox trigger operation';
  end
  if;

  old_document := to_jsonb
  (old);
  new_document := to_jsonb
  (new);

  if (old_document - mutable_columns) is distinct from
    (new_document - mutable_columns)
  then
    raise exception using
      errcode = '55000',
      message = 'outbox event identity or payload is immutable';
  end
  if;

  return new;
  end;
$function$;

  create function platform_private.protect_published_version()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  declare
  old_document jsonb := to_jsonb
  (old);
  lifecycle_status text;
  policy_tenant_id uuid;
  policy_environment_id uuid;
  policy_version_id uuid;
  begin
    if tg_table_name = 'policy_rules' then
    policy_tenant_id :=
    (old_document ->> 'tenant_id')::uuid;
  policy_environment_id :=
  (old_document ->> 'environment_id')::uuid;
    policy_version_id :=
  (old_document ->> 'policy_version_id')::uuid;

  execute
      'select status from platform.policy_versions '
  'where tenant_id = $1 and environment_id = $2 and id = $3'
      into lifecycle_status
      using policy_tenant_id, policy_environment_id, policy_version_id;

  if not found then
      raise exception using
        errcode = '23514',
        message = 'policy rule version state is unavailable';
  end
  if;
  else
    lifecycle_status := old_document ->> 'status';
  end
  if;

  if lifecycle_status is null then
    raise exception using
      errcode = '23514',
      message = 'publication lifecycle state is unavailable';
  end
  if;

  if lifecycle_status in ('effective', 'superseded', 'retired') then
    raise exception using
      errcode = '55000',
      message = 'published content is immutable';
  end
  if;

  if tg_op = 'DELETE' then
  return old;
  end
  if;

  return new;
  end;
$function$;

  create function platform_private.protect_completed_evidence()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  declare
  lifecycle_status text := to_jsonb
  (old) ->> 'status';
  begin
    if lifecycle_status is null then
    raise exception using
      errcode = '23514',
      message = 'evidence lifecycle state is unavailable';
  end
  if;

  if lifecycle_status in ('complete_pass', 'complete_fail', 'incomplete') then
    raise exception using
      errcode = '55000',
      message = 'completed evidence is immutable';
  end
  if;

  if tg_op = 'DELETE' then
  return old;
  end
  if;

  return new;
  end;
$function$;

  create function platform_private.guard_secret_reference_environment()
returns trigger
language plpgsql
  set search_path
  = pg_catalog
as $function$
  declare
  new_document jsonb := to_jsonb
  (new);
  row_tenant_id uuid;
  row_environment_id uuid;
  target_environment_kind text;
  reference_ids jsonb;
  reference_id_text text;
  reference_id uuid;
  reference_classification text;
  reference_environment_id uuid;
  begin
  row_tenant_id :=
  (new_document ->> 'tenant_id')::uuid;
  row_environment_id :=
  (new_document ->> 'environment_id')::uuid;

  if row_tenant_id is null or row_environment_id is null then
    raise exception using
      errcode = '23502',
      message = 'secret-reference guard requires tenant and environment';
  end
  if;

  execute
    'select kind from platform.environments '
  'where tenant_id = $1 and id = $2'
    into target_environment_kind
    using row_tenant_id, row_environment_id;

  if not found then
    raise exception using
      errcode = '23503',
      message = 'secret-reference environment is unavailable';
  end
  if;

  if tg_table_name = 'secret_references' then
    reference_classification := new_document ->> 'classification';

  if reference_classification is null then
      raise exception using
        errcode = '23514',
        message = 'secret-reference classification is required';
  end
  if;

    if reference_classification = 'production'
    and target_environment_kind <> 'production'
    then
      raise exception using
        errcode = '23514',
        message = 'production secret reference requires production environment';
  end
  if;
  elsif tg_table_name = 'configuration_versions' then
    reference_ids := coalesce
  (
      new_document -> 'secret_reference_ids',
      '[]'::jsonb
    );

  if jsonb_typeof(reference_ids) <> 'array' then
      raise exception using
        errcode = '23514',
        message = 'configuration secret references must be an array';
  end
  if;

    for reference_id_text in
  select value
  from jsonb_array_elements_text(reference_ids) as reference_values(value)
  loop
  begin
        reference_id := reference_id_text::uuid;
      exception
        when invalid_text_representation then
          raise exception using
            errcode = '23514',
            message = 'configuration secret reference ID is malformed';
  end;

  execute
        'select classification, environment_id '
  'from platform.secret_references '
        'where tenant_id = $1 and id = $2'
        into reference_classification, reference_environment_id
        using row_tenant_id, reference_id;

  if not found then
        raise exception using
          errcode = '23503',
          message = 'configuration secret reference is unavailable';
  end
  if;

      if reference_environment_id <> row_environment_id then
        raise exception using
          errcode = '23514',
          message = 'configuration secret reference crosses environments';
  end
  if;

      if reference_classification = 'production'
    and target_environment_kind <> 'production'
      then
        raise exception using
          errcode = '23514',
          message = 'production secret reference requires production environment';
  end
  if;
    end loop;
  else
    raise exception using
      errcode = '23514',
      message = 'secret-reference guard attached to an unapproved table';
  end
  if;

  return new;
  end;
$function$;

  revoke execute on all functions in schema platform from public;
  revoke execute on all functions in schema platform_private from public;

  grant usage on schema platform
  to platform_runtime, platform_api, platform_worker, platform_evidence_reader;

  grant execute on function
  platform.current_user_id
  (),
  platform.current_principal_id
  (),
  platform.current_principal_type
  (),
  platform.current_tenant_id
  (),
  platform.current_environment_id
  (),
  platform.current_authentication_strength
  (),
  platform.current_correlation_id
  ()
  to platform_runtime, platform_api, platform_worker, platform_evidence_reader;

  -- HCP-03 T039 amendment: only these concrete roles can resolve private helpers.
  grant usage on schema platform_private
  to platform_api, platform_worker, platform_evidence_reader;

  grant execute on function platform_private.set_request_context
  (
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  text,
  uuid
) to platform_api, platform_worker;

  grant execute on function
  platform_private.require_request_context
  (),
  platform_private.tenant_matches
  (uuid),
  platform_private.environment_matches
  (uuid, uuid)
  to platform_api, platform_worker, platform_evidence_reader;

  insert into platform_private.foundation_migration_ledger
    (
    migration_id,
    source_sha256,
    applied_by,
    tool_version
    )
  values
    (
      '202607100001_foundation_bootstrap',
      :'migration_sha256',
      session_user,
      'psql-17'
);
