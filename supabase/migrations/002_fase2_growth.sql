-- Fase 2: recurring rules + notif helper
create table if not exists schedule_rules (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  student_id uuid references students(id),
  class_id uuid references classes(id),
  subject text not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  duration_minutes int not null default 90,
  location text,
  active boolean default true,
  created_at timestamptz default timezone('utc'::text, now())
);
create index if not exists idx_rules_tenant on schedule_rules(tenant_id);
create index if not exists idx_rules_active on schedule_rules(tenant_id, active);
create index if not exists idx_tenants_trial_end on tenants(trial_end) where status = 'TRIAL';
alter table schedule_rules enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Teachers can manage own rules' and tablename='schedule_rules') then
    create policy "Teachers can manage own rules" on schedule_rules for all using (tenant_id = get_my_tenant_id());
    create policy "Teachers can view own rules" on schedule_rules for select using (tenant_id = get_my_tenant_id());
  end if;
end $$;
-- cron suspend helper (jalankan via pg_cron atau Edge Function harian):
-- update tenants set status='SUSPENDED' where status='TRIAL' and trial_end < now();
-- docs: supabase/functions/cron-suspend-trials/index.ts (TODO Fase 3)
