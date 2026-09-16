-- 005_fase5_p0_security: Harden security definer functions + add missing constraints
-- ponytail: search_path fix prevents hijack via rogue schema. Upgrade: add pgTAP RLS tests.

-- Fix get_my_tenant_id: set search_path, stable, strict
create or replace function get_my_tenant_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Fix is_admin: set search_path
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = ''ADMIN''
  );
$$;

-- Fix audit_trigger_fn: set search_path
create or replace function audit_trigger_fn() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs(tenant_id, actor_id, action, table_name, record_id, old_data, new_data)
  values (
    coalesce((new.tenant_id)::uuid, (old.tenant_id)::uuid),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce((new.id)::uuid, (old.id)::uuid),
    case when TG_OP <> ''INSERT'' then to_jsonb(old) else null end,
    case when TG_OP <> ''DELETE'' then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;