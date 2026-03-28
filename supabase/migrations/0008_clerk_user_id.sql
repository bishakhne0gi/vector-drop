-- Clerk user IDs are strings (e.g. "user_2abc..."), not UUIDs.
-- Change user_id columns from uuid to text across all tables.

-- projects
alter table projects
  drop constraint if exists projects_user_id_fkey,
  alter column user_id type text using user_id::text;

-- icons
alter table icons
  drop constraint if exists icons_user_id_fkey,
  alter column user_id type text using user_id::text;

-- profiles (if you keep it)
alter table profiles
  alter column id type text using id::text;

-- Drop RLS policies that reference auth.uid() — no longer applicable with Clerk
-- (authorization is now handled explicitly in API routes via requireAuth())
drop policy if exists "projects: owner select" on projects;
drop policy if exists "projects: owner insert" on projects;
drop policy if exists "projects: owner update" on projects;
drop policy if exists "projects: owner delete" on projects;
drop policy if exists "Public icons viewable by everyone" on icons;
drop policy if exists "Users can insert own icons" on icons;
drop policy if exists "Users can update own icons" on icons;
drop policy if exists "Users can delete own icons" on icons;

-- Disable RLS since auth is now handled at the application layer
alter table projects disable row level security;
alter table icons disable row level security;
