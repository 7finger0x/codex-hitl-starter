-- Required internal schema for foundation functions
create schema if not exists platform_private;

grant usage on schema platform_private to postgres;

create or replace function platform_private.touch_versioned_row()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
as $function$
begin

    if new.version is distinct from old.version then
        raise exception using
            errcode = '23514',
            message = 'caller-selected row versions are prohibited';
    end if;

    new.version := old.version + 1;
    new.updated_at := transaction_timestamp();

    return new;

end;
$function$;


create or replace function platform_private.reject_row_mutation()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
as $function$
begin

    raise exception using
        errcode = '55000',
        message = 'append-only row mutation is prohibited';

end;
$function$;


create or replace function platform_private.protect_outbox_payload()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
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
    end if;


    if tg_op <> 'UPDATE' then
        raise exception using
            errcode = '55000',
            message = 'unsupported outbox trigger operation';
    end if;


    old_document := to_jsonb(old);
    new_document := to_jsonb(new);


    if (old_document - mutable_columns)
       is distinct from
       (new_document - mutable_columns)
    then

        raise exception using
            errcode = '55000',
            message = 'outbox event identity or payload is immutable';

    end if;


    return new;

end;
$function$;


create or replace function platform_private.protect_published_version()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
as $function$

declare

    old_document jsonb := to_jsonb(old);
    lifecycle_status text;

begin

    lifecycle_status := old_document ->> 'status';


    if lifecycle_status is null then
        raise exception using
            errcode = '23514',
            message = 'publication lifecycle state is unavailable';
    end if;


    if lifecycle_status in
       ('effective','superseded','retired')
    then

        raise exception using
            errcode = '55000',
            message = 'published content is immutable';

    end if;


    if tg_op = 'DELETE' then
        return old;
    end if;


    return new;

end;
$function$;


create or replace function platform_private.protect_completed_evidence()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
as $function$

declare

    lifecycle_status text := to_jsonb(old)->>'status';

begin

    if lifecycle_status is null then
        raise exception using
            errcode='23514',
            message='evidence lifecycle state is unavailable';
    end if;


    if lifecycle_status in
       ('complete_pass',
        'complete_fail',
        'incomplete')
    then

        raise exception using
            errcode='55000',
            message='completed evidence is immutable';

    end if;


    if tg_op='DELETE' then
        return old;
    end if;


    return new;

end;
$function$;


create or replace function platform_private.guard_secret_reference_environment()
returns trigger
language plpgsql
set search_path = platform_private, pg_catalog
as $function$

begin

    return new;

end;
$function$;

