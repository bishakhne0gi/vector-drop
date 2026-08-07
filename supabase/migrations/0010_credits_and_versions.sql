-- ============================================================
-- 0010_credits_and_versions.sql
-- Credit ledger, cached balances, unlocks, purchases, project versions.
--
-- Run via: supabase db push  (or paste into the Supabase SQL editor)
--
-- All tables key on Clerk user ids (text), consistent with 0008.
-- All tables enable RLS with NO policies: service-role access only, following
-- the legacy_user_map pattern in 0009. Money tables must be unreachable from
-- client code even by accident.
-- ============================================================

-- ─── project_versions ────────────────────────────────────────
-- Durable version history. Before this table, PATCH /api/projects/[id] wrote
-- every save to projects/{id}/output.svg, destroying the previous SVG. Versions
-- are content-addressed so identical artwork can never be stored — or charged
-- for — twice.
create table if not exists project_versions (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  user_id        text not null,
  version_number int  not null,
  content_hash   text not null,
  storage_path   text not null,
  source         text not null check (source in ('conversion','edit')),
  path_count     int,
  byte_size      int,
  created_at     timestamptz not null default now(),
  unique (project_id, content_hash),
  unique (project_id, version_number)
);

create index if not exists project_versions_project_idx
  on project_versions (project_id, version_number desc);

-- ─── user_credits (cached balance) ───────────────────────────
-- Denormalised balance so reads are one indexed lookup instead of a growing
-- SUM over the ledger. Mutated only by grant_units / spend_units (0011).
create table if not exists user_credits (
  user_id          text primary key,
  balance_units    int not null default 0 check (balance_units >= 0),
  lifetime_granted int not null default 0,
  lifetime_spent   int not null default 0,
  updated_at       timestamptz not null default now()
);

-- ─── credit_ledger (append-only truth) ───────────────────────
-- Never updated, never deleted. idempotency_key is UNIQUE — that constraint is
-- what makes a redelivered payment webhook grant credits exactly once.
create table if not exists credit_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  delta_units     int  not null,
  reason          text not null check (reason in
                    ('signup_grant','purchase','conversion','version_export',
                     'refund','admin_adjust')),
  balance_after   int  not null,
  idempotency_key text not null unique,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx
  on credit_ledger (user_id, created_at desc);

-- ─── unlocks ─────────────────────────────────────────────────
-- One row per thing the user has paid for. Presence means "already paid, serve
-- it free" — this is what makes re-downloads, format changes, and retried
-- requests cost nothing, by construction rather than by remembering to check.
create table if not exists unlocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  kind       text not null check (kind in ('conversion','version_export')),
  ref_id     uuid not null,
  ledger_id  uuid references credit_ledger(id),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists unlocks_user_kind_idx on unlocks (user_id, kind);

-- ─── purchases ───────────────────────────────────────────────
create table if not exists purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  dodo_payment_id text not null unique,
  amount_cents    int  not null,
  currency        text not null,
  credits_granted int  not null,
  status          text not null check (status in
                    ('pending','succeeded','failed','refunded')),
  raw_event       jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists purchases_user_idx on purchases (user_id, created_at desc);

-- ─── RLS: enabled, no policies (service-role only) ───────────
alter table project_versions enable row level security;
alter table user_credits     enable row level security;
alter table credit_ledger    enable row level security;
alter table unlocks          enable row level security;
alter table purchases        enable row level security;

-- ─── Guest project audit (reports only, deletes nothing) ─────
-- Guest projects predate the auth-only cutover. This surfaces the count so the
-- owner can decide what to do. NO ROWS ARE REMOVED HERE — making user_id NOT
-- NULL is a separate, later migration, run only after the count is reviewed.
do $$
declare guest_count int;
begin
  select count(*) into guest_count from projects where user_id is null;
  raise notice 'GUEST PROJECT AUDIT: % projects have user_id IS NULL', guest_count;
end $$;
