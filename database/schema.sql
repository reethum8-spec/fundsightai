-- FundSight AI — Supabase / PostgreSQL schema (Phase 3 target)
-- Run inside Supabase SQL editor. Idempotent on first run.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------- Users & Orgs ----------------
create type user_role as enum ('personal', 'org_admin', 'team_member', 'super_admin');

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  full_name text,
  email text unique,
  role user_role not null default 'personal',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------- Funds / Projects ----------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  owner_id uuid references profiles(id) on delete set null,
  project_name text not null,
  category text not null,
  budget numeric(14, 2) not null check (budget >= 0),
  expected_impact text,
  beneficiaries_count integer default 0,
  deadline date,
  status text not null default 'active', -- active | paused | closed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_org on projects(organization_id);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_budgets_project on budgets(project_id);

-- ---------------- Expenses ----------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  amount numeric(14, 2) not null check (amount >= 0),
  category text not null,
  description text,
  payment_method text,
  location text,
  beneficiary text,
  receipt_url text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now(),
  anomaly_flag boolean not null default false,
  anomaly_score numeric(6, 4)
);
create index if not exists idx_expenses_project on expenses(project_id);
create index if not exists idx_expenses_org on expenses(organization_id);
create index if not exists idx_expenses_occurred on expenses(occurred_at);

-- ---------------- AI predictions / alerts ----------------
create table if not exists ai_predictions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  model text not null,            -- e.g. 'isolation_forest', 'rf_overrun'
  prediction jsonb not null,
  confidence numeric(5, 4),
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_predictions_project on ai_predictions(project_id);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  expense_id uuid references expenses(id) on delete set null,
  type text not null,             -- 'anomaly' | 'overrun' | 'misuse' | 'efficiency'
  severity text not null default 'info',  -- info | warn | critical
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_org on alerts(organization_id);

-- ---------------- Reports / Files ----------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  generated_by uuid references profiles(id) on delete set null,
  title text not null,
  period_start date,
  period_end date,
  summary jsonb,
  pdf_url text,
  created_at timestamptz not null default now()
);

create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  uploader_id uuid references profiles(id) on delete set null,
  related_entity text,            -- 'expense' | 'project' | 'report'
  related_id uuid,
  file_url text not null,
  file_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

-- ---------------- Profile auto-creation on signup ----------------
-- Whenever a new auth.users row is inserted (via email signup or OAuth),
-- create a matching profiles row populated from user_metadata.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'personal'::user_role)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------- Updated-at trigger ----------------
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
for each row execute function set_updated_at();

-- ---------------- Row Level Security ----------------
alter table profiles          enable row level security;
alter table organizations     enable row level security;
alter table projects          enable row level security;
alter table budgets           enable row level security;
alter table expenses          enable row level security;
alter table ai_predictions    enable row level security;
alter table alerts            enable row level security;
alter table reports           enable row level security;
alter table uploaded_files    enable row level security;

-- Profile self-access
drop policy if exists "profile self read" on profiles;
create policy "profile self read" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profile self update" on profiles;
create policy "profile self update" on profiles
  for update using (auth.uid() = id);

-- Same-org read for tenant tables (helper function)
create or replace function current_org_id() returns uuid
language sql stable as $$
  select organization_id from profiles where id = auth.uid()
$$;

do $$
declare t text;
begin
  for t in select unnest(array['projects','budgets','expenses','ai_predictions','alerts','reports','uploaded_files'])
  loop
    execute format($f$
      drop policy if exists "%1$s tenant read" on %1$s;
      create policy "%1$s tenant read" on %1$s
        for select using (organization_id = current_org_id());
      drop policy if exists "%1$s tenant write" on %1$s;
      create policy "%1$s tenant write" on %1$s
        for all using (organization_id = current_org_id())
        with check (organization_id = current_org_id());
    $f$, t);
  end loop;
end $$;
