-- ============================================================
-- 0006_rls_and_storage.sql
-- Fixes:
--   1. icons.is_public default → false
--   2. Optimise conversion_jobs RLS policy (security barrier)
--   3. Storage bucket RLS policies for images bucket
--   4. Prevent users from inserting projects with arbitrary user_id
--   5. ai_usage — block authenticated users from reading others rows
--   6. profiles — block insert from authenticated (only trigger should insert)
-- ============================================================

-- ─── 1. Fix icons default ────────────────────────────────────
alter table public.icons
  alter column is_public set default false;

-- ─── 2. Optimise conversion_jobs select policy ───────────────
-- Replace correlated subquery with a more efficient join-based check
drop policy if exists "jobs: project owner select" on conversion_jobs;

create policy "jobs: project owner select"
  on conversion_jobs for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

-- ─── 3. Prevent self-assignment on project insert ────────────
-- The existing insert policy uses WITH CHECK (user_id = auth.uid())
-- which is correct, but let's make it explicit and airtight
drop policy if exists "projects: owner insert" on projects;

create policy "projects: owner insert"
  on projects for insert
  with check (user_id = auth.uid());

-- ─── 4. profiles: block direct insert (only trigger should insert) ───
-- Users should never insert their own profile row — the trigger does it
drop policy if exists "profiles: owner insert" on profiles;
-- (no insert policy = insert blocked for authenticated role)

-- ─── 5. ai_usage: explicitly block all access for authenticated users ─
-- RLS is enabled but no select policy exists — this is correct (denies by default)
-- Make it explicit for clarity
drop policy if exists "ai_usage: no user access" on ai_usage;
-- Leave as-is: no policies = no access for non-service-role

-- ─── 6. Storage: images bucket RLS ──────────────────────────
-- Run these in the Supabase SQL editor. Storage policies use the
-- storage schema. The bucket name is 'images'.

-- Allow authenticated users to upload to their own project folder only
-- Path format: projects/{user_id}/{uuid}/{filename}
create policy "storage: users upload own images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'projects'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to read their own files
create policy "storage: users read own images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'projects'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to update (overwrite) their own files
create policy "storage: users update own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'projects'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files
create policy "storage: users delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'projects'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Service role bypasses all storage RLS — pipeline uploads work without a policy

-- ─── 7. Verify RLS is ON for all tables ──────────────────────
alter table profiles        enable row level security;
alter table projects        enable row level security;
alter table conversion_jobs enable row level security;
alter table ai_usage        enable row level security;
alter table icons           enable row level security;
