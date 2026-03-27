-- ============================================================
-- 0001_initial_schema.sql
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── projects ────────────────────────────────────────────────
create table if not exists projects (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  name                text not null default 'Untitled',
  source_image_path   text,
  source_image_hash   text,
  svg_path            text,
  ai_suggestions      jsonb,
  status              text not null default 'pending'
                        check (status in ('pending','converting','ready','error')),
  error_message       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute procedure set_updated_at();

create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists projects_source_image_hash_idx on projects(source_image_hash)
  where source_image_hash is not null;

-- ─── conversion_jobs ─────────────────────────────────────────
create table if not exists conversion_jobs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  step         text not null default 'upload'
                 check (step in ('upload','normalize','trace','assemble')),
  status       text not null default 'pending'
                 check (status in ('pending','running','done','failed')),
  started_at   timestamptz,
  completed_at timestamptz,
  error        jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists conversion_jobs_project_id_idx on conversion_jobs(project_id);

-- ─── ai_usage ────────────────────────────────────────────────
-- Tracks token consumption for cost monitoring (fire-and-forget writes)
create table if not exists ai_usage (
  id            uuid primary key default gen_random_uuid(),
  image_hash    text not null,
  input_tokens  integer not null,
  output_tokens integer not null,
  model         text not null,
  feature       text not null check (feature in ('analyze','restyle')),
  created_at    timestamptz not null default now()
);

create index if not exists ai_usage_image_hash_idx on ai_usage(image_hash);

-- ─── Row Level Security ───────────────────────────────────────

alter table profiles enable row level security;
alter table projects enable row level security;
alter table conversion_jobs enable row level security;
alter table ai_usage enable row level security;

-- profiles: users can only read/update their own row
create policy "profiles: owner select"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: owner update"
  on profiles for update
  using (id = auth.uid());

-- projects: full CRUD for owner only
create policy "projects: owner select"
  on projects for select
  using (user_id = auth.uid());

create policy "projects: owner insert"
  on projects for insert
  with check (user_id = auth.uid());

create policy "projects: owner update"
  on projects for update
  using (user_id = auth.uid());

create policy "projects: owner delete"
  on projects for delete
  using (user_id = auth.uid());

-- conversion_jobs: accessible to project owner via join
create policy "jobs: project owner select"
  on conversion_jobs for select
  using (
    exists (
      select 1 from projects
      where projects.id = conversion_jobs.project_id
        and projects.user_id = auth.uid()
    )
  );

-- jobs are written by the server pipeline (service-role bypasses RLS)
-- No insert/update policy needed for anon/authenticated role.

-- ai_usage: service-role only (no RLS policies for regular users)
-- No policies → authenticated users cannot read ai_usage rows.
