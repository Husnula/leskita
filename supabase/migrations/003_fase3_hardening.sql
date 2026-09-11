-- Fase 3: audit_logs + storage avatars + RLS
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  actor_id uuid references auth.users(id),
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);
create index if not exists idx_audit_tenant_time on audit_logs(tenant_id, created_at desc);
alter table audit_logs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname='Teachers view own audit' and tablename='audit_logs') then
    create policy "Teachers view own audit" on audit_logs for select using (tenant_id = get_my_tenant_id() or is_admin());
  end if;
  if not exists (select 1 from pg_policies where policyname='Service can insert audit' and tablename='audit_logs') then
    create policy "Service can insert audit" on audit_logs for insert with check (true);
  end if;
end $$;

create or replace function audit_trigger_fn() returns trigger as $$
begin
  insert into audit_logs(tenant_id, actor_id, action, table_name, record_id, old_data, new_data)
  values (
    coalesce((new.tenant_id)::uuid, (old.tenant_id)::uuid),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce((new.id)::uuid, (old.id)::uuid),
    case when TG_OP <> 'INSERT' then to_jsonb(old) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end; $$ language plpgsql security definer;

drop trigger if exists trg_audit_students on students;
create trigger trg_audit_students after insert or update or delete on students for each row execute function audit_trigger_fn();
drop trigger if exists trg_audit_fees on fees;
create trigger trg_audit_fees after insert or update or delete on fees for each row execute function audit_trigger_fn();
drop trigger if exists trg_audit_sessions on sessions;
create trigger trg_audit_sessions after insert or update or delete on sessions for each row execute function audit_trigger_fn();

-- Storage: avatars bucket
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from pg_policies where policyname='Public read avatars' and tablename='objects') then
    create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where policyname='Authenticated upload avatars' and tablename='objects') then
    create policy "Authenticated upload avatars" on storage.objects for insert with check (bucket_id='avatars' and auth.role()='authenticated');
    create policy "Authenticated update avatars" on storage.objects for update using (bucket_id='avatars' and auth.role()='authenticated');
    create policy "Authenticated delete avatars" on storage.objects for delete using (bucket_id='avatars' and auth.role()='authenticated');
  end if;
end $$;
