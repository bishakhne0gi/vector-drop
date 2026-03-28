-- ============================================================
-- 0005_security_fixes.sql
-- Fixes:
--   1. Atomic icon download_count increment (eliminates read-modify-write race)
--   2. Add missing svg_url column to projects (used by application code)
--   3. Add generate-icon to ai_usage feature check constraint
-- ============================================================

-- 1. Atomic download counter increment
-- Called server-side via service-role — no RLS bypass needed for the caller.
create or replace function increment_download_count(icon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update icons
  set download_count = download_count + 1
  where id = icon_id;
$$;

-- 2. svg_url column (short-lived; populated at read-time, not stored permanently)
-- This column is kept nullable — application code generates URLs on demand and
-- may clear the column. The 10-year TTL pattern has been removed.
alter table projects
  add column if not exists svg_url text;

-- 3. Expand ai_usage feature check to include generate-icon
alter table ai_usage
  drop constraint if exists ai_usage_feature_check;

alter table ai_usage
  add constraint ai_usage_feature_check
  check (feature in ('analyze', 'restyle', 'generate-icon'));

-- 4. Add user_id to ai_usage for cost attribution
alter table ai_usage
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists ai_usage_user_id_idx on ai_usage(user_id)
  where user_id is not null;
