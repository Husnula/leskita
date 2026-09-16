-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Plans (Paket langganan untuk Guru)
create table plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  monthly_price numeric not null default 0,
  student_limit integer not null default 10,
  features jsonb default '{}'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tenants (Workspace Guru)
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  teacher_user_id uuid references auth.users(id) not null,
  workspace_name text not null,
  status text not null default 'TRIAL', -- TRIAL, ACTIVE, SUSPENDED
  plan_id uuid references plans(id),
  trial_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Profiles (Menyimpan role tambahan untuk user)
create table profiles (
  id uuid references auth.users(id) primary key,
  tenant_id uuid references tenants(id),
  name text,
  email text,
  role text not null check (role in ('ADMIN', 'TEACHER', 'PARENT')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Students (Data Siswa)
create table students (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  nickname text,
  parent_name text not null,
  parent_email text not null,
  parent_relation text,
  parent_phone text,
  phone text,
  student_phone text,
  emergency_phone text,
  school text,
  grade text,
  subject text not null,
  fee_type text not null default 'MONTHLY',
  fee_amount numeric not null default 0,
  fee_due_day integer not null default 10,
  status text not null default 'ACTIVE',
  birth_date date,
  gender text,
  address text,
  learning_goal text,
  learning_notes text,
  start_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Classes (Data Kelas)
create table classes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  class_type text not null check (class_type in ('INDIVIDUAL', 'GROUP')),
  subject text not null,
  default_fee_type text not null default 'PER_SESSION',
  default_fee_amount numeric not null default 0,
  duration_minutes integer not null default 90,
  location text,
  status text not null default 'ACTIVE',
  pricing_profile_id uuid, -- akan direferensikan nanti jika ada
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Class Members (Peserta Kelas)
create table class_members (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  class_id uuid references classes(id) not null,
  student_id uuid references students(id) not null,
  fee_type text not null default 'PER_SESSION',
  fee_amount numeric not null default 0,
  status text not null default 'ACTIVE',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Sessions (Sesi Belajar)
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  class_id uuid references classes(id),
  student_id uuid references students(id), -- jika kelas individual dan tak terikat tabel classes
  schedule_rule_id uuid, 
  start_at timestamp with time zone not null,
  duration_minutes integer not null default 90,
  subject text not null,
  location text,
  status text not null default 'SCHEDULED', -- SCHEDULED, DONE, CANCELLED
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Attendance (Kehadiran)
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  session_id uuid references sessions(id) not null,
  student_id uuid references students(id) not null,
  status text not null default 'PRESENT', -- PRESENT, ABSENT_BILLABLE, ABSENT_FREE
  billable boolean not null default true,
  note text,
  present_count integer,
  pricing_tier_id uuid,
  unit_price numeric not null default 0,
  charge_amount numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Reports (Laporan Belajar)
create table reports (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  session_id uuid references sessions(id) not null,
  student_id uuid references students(id) not null,
  class_id uuid references classes(id),
  material text not null,
  progress text not null,
  homework text,
  score numeric,
  teacher_note text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Fees (Tagihan)
create table fees (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  student_id uuid references students(id) not null,
  period text not null, -- format 'YYYY-MM'
  description text not null,
  amount numeric not null default 0,
  due_date date not null,
  status text not null default 'UNPAID', -- UNPAID, PARTIAL, PAID
  paid_at timestamp with time zone,
  payment_note text,
  source_type text default 'MANUAL', -- MANUAL, AUTOMATIC
  source_id text,
  quantity integer default 1,
  unit_amount numeric default 0,
  calculation_status text default 'FINAL', -- ESTIMATE, FINAL
  invoice_no text,
  invoice_file_id text,
  receipt_no text,
  receipt_file_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 11. Teacher Settings (Pengaturan Guru)
create table teacher_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) not null,
  teacher_name text not null,
  workspace_name text not null,
  phone text,
  payment_instructions text,
  default_fee_type text default 'PER_SESSION',
  default_fee_amount numeric default 0,
  default_due_day integer default 10,
  whatsapp_template text,
  form_enabled boolean default false,
  form_token text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);


-- ROW LEVEL SECURITY (RLS)
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;
alter table reports enable row level security;
alter table fees enable row level security;
alter table teacher_settings enable row level security;
alter table plans enable row level security;

-- Policies for Plans
create policy "Plans are viewable by everyone" on plans for select using (true);
create policy "Admins can manage plans" on plans for all using (is_admin());

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Helper function to get current user's tenant_id (for TEACHER)
create or replace function get_my_tenant_id()
returns uuid
language sql security definer set search_path = public, pg_temp as $
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$;

-- Helper function to check if current user is ADMIN
create or replace function is_admin()
returns boolean
language sql security definer set search_path = public, pg_temp as $
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer;

-- Policies for Tenants
create policy "Tenants are viewable by their teacher" on tenants for select using (teacher_user_id = auth.uid() or is_admin());
create policy "Admins can manage all tenants" on tenants for all using (is_admin());

-- Policies for Students
create policy "Teachers can view own tenant students" on students for select using (tenant_id = get_my_tenant_id() or is_admin());
create policy "Teachers can manage own tenant students" on students for all using (tenant_id = get_my_tenant_id());
-- Parent view policy: Parents can see students where parent_email = their auth email
create policy "Parents can view their children" on students for select using (parent_email = (auth.jwt() ->> 'email'));

-- Policies for Classes, Class Members, Sessions, Attendance, Reports, Fees, Settings (Teacher full access based on tenant_id)
create policy "Teachers can view own classes" on classes for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own classes" on classes for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own class_members" on class_members for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own class_members" on class_members for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own sessions" on sessions for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own sessions" on sessions for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own attendance" on attendance for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own attendance" on attendance for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own reports" on reports for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own reports" on reports for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own fees" on fees for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own fees" on fees for all using (tenant_id = get_my_tenant_id());

create policy "Teachers can view own settings" on teacher_settings for select using (tenant_id = get_my_tenant_id());
create policy "Teachers can manage own settings" on teacher_settings for all using (tenant_id = get_my_tenant_id());
