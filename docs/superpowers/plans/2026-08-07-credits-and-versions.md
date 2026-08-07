# Credits, Versions, and Dodo Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn VectorDrop into a paid product: durable version history, credit-metered conversions and edited-version exports, and Dodo checkout — with a free grant generous enough to finish two real projects.

**Architecture:** An append-only `credit_ledger` is the source of truth; `user_credits` caches the balance; an `unlocks` table makes every charge idempotent by `(user_id, kind, ref_id)`. Two Postgres functions (`grant_units`, `spend_units`) own all balance mutation — no route mutates the balance directly. Versions become first-class rows addressed by canonical content hash, so identical artwork is never charged twice.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (service-role, RLS-disabled app tables), Clerk, Upstash Redis, Dodo Payments, svix, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-07-credits-and-versions-design.md`

## Global Constraints

- **Money is integers.** 1 credit = 10 units. No floats touch a balance, ever. `UNITS_PER_CREDIT = 10`, `CONVERSION_UNITS = 10`, `VERSION_EXPORT_UNITS = 1`.
- **Prices live in `lib/credits/constants.ts` only.** No route, component, or test hardcodes a cost.
- **All balance mutation goes through `grant_units` / `spend_units`.** Never `UPDATE user_credits` from application code.
- **Debit after the work succeeds, never before.** Pre-checks may reject early; the authoritative spend happens once the deliverable exists.
- **New tables: RLS enabled, zero policies** (service-role only), matching `legacy_user_map` in migration 0009.
- **User IDs are Clerk strings (`text`)**, not UUIDs — migration 0008 converted every table.
- **Pricing copy always says "+ tax".** Dodo adds tax on top of $3.00; the checkout total is higher than the advertised price.
- **Migrations are applied with `supabase db push`.**
- **Do NOT run `git commit` unless the user asks in the current turn.** Steps labelled "Commit" mean: stage the files and tell the user the work is ready to commit. This overrides the usual TDD-commit rhythm.
- **The only Supabase project is production.** DB-touching tests use throwaway `test_*` user IDs and clean up after themselves, gated behind `RUN_DB_TESTS=1`.
- **Read Dodo's live documentation before writing the Dodo client.** Do not write payment API calls from memory.

## File Structure

**Create:**
- `lib/credits/constants.ts` — unit maths, cost table, display formatting
- `lib/credits/keys.ts` — idempotency key construction
- `lib/credits/service.ts` — typed wrappers over the two Postgres functions
- `lib/versions/service.ts` — create/list/resolve project versions
- `lib/payments/dodo.ts` — Dodo client (checkout session creation)
- `supabase/migrations/0010_credits_and_versions.sql` — tables + backfill
- `supabase/migrations/0011_credit_functions.sql` — `grant_units`, `spend_units`
- `app/api/credits/route.ts` — `GET` current balance
- `app/api/payments/checkout/route.ts` — create Dodo checkout session
- `app/api/webhooks/dodo/route.ts` — grant units on payment
- `app/api/projects/[id]/versions/route.ts` — `GET` version list
- `app/(marketing)/pricing/page.tsx` — public pricing page
- `components/shared/CreditBadge.tsx` — always-visible balance
- `components/shared/BuyCreditsModal.tsx` — 402 handler / checkout entry
- `components/editor/VersionPanel.tsx` — version history
- `scripts/backfill-credits.ts` — grant to existing users, grandfather existing projects
- Tests alongside each

**Modify:**
- `lib/types.ts` — `PAYMENT_REQUIRED`, `AppError.paymentRequired`, domain types
- `app/api/projects/[id]/convert/route.ts` — version 1 + conversion metering + drop guest branch
- `app/api/projects/[id]/route.ts` — PATCH appends a version instead of overwriting
- `app/api/projects/[id]/export/route.ts` — `versionId` param + export metering
- `app/api/webhooks/clerk/route.ts` — signup grant
- `app/api/projects/route.ts` — drop guest `ids=` branch
- `app/(app)/dashboard/page.tsx` — drop guest helpers
- `components/shared/ProjectCard.tsx` — drop `isGuest`
- `components/shared/Navbar.tsx` — mount `CreditBadge`
- `components/editor/Toolbar.tsx` — export button cost states
- `proxy.ts` — protect `/dashboard` and `/icons`
- `.env.local` / Vercel — `DODO_CREDITS_PRODUCT_ID`, `DODO_PAYMENTS_ENV=test_mode`

**Delete:**
- `app/api/projects/claim/route.ts`

---

## Phase 1 — Credit foundation

### Task 1: Credit constants and idempotency keys

**Files:**
- Create: `lib/credits/constants.ts`, `lib/credits/keys.ts`
- Test: `__tests__/unit/credits/constants.test.ts`, `__tests__/unit/credits/keys.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `UNITS_PER_CREDIT`, `CONVERSION_UNITS`, `VERSION_EXPORT_UNITS`, `SIGNUP_GRANT_UNITS`, `PURCHASE_GRANT_UNITS`, `PACK_PRICE_CENTS`, `formatCredits(units: number): string`, `creditsToUnits(c: number): number`; and `ledgerKeys.signup(userId)`, `ledgerKeys.purchase(paymentId)`, `ledgerKeys.conversion(projectId)`, `ledgerKeys.versionExport(userId, versionId)`, `ledgerKeys.refund(paymentId)`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/unit/credits/constants.test.ts
import { describe, it, expect } from "vitest";
import {
  UNITS_PER_CREDIT, CONVERSION_UNITS, VERSION_EXPORT_UNITS,
  SIGNUP_GRANT_UNITS, PURCHASE_GRANT_UNITS, PACK_PRICE_CENTS,
  formatCredits, creditsToUnits,
} from "@/lib/credits/constants";

describe("credit constants", () => {
  it("uses tenths of a credit as the base unit", () => {
    expect(UNITS_PER_CREDIT).toBe(10);
    expect(CONVERSION_UNITS).toBe(10);      // 1 credit
    expect(VERSION_EXPORT_UNITS).toBe(1);   // 0.1 credits
  });

  it("grants 3 credits at signup — two projects with edits", () => {
    expect(SIGNUP_GRANT_UNITS).toBe(30);
  });

  it("grants 20 credits per $3.00 purchase", () => {
    expect(PURCHASE_GRANT_UNITS).toBe(200);
    expect(PACK_PRICE_CENTS).toBe(300);
  });
});

describe("formatCredits", () => {
  it("renders whole credits without a decimal", () => {
    expect(formatCredits(30)).toBe("3");
    expect(formatCredits(0)).toBe("0");
  });

  it("renders fractional credits with one decimal", () => {
    expect(formatCredits(19)).toBe("1.9");
    expect(formatCredits(1)).toBe("0.1");
  });

  it("never produces floating point noise", () => {
    // 0.1 + 0.2 !== 0.3 in floats; units must sidestep this entirely.
    expect(formatCredits(3)).toBe("0.3");
  });
});

describe("creditsToUnits", () => {
  it("converts credits to integer units", () => {
    expect(creditsToUnits(1)).toBe(10);
    expect(creditsToUnits(0.1)).toBe(1);
    expect(creditsToUnits(20)).toBe(200);
  });

  it("always returns an integer", () => {
    expect(Number.isInteger(creditsToUnits(0.3))).toBe(true);
  });
});
```

```ts
// __tests__/unit/credits/keys.test.ts
import { describe, it, expect } from "vitest";
import { ledgerKeys } from "@/lib/credits/keys";

describe("ledgerKeys", () => {
  it("builds structural, repeatable keys", () => {
    expect(ledgerKeys.signup("user_abc")).toBe("signup:user_abc");
    expect(ledgerKeys.purchase("pay_1")).toBe("dodo:pay_1");
    expect(ledgerKeys.conversion("proj-1")).toBe("convert:proj-1");
    expect(ledgerKeys.versionExport("user_abc", "ver-1")).toBe("export:user_abc:ver-1");
    expect(ledgerKeys.refund("pay_1")).toBe("refund:pay_1");
  });

  it("is deterministic — the same inputs always give the same key", () => {
    // This is the entire idempotency guarantee. If these ever differ,
    // a retried webhook grants credits twice.
    expect(ledgerKeys.purchase("pay_1")).toBe(ledgerKeys.purchase("pay_1"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run __tests__/unit/credits/`
Expected: FAIL — "Cannot find module '@/lib/credits/constants'"

- [ ] **Step 3: Implement**

```ts
// lib/credits/constants.ts
/**
 * Credit arithmetic.
 *
 * Balances are integers in UNITS, where 1 credit = 10 units. Money-adjacent
 * values never use floating point: 0.1 + 0.2 !== 0.3 in IEEE 754, and a
 * rounding error in a balance is a billing bug.
 *
 * Every price in the product is defined here and nowhere else.
 */
export const UNITS_PER_CREDIT = 10;

/** Converting one image to vector. 1 credit. */
export const CONVERSION_UNITS = 10;

/** Exporting one edited version, once, in any format. 0.1 credits. */
export const VERSION_EXPORT_UNITS = 1;

/** Signup grant: two conversions plus ten edited exports. 3 credits. */
export const SIGNUP_GRANT_UNITS = 30;

/** One purchase. 20 credits. */
export const PURCHASE_GRANT_UNITS = 200;

/** Pack price in USD cents, exclusive of tax (Dodo adds tax on top). */
export const PACK_PRICE_CENTS = 300;

/** Renders units for humans: 30 -> "3", 19 -> "1.9". */
export function formatCredits(units: number): string {
  const whole = Math.trunc(units / UNITS_PER_CREDIT);
  const remainder = units % UNITS_PER_CREDIT;
  return remainder === 0 ? String(whole) : `${whole}.${Math.abs(remainder)}`;
}

/** Converts a credit amount to integer units. */
export function creditsToUnits(credits: number): number {
  return Math.round(credits * UNITS_PER_CREDIT);
}
```

```ts
// lib/credits/keys.ts
/**
 * Idempotency keys for the credit ledger.
 *
 * These are structural, not random: the same real-world event always produces
 * the same key, and `credit_ledger.idempotency_key` is UNIQUE. That is what
 * makes a Dodo webhook delivered five times grant credits exactly once.
 */
export const ledgerKeys = {
  signup: (userId: string) => `signup:${userId}`,
  purchase: (paymentId: string) => `dodo:${paymentId}`,
  conversion: (projectId: string) => `convert:${projectId}`,
  versionExport: (userId: string, versionId: string) => `export:${userId}:${versionId}`,
  refund: (paymentId: string) => `refund:${paymentId}`,
} as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run __tests__/unit/credits/`
Expected: PASS (all)

- [ ] **Step 5: Stage and report**

```bash
git add lib/credits __tests__/unit/credits
```
Tell the user it is ready to commit as `feat(credits): add credit constants and idempotency keys`. Do not run `git commit`.

---

### Task 2: Schema migration

**Files:**
- Create: `supabase/migrations/0010_credits_and_versions.sql`

**Interfaces:**
- Consumes: nothing
- Produces: tables `project_versions`, `user_credits`, `credit_ledger`, `unlocks`, `purchases`

- [ ] **Step 1: Write the migration**

```sql
-- 0010_credits_and_versions.sql
-- Credit ledger, cached balances, unlocks, purchases, and project versions.
--
-- All tables key on Clerk user ids (text), consistent with 0008.
-- All tables enable RLS with NO policies: service-role access only, following
-- the legacy_user_map pattern in 0009. Money tables must be unreachable from
-- client code even by accident.

-- ─── project_versions ────────────────────────────────────────
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
create table if not exists user_credits (
  user_id          text primary key,
  balance_units    int not null default 0 check (balance_units >= 0),
  lifetime_granted int not null default 0,
  lifetime_spent   int not null default 0,
  updated_at       timestamptz not null default now()
);

-- ─── credit_ledger (append-only truth) ───────────────────────
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
-- One row per thing the user has paid for. Presence means "already paid,
-- serve it free" — this is what makes re-downloads and retries free.
create table if not exists unlocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  kind       text not null check (kind in ('conversion','version_export')),
  ref_id     uuid not null,
  ledger_id  uuid references credit_ledger(id),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

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

-- ─── Guest audit (reports only, deletes nothing) ─────────────
-- Guest projects predate the auth-only cutover. This surfaces the count so the
-- owner can decide; no rows are removed here.
do $$
declare guest_count int;
begin
  select count(*) into guest_count from projects where user_id is null;
  raise notice 'GUEST PROJECT AUDIT: % projects have user_id IS NULL', guest_count;
end $$;
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push`
Expected: success, and a `GUEST PROJECT AUDIT: N projects...` notice in the output. **Record N and report it to the user — do not delete anything.**

- [ ] **Step 3: Verify the tables exist**

Run this in the Supabase SQL editor (or `supabase db push` output check):
```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('project_versions','user_credits','credit_ledger','unlocks','purchases')
order by table_name;
```
Expected: 5 rows.

- [ ] **Step 4: Stage and report**

```bash
git add supabase/migrations/0010_credits_and_versions.sql
```
Report the guest-project count to the user. Ready to commit as `feat(db): add credits, unlocks, and project version tables`.

---

### Task 3: Postgres credit functions

**Files:**
- Create: `supabase/migrations/0011_credit_functions.sql`

**Interfaces:**
- Consumes: tables from Task 2
- Produces: `grant_units(text, int, text, text, jsonb) returns (granted boolean, balance_units int)`, `spend_units(text, text, uuid, int, text) returns (charged boolean, balance_units int)`

- [ ] **Step 1: Write the functions**

```sql
-- 0011_credit_functions.sql
-- All balance mutation lives here. Application code never updates
-- user_credits directly.

-- ─── grant_units ─────────────────────────────────────────────
-- Adds units. Idempotent on p_idempotency_key: calling twice with the same key
-- grants once. This is what makes retried payment webhooks safe.
create or replace function grant_units(
  p_user_id         text,
  p_delta_units     int,
  p_reason          text,
  p_idempotency_key text,
  p_metadata        jsonb default null
) returns table (granted boolean, balance_units int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current   int;
  v_applied   int;
  v_new       int;
  v_ledger_id uuid;
begin
  -- Ensure a balance row exists.
  insert into user_credits (user_id) values (p_user_id)
    on conflict (user_id) do nothing;

  select uc.balance_units into v_current
    from user_credits uc where uc.user_id = p_user_id for update;

  -- Refunds must not drive the balance negative; the user may already have
  -- spent the credits. Clamp, and record what was actually applied.
  v_applied := p_delta_units;
  if v_current + v_applied < 0 then
    v_applied := -v_current;
  end if;
  v_new := v_current + v_applied;

  insert into credit_ledger (user_id, delta_units, reason, balance_after,
                             idempotency_key, metadata)
  values (p_user_id, v_applied, p_reason, v_new, p_idempotency_key, p_metadata)
  on conflict (idempotency_key) do nothing
  returning id into v_ledger_id;

  -- Nothing inserted: this exact event was already applied. Leave the balance
  -- untouched and report that no grant happened.
  if v_ledger_id is null then
    return query select false, v_current;
    return;
  end if;

  update user_credits uc
     set balance_units    = v_new,
         lifetime_granted = uc.lifetime_granted + greatest(v_applied, 0),
         updated_at       = now()
   where uc.user_id = p_user_id;

  return query select true, v_new;
end $$;

-- ─── spend_units ─────────────────────────────────────────────
-- Charges for one unlockable thing. Idempotent on (user_id, kind, ref_id):
-- the second call is free, which is what makes re-downloads, format changes,
-- and retried requests cost nothing.
--
-- Raises 'insufficient_credits' when the balance is short.
create or replace function spend_units(
  p_user_id text,
  p_kind    text,
  p_ref_id  uuid,
  p_units   int,
  p_reason  text
) returns table (charged boolean, balance_units int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing  uuid;
  v_current   int;
  v_new       int;
  v_ledger_id uuid;
begin
  insert into user_credits (user_id) values (p_user_id)
    on conflict (user_id) do nothing;

  -- Already paid for? Serve it free.
  select u.id into v_existing
    from unlocks u
   where u.user_id = p_user_id and u.kind = p_kind and u.ref_id = p_ref_id;

  if v_existing is not null then
    select uc.balance_units into v_current
      from user_credits uc where uc.user_id = p_user_id;
    return query select false, v_current;
    return;
  end if;

  -- Free unlock (e.g. the original converted version). Record it so the
  -- entitlement is permanent, but never touch the balance or the ledger.
  if p_units = 0 then
    insert into unlocks (user_id, kind, ref_id) values (p_user_id, p_kind, p_ref_id)
      on conflict (user_id, kind, ref_id) do nothing;
    select uc.balance_units into v_current
      from user_credits uc where uc.user_id = p_user_id;
    return query select false, v_current;
    return;
  end if;

  -- Conditional decrement. The row lock taken by UPDATE serialises concurrent
  -- spends, so a double-clicked button cannot charge twice. No matching row
  -- means the balance was short.
  update user_credits uc
     set balance_units  = uc.balance_units - p_units,
         lifetime_spent = uc.lifetime_spent + p_units,
         updated_at     = now()
   where uc.user_id = p_user_id
     and uc.balance_units >= p_units
  returning uc.balance_units into v_new;

  if v_new is null then
    raise exception 'insufficient_credits'
      using errcode = 'P0001', hint = 'balance below required units';
  end if;

  insert into credit_ledger (user_id, delta_units, reason, balance_after,
                             idempotency_key, metadata)
  values (p_user_id, -p_units, p_reason, v_new,
          case when p_kind = 'conversion'
               then 'convert:' || p_ref_id::text
               else 'export:' || p_user_id || ':' || p_ref_id::text end,
          jsonb_build_object('kind', p_kind, 'ref_id', p_ref_id))
  returning id into v_ledger_id;

  insert into unlocks (user_id, kind, ref_id, ledger_id)
  values (p_user_id, p_kind, p_ref_id, v_ledger_id);

  return query select true, v_new;
end $$;
```

- [ ] **Step 2: Apply**

Run: `supabase db push`
Expected: success.

- [ ] **Step 3: Verify behaviour directly in SQL**

Run in the Supabase SQL editor. Uses a throwaway user id, cleans up at the end.

```sql
do $$
declare
  u text := 'test_' || gen_random_uuid()::text;
  p uuid := gen_random_uuid();
  r record;
begin
  -- grant 30, twice with the same key: must grant once
  select * into r from grant_units(u, 30, 'signup_grant', 'signup:' || u, null);
  assert r.granted = true and r.balance_units = 30, 'first grant failed';
  select * into r from grant_units(u, 30, 'signup_grant', 'signup:' || u, null);
  assert r.granted = false and r.balance_units = 30, 'duplicate grant was applied!';

  -- spend 10 for a conversion
  select * into r from spend_units(u, 'conversion', p, 10, 'conversion');
  assert r.charged = true and r.balance_units = 20, 'conversion spend failed';

  -- same conversion again: free
  select * into r from spend_units(u, 'conversion', p, 10, 'conversion');
  assert r.charged = false and r.balance_units = 20, 're-conversion charged!';

  -- zero-unit unlock records entitlement without touching balance
  select * into r from spend_units(u, 'version_export', gen_random_uuid(), 0, 'version_export');
  assert r.charged = false and r.balance_units = 20, 'zero-unit unlock moved balance!';

  raise notice 'ALL CREDIT FUNCTION ASSERTIONS PASSED';

  delete from unlocks where user_id = u;
  delete from credit_ledger where user_id = u;
  delete from user_credits where user_id = u;
end $$;
```
Expected: `ALL CREDIT FUNCTION ASSERTIONS PASSED`, no assertion errors.

- [ ] **Step 4: Verify insufficient credits raises**

```sql
do $$
declare u text := 'test_' || gen_random_uuid()::text; ok boolean := false;
begin
  perform grant_units(u, 5, 'admin_adjust', 'admin:' || u, null);
  begin
    perform spend_units(u, 'conversion', gen_random_uuid(), 10, 'conversion');
  exception when others then
    ok := true;
  end;
  assert ok, 'spending beyond balance did NOT raise';
  assert (select balance_units from user_credits where user_id = u) = 5,
    'failed spend changed the balance';
  raise notice 'INSUFFICIENT CREDITS BEHAVIOUR CORRECT';
  delete from credit_ledger where user_id = u;
  delete from user_credits where user_id = u;
end $$;
```
Expected: `INSUFFICIENT CREDITS BEHAVIOUR CORRECT`

- [ ] **Step 5: Stage and report**

```bash
git add supabase/migrations/0011_credit_functions.sql
```
Ready to commit as `feat(db): add grant_units and spend_units credit functions`.

---

### Task 4: Credit service and error type

**Files:**
- Create: `lib/credits/service.ts`
- Modify: `lib/types.ts`
- Test: `__tests__/unit/credits/service.test.ts`

**Interfaces:**
- Consumes: `ledgerKeys`, constants, Postgres functions
- Produces: `getBalance(userId): Promise<number>`, `grantUnits({userId, units, reason, idempotencyKey, metadata}): Promise<{granted: boolean; balanceUnits: number}>`, `spendUnits({userId, kind, refId, units, reason}): Promise<{charged: boolean; balanceUnits: number}>`, `isUnlocked(userId, kind, refId): Promise<boolean>`, `InsufficientCreditsError`; and `AppError.paymentRequired()`

- [ ] **Step 1: Add the error type to `lib/types.ts`**

In the `ErrorCode` union, add `| "PAYMENT_REQUIRED"`. Then add this static beside the others:

```ts
  static paymentRequired(message = "Not enough credits", context?: Record<string, unknown>): AppError {
    return new AppError("PAYMENT_REQUIRED", message, 402, context);
  }
```

Also append these domain types at the end of the file:

```ts
// ─── Credits & Versions ───────────────────────────────────────────────────────

export type UnlockKind = "conversion" | "version_export";

export type LedgerReason =
  | "signup_grant" | "purchase" | "conversion"
  | "version_export" | "refund" | "admin_adjust";

export interface ProjectVersion {
  id: string;
  project_id: string;
  user_id: string;
  version_number: number;
  content_hash: string;
  storage_path: string;
  source: "conversion" | "edit";
  path_count: number | null;
  byte_size: number | null;
  created_at: string;
}

export interface CreditBalanceResponse {
  balanceUnits: number;
  credits: string;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// __tests__/unit/credits/service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const from = vi.fn();
vi.mock("@/lib/api/supabase", () => ({
  createServiceClient: () => ({ rpc, from }),
}));

import { grantUnits, spendUnits, InsufficientCreditsError } from "@/lib/credits/service";

beforeEach(() => { rpc.mockReset(); from.mockReset(); });

describe("grantUnits", () => {
  it("returns granted=false when the key was already used", async () => {
    rpc.mockResolvedValue({ data: [{ granted: false, balance_units: 30 }], error: null });
    const res = await grantUnits({
      userId: "user_a", units: 200, reason: "purchase", idempotencyKey: "dodo:p1",
    });
    expect(res).toEqual({ granted: false, balanceUnits: 30 });
  });

  it("passes the idempotency key through to the database", async () => {
    rpc.mockResolvedValue({ data: [{ granted: true, balance_units: 230 }], error: null });
    await grantUnits({ userId: "user_a", units: 200, reason: "purchase", idempotencyKey: "dodo:p1" });
    expect(rpc).toHaveBeenCalledWith("grant_units", expect.objectContaining({
      p_user_id: "user_a", p_delta_units: 200, p_idempotency_key: "dodo:p1",
    }));
  });
});

describe("spendUnits", () => {
  it("maps the database insufficient_credits error to a typed error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "insufficient_credits" } });
    await expect(spendUnits({
      userId: "user_a", kind: "conversion", refId: "p1", units: 10, reason: "conversion",
    })).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("returns charged=false for an already-unlocked ref", async () => {
    rpc.mockResolvedValue({ data: [{ charged: false, balance_units: 20 }], error: null });
    const res = await spendUnits({
      userId: "user_a", kind: "version_export", refId: "v1", units: 1, reason: "version_export",
    });
    expect(res).toEqual({ charged: false, balanceUnits: 20 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run __tests__/unit/credits/service.test.ts`
Expected: FAIL — cannot find `@/lib/credits/service`

- [ ] **Step 4: Implement**

```ts
// lib/credits/service.ts
import { createServiceClient } from "@/lib/api/supabase";
import type { LedgerReason, UnlockKind } from "@/lib/types";

/** Thrown when a spend is attempted below the required balance. */
export class InsufficientCreditsError extends Error {
  constructor() {
    super("insufficient_credits");
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("user_credits")
    .select("balance_units")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.balance_units as number | undefined) ?? 0;
}

export async function isUnlocked(
  userId: string, kind: UnlockKind, refId: string,
): Promise<boolean> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("unlocks")
    .select("id")
    .eq("user_id", userId).eq("kind", kind).eq("ref_id", refId)
    .maybeSingle();
  return !!data;
}

export async function grantUnits(args: {
  userId: string; units: number; reason: LedgerReason;
  idempotencyKey: string; metadata?: Record<string, unknown>;
}): Promise<{ granted: boolean; balanceUnits: number }> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("grant_units", {
    p_user_id: args.userId,
    p_delta_units: args.units,
    p_reason: args.reason,
    p_idempotency_key: args.idempotencyKey,
    p_metadata: args.metadata ?? null,
  });
  if (error) throw new Error(`grant_units failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return { granted: !!row?.granted, balanceUnits: row?.balance_units ?? 0 };
}

export async function spendUnits(args: {
  userId: string; kind: UnlockKind; refId: string;
  units: number; reason: LedgerReason;
}): Promise<{ charged: boolean; balanceUnits: number }> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("spend_units", {
    p_user_id: args.userId,
    p_kind: args.kind,
    p_ref_id: args.refId,
    p_units: args.units,
    p_reason: args.reason,
  });
  if (error) {
    if (error.message.includes("insufficient_credits")) throw new InsufficientCreditsError();
    throw new Error(`spend_units failed: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { charged: !!row?.charged, balanceUnits: row?.balance_units ?? 0 };
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run __tests__/unit/credits/ && pnpm tsc`
Expected: tests PASS; `tsc` shows only the pre-existing `__tests__/setup.ts` error.

- [ ] **Step 6: Stage and report**

```bash
git add lib/credits/service.ts lib/types.ts __tests__/unit/credits/service.test.ts
```

---

## Phase 2 — Versions

### Task 5: Version service

**Files:**
- Create: `lib/versions/service.ts`
- Test: `__tests__/unit/versions/service.test.ts`

**Interfaces:**
- Consumes: `computeSvgHash` from `lib/svg/canonicalize`
- Produces: `createVersion({projectId, userId, svg, source}): Promise<{version: ProjectVersion; created: boolean}>`, `listVersions(projectId, userId)`, `getVersion(versionId, userId)`, `getLatestVersion(projectId, userId)`, `versionStoragePath(projectId, hash)`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/unit/versions/service.test.ts
import { describe, it, expect } from "vitest";
import { versionStoragePath } from "@/lib/versions/service";

describe("versionStoragePath", () => {
  it("addresses versions by content hash, never a fixed filename", () => {
    // The old code wrote every save to projects/{id}/output.svg, destroying
    // history. Paths must be content-addressed so versions cannot collide.
    expect(versionStoragePath("proj-1", "abc123")).toBe("projects/proj-1/versions/abc123.svg");
  });

  it("gives different paths to different content", () => {
    expect(versionStoragePath("proj-1", "aaa")).not.toBe(versionStoragePath("proj-1", "bbb"));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run __tests__/unit/versions/service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// lib/versions/service.ts
import { createServiceClient } from "@/lib/api/supabase";
import { computeSvgHash } from "@/lib/svg/canonicalize";
import { AppError, type ProjectVersion } from "@/lib/types";

export function versionStoragePath(projectId: string, contentHash: string): string {
  return `projects/${projectId}/versions/${contentHash}.svg`;
}

/**
 * Creates a version, or returns the existing one when the canonical content
 * hash already exists for this project.
 *
 * `created: false` means the artwork is byte-identical (after canonicalisation)
 * to a version that already exists — saving twice with no edits must not create
 * a second version, because a second version would be separately chargeable.
 */
export async function createVersion(args: {
  projectId: string; userId: string; svg: string;
  source: "conversion" | "edit"; pathCount?: number;
}): Promise<{ version: ProjectVersion; created: boolean }> {
  const svc = createServiceClient();
  const contentHash = computeSvgHash(args.svg);

  const { data: existing } = await svc
    .from("project_versions").select("*")
    .eq("project_id", args.projectId).eq("content_hash", contentHash)
    .maybeSingle();

  if (existing) return { version: existing as ProjectVersion, created: false };

  const { data: last } = await svc
    .from("project_versions").select("version_number")
    .eq("project_id", args.projectId)
    .order("version_number", { ascending: false })
    .limit(1).maybeSingle();

  const versionNumber = ((last?.version_number as number | undefined) ?? 0) + 1;
  const storagePath = versionStoragePath(args.projectId, contentHash);
  const bytes = Buffer.byteLength(args.svg, "utf8");

  const { error: uploadErr } = await svc.storage
    .from("images")
    .upload(storagePath, new Blob([args.svg], { type: "image/svg+xml" }),
            { upsert: true, contentType: "image/svg+xml" });
  if (uploadErr) throw AppError.storage(`Failed to store version: ${uploadErr.message}`, { storagePath });

  const { data: inserted, error: insertErr } = await svc
    .from("project_versions")
    .insert({
      project_id: args.projectId, user_id: args.userId,
      version_number: versionNumber, content_hash: contentHash,
      storage_path: storagePath, source: args.source,
      path_count: args.pathCount ?? null, byte_size: bytes,
    })
    .select().single();

  if (insertErr || !inserted) {
    // A concurrent save may have inserted the same hash first; treat as found.
    const { data: raced } = await svc
      .from("project_versions").select("*")
      .eq("project_id", args.projectId).eq("content_hash", contentHash)
      .maybeSingle();
    if (raced) return { version: raced as ProjectVersion, created: false };
    throw AppError.internal(`Failed to record version: ${insertErr?.message ?? "unknown"}`);
  }

  return { version: inserted as ProjectVersion, created: true };
}

export async function listVersions(projectId: string, userId: string): Promise<ProjectVersion[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions").select("*")
    .eq("project_id", projectId).eq("user_id", userId)
    .order("version_number", { ascending: false });
  return (data ?? []) as ProjectVersion[];
}

export async function getVersion(versionId: string, userId: string): Promise<ProjectVersion> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions").select("*")
    .eq("id", versionId).eq("user_id", userId).maybeSingle();
  if (!data) throw AppError.notFound("Version");
  return data as ProjectVersion;
}

export async function getLatestVersion(projectId: string, userId: string): Promise<ProjectVersion> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions").select("*")
    .eq("project_id", projectId).eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1).maybeSingle();
  if (!data) throw AppError.notFound("Version");
  return data as ProjectVersion;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run __tests__/unit/versions/ && pnpm tsc`
Expected: PASS; tsc clean apart from the known `setup.ts` error.

- [ ] **Step 5: Stage and report**

```bash
git add lib/versions __tests__/unit/versions
```

---

### Task 6: Conversion writes version 1

**Files:**
- Modify: `app/api/projects/[id]/convert/route.ts`

**Interfaces:**
- Consumes: `createVersion`, `spendUnits`, `isUnlocked`, `CONVERSION_UNITS`
- Produces: conversion responses unchanged in shape; a `project_versions` row with `source='conversion'` now exists after every conversion

- [ ] **Step 1: Add imports**

```ts
import { createVersion } from "@/lib/versions/service";
import { spendUnits, isUnlocked, getBalance, InsufficientCreditsError } from "@/lib/credits/service";
import { CONVERSION_UNITS } from "@/lib/credits/constants";
```

- [ ] **Step 2: Require auth (guest branch removal)**

Replace:
```ts
    // Auth — guests allowed to convert their own (unclaimed) projects
    const { userId: clerkUserId } = await auth();
    userId = clerkUserId;
```
with:
```ts
    // Auth is required everywhere — the guest path was removed with the
    // POC cutover (app/(app)/layout.tsx already redirects anonymous users).
    const auth_ = await requireAuth();
    userId = auth_.userId;
```
Add `requireAuth` to the existing import from `@/lib/api/supabase`, and delete the now-unused `auth` import from `@clerk/nextjs/server`.

Then replace the project lookup:
```ts
    const projectQuery = svc.from("projects").select().eq("id", projectId);
    const finalQuery = userId
      ? projectQuery.eq("user_id", userId)
      : projectQuery.is("user_id", null);
    const { data: project, error: projectErr } = await finalQuery.single();
```
with:
```ts
    const { data: project, error: projectErr } = await svc
      .from("projects").select().eq("id", projectId).eq("user_id", userId).single();
```

And simplify the rate-limit key to `enforceRateLimit(convertRatelimit, userId)`.

- [ ] **Step 3: Add the credit pre-check before any pipeline work**

Immediately after the `!project.source_image_path` validation, insert:

```ts
    // Pre-check: fail before doing expensive work. Not authoritative — the
    // real charge happens after the pipeline succeeds.
    const alreadyPaid = await isUnlocked(userId, "conversion", projectId);
    if (!alreadyPaid) {
      const balance = await getBalance(userId);
      if (balance < CONVERSION_UNITS) {
        throw AppError.paymentRequired("Not enough credits to convert", {
          requiredUnits: CONVERSION_UNITS, balanceUnits: balance,
        });
      }
    }
```

- [ ] **Step 4: Record version 1 and charge, on both the cache-hit and full-pipeline paths**

In the cache-hit branch, after the project row is updated to `ready` and before building the response, insert:

```ts
        const cachedSvg = await svc.storage.from("images").download(destPath);
        if (cachedSvg.data) {
          const { version } = await createVersion({
            projectId, userId, svg: await cachedSvg.data.text(), source: "conversion",
          });
          await chargeConversion(userId, projectId, version.id);
        }
```

In the full-pipeline path, after `uploadSvg(...)` succeeds and the project is marked ready, insert:

```ts
      const { version } = await createVersion({
        projectId, userId, svg: svgContent, source: "conversion",
      });
      await chargeConversion(userId, projectId, version.id);
```

And add this helper above the route handler:

```ts
/**
 * Charges for a conversion and grants a permanent free-export entitlement on
 * the original version.
 *
 * Called only after the SVG exists, so a failed trace never costs a credit.
 * Idempotent per project: re-converting, including a cache hit, is free.
 */
async function chargeConversion(userId: string, projectId: string, versionId: string) {
  await spendUnits({
    userId, kind: "conversion", refId: projectId,
    units: CONVERSION_UNITS, reason: "conversion",
  });
  // 0 units: records the entitlement without touching the balance.
  await spendUnits({
    userId, kind: "version_export", refId: versionId,
    units: 0, reason: "version_export",
  });
}
```

- [ ] **Step 5: Map the typed error to a 402**

In the `catch` block, before `return handleError(...)`, add:

```ts
    if (err instanceof InsufficientCreditsError) {
      return handleError(
        AppError.paymentRequired("Not enough credits to convert"),
        ROUTE, userId, Date.now() - start,
      );
    }
```

- [ ] **Step 6: Verify it compiles and nothing regressed**

Run: `pnpm tsc && pnpm test`
Expected: tsc clean apart from `setup.ts`; all existing tests pass.

- [ ] **Step 7: Stage and report**

```bash
git add "app/api/projects/[id]/convert/route.ts"
```

---

### Task 7: Saving appends a version

**Files:**
- Modify: `app/api/projects/[id]/route.ts` (PATCH, the `if (svg_content)` block)
- Create: `app/api/projects/[id]/versions/route.ts`

**Interfaces:**
- Consumes: `createVersion`, `listVersions`
- Produces: `GET /api/projects/[id]/versions` returning `ProjectVersion[]`

- [ ] **Step 1: Replace the destructive upload in PATCH**

Replace this block:
```ts
      const sanitized = sanitizeSvg(svg_content);
      const svgPath = project.svg_path ?? `projects/${projectId}/output.svg`;
      const blob = new Blob([sanitized], { type: "image/svg+xml" });

      const { error: uploadErr } = await svc.storage
        .from("images")
        .upload(svgPath, blob, { upsert: true, contentType: "image/svg+xml" });

      if (uploadErr) {
        throw AppError.storage(
          `Failed to save SVG: ${uploadErr.message}`,
          { svgPath },
        );
      }

      update.svg_path = svgPath;
```
with:
```ts
      // Saves append a new version instead of overwriting output.svg.
      // Identical content returns the existing version, so saving twice with
      // no edits creates nothing (and therefore costs nothing later).
      const sanitized = sanitizeSvg(svg_content);
      const { version } = await createVersion({
        projectId, userId, svg: sanitized, source: "edit",
      });
      update.svg_path = version.storage_path;
```
and add `import { createVersion } from "@/lib/versions/service";` at the top.

- [ ] **Step 2: Create the versions listing route**

```ts
// app/api/projects/[id]/versions/route.ts
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { listVersions } from "@/lib/versions/service";
import { isUnlocked } from "@/lib/credits/service";

const ROUTE = "GET /api/projects/[id]/versions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;
  try {
    const { id: projectId } = await params;
    const auth = await requireAuth();
    userId = auth.userId;

    const versions = await listVersions(projectId, userId);

    // The UI shows which versions are free to export, so users can see the
    // cost before they click rather than after.
    const withUnlocks = await Promise.all(
      versions.map(async (v) => ({
        ...v,
        unlocked: v.source === "conversion" || (await isUnlocked(userId!, "version_export", v.id)),
      })),
    );

    return Response.json(withUnlocks);
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
```

- [ ] **Step 3: Verify**

Run: `pnpm tsc && pnpm test`
Expected: tsc clean apart from `setup.ts`; tests pass.

- [ ] **Step 4: Stage and report**

```bash
git add "app/api/projects/[id]/route.ts" "app/api/projects/[id]/versions/route.ts"
```

---

## Phase 3 — Export metering

### Task 8: Export charges for edited versions

**Files:**
- Modify: `app/api/projects/[id]/export/route.ts`

**Interfaces:**
- Consumes: `getVersion`, `getLatestVersion`, `spendUnits`, `isUnlocked`, `getBalance`, `VERSION_EXPORT_UNITS`
- Produces: `?versionId=` support; `X-Credits-Remaining` and `X-Credit-Charged` headers; 402 when short

- [ ] **Step 1: Resolve the target version instead of `project.svg_path`**

After the ownership check, replace the `svg_path` download with:

```ts
    const versionIdParam = url.searchParams.get("versionId");
    const version = versionIdParam
      ? await getVersion(versionIdParam, userId)
      : await getLatestVersion(projectId, userId);

    if (version.project_id !== projectId) throw AppError.notFound("Version");

    // The original traced version is included with the conversion credit.
    // Edited versions cost VERSION_EXPORT_UNITS, once, for any format.
    const cost = version.source === "conversion" ? 0 : VERSION_EXPORT_UNITS;

    if (cost > 0) {
      const unlocked = await isUnlocked(userId, "version_export", version.id);
      if (!unlocked) {
        const balance = await getBalance(userId);
        if (balance < cost) {
          throw AppError.paymentRequired("Not enough credits to export this version", {
            requiredUnits: cost, balanceUnits: balance, versionId: version.id,
          });
        }
      }
    }

    const { data: svgBlob, error: dlErr } = await svc.storage
      .from("images").download(version.storage_path);
    if (dlErr || !svgBlob) {
      throw AppError.storage(`Failed to retrieve SVG: ${dlErr?.message ?? "unknown"}`, {
        storagePath: version.storage_path,
      });
    }
```

- [ ] **Step 2: Charge after the bytes exist, in both format branches**

Immediately before returning the SVG response, and again before returning the PNG response, insert:

```ts
    const spend = await spendUnits({
      userId, kind: "version_export", refId: version.id,
      units: cost, reason: "version_export",
    });
```
and add to both responses' headers:
```ts
        "X-Credits-Remaining": String(spend.balanceUnits),
        "X-Credit-Charged": String(spend.charged),
```

This ordering is the point of the task: a `sharp` crash between download and response must not cost the user anything.

- [ ] **Step 3: Map the typed error**

In the `catch`, before `handleError`:
```ts
    if (err instanceof InsufficientCreditsError) {
      return handleError(
        AppError.paymentRequired("Not enough credits to export"),
        ROUTE, userId, Date.now() - start,
      );
    }
```

- [ ] **Step 4: Add the imports**

```ts
import { getVersion, getLatestVersion } from "@/lib/versions/service";
import { spendUnits, isUnlocked, getBalance, InsufficientCreditsError } from "@/lib/credits/service";
import { VERSION_EXPORT_UNITS } from "@/lib/credits/constants";
```

- [ ] **Step 5: Verify**

Run: `pnpm tsc && pnpm test`
Expected: clean apart from `setup.ts`.

- [ ] **Step 6: Stage and report**

```bash
git add "app/api/projects/[id]/export/route.ts"
```

---

### Task 9: Signup grant and balance endpoint

**Files:**
- Modify: `app/api/webhooks/clerk/route.ts`
- Create: `app/api/credits/route.ts`
- Test: `__tests__/unit/credits/signup-grant.test.ts`

**Interfaces:**
- Consumes: `grantUnits`, `ledgerKeys.signup`, `SIGNUP_GRANT_UNITS`
- Produces: `GET /api/credits` returning `CreditBalanceResponse`

- [ ] **Step 1: Add the grant to the Clerk webhook**

After the `remapLegacyUser` call, before the response:

```ts
  // Signup grant: 3 credits — two conversions plus ten edited exports.
  // Idempotent on signup:{userId}, so a replayed webhook grants once.
  try {
    await grantUnits({
      userId: data.id,
      units: SIGNUP_GRANT_UNITS,
      reason: "signup_grant",
      idempotencyKey: ledgerKeys.signup(data.id),
    });
  } catch (err) {
    // Never fail the webhook on a grant error — Clerk would retry the whole
    // event. Log it; the backfill script is the safety net.
    console.error("[signup-grant]", err);
  }
```
with imports:
```ts
import { grantUnits } from '@/lib/credits/service'
import { ledgerKeys } from '@/lib/credits/keys'
import { SIGNUP_GRANT_UNITS } from '@/lib/credits/constants'
```

- [ ] **Step 2: Create the balance endpoint**

```ts
// app/api/credits/route.ts
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { getBalance } from "@/lib/credits/service";
import { formatCredits } from "@/lib/credits/constants";
import type { CreditBalanceResponse } from "@/lib/types";

const ROUTE = "GET /api/credits";

export async function GET(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
    const balanceUnits = await getBalance(userId);
    const body: CreditBalanceResponse = { balanceUnits, credits: formatCredits(balanceUnits) };
    return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
```

- [ ] **Step 3: Write the test**

```ts
// __tests__/unit/credits/signup-grant.test.ts
import { describe, it, expect } from "vitest";
import { SIGNUP_GRANT_UNITS, CONVERSION_UNITS, VERSION_EXPORT_UNITS } from "@/lib/credits/constants";

describe("signup grant sizing", () => {
  it("covers two conversions and ten edited exports", () => {
    // The grant exists so a new user can finish two real projects. If this
    // ever fails, the free tier no longer delivers what the pricing promises.
    const twoConversions = 2 * CONVERSION_UNITS;
    const tenExports = 10 * VERSION_EXPORT_UNITS;
    expect(SIGNUP_GRANT_UNITS).toBe(twoConversions + tenExports);
  });
});
```

- [ ] **Step 4: Run**

Run: `pnpm vitest run __tests__/unit/credits/ && pnpm tsc`
Expected: PASS.

- [ ] **Step 5: Stage and report**

```bash
git add app/api/credits app/api/webhooks/clerk/route.ts __tests__/unit/credits/signup-grant.test.ts
```

---

## Phase 4 — Payments

### Task 10: Dodo checkout

**Files:**
- Create: `lib/payments/dodo.ts`, `app/api/payments/checkout/route.ts`

**Interfaces:**
- Consumes: env `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENV`, `DODO_CREDITS_PRODUCT_ID`, `NEXT_PUBLIC_APP_URL`
- Produces: `createCheckoutSession(userId, email?): Promise<{ url: string }>`; `POST /api/payments/checkout` returning `{ url }`

- [ ] **Step 1: Read the current Dodo documentation FIRST**

Use WebFetch on `https://docs.dodopayments.com` for: creating a one-time payment/checkout session, the exact request body, how to attach metadata, the API base URLs for test vs live mode, and the webhook event names and payload shape.

**Do not write this task's code from memory.** Record the confirmed endpoint, base URLs, and event names as a comment at the top of `lib/payments/dodo.ts`. If the docs contradict anything in this plan, follow the docs and note the difference for the user.

- [ ] **Step 2: Implement the client**

Write `lib/payments/dodo.ts` using the confirmed API shape. It must:
- Select the base URL from `DODO_PAYMENTS_ENV` (`test_mode` vs `live_mode`)
- Send `Authorization: Bearer ${DODO_PAYMENTS_API_KEY}`
- Use `DODO_CREDITS_PRODUCT_ID` as the product
- Attach `metadata: { clerk_user_id: userId }` — the webhook needs this to know who to credit
- Set the return URL to `${NEXT_PUBLIC_APP_URL}/dashboard?purchase=success`
- Throw `AppError.internal` with the response body on non-2xx
- Export `createCheckoutSession(userId: string, email?: string): Promise<{ url: string }>`

- [ ] **Step 3: Implement the route**

```ts
// app/api/payments/checkout/route.ts
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { createCheckoutSession } from "@/lib/payments/dodo";

const ROUTE = "POST /api/payments/checkout";

export async function POST(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
    await enforceRateLimit(writeRatelimit, userId);
    const { url } = await createCheckoutSession(userId);
    return Response.json({ url });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
```

- [ ] **Step 4: Verify**

Run: `pnpm tsc`
Expected: clean apart from `setup.ts`.

- [ ] **Step 5: Stage and report**

```bash
git add lib/payments app/api/payments/checkout
```

---

### Task 11: Dodo webhook

**Files:**
- Create: `app/api/webhooks/dodo/route.ts`

**Interfaces:**
- Consumes: `grantUnits`, `ledgerKeys.purchase`, `PURCHASE_GRANT_UNITS`, `DODO_WEBHOOK_SECRET`
- Produces: credits granted on payment success; `purchases` rows

- [ ] **Step 1: Implement, mirroring the Clerk webhook's svix pattern**

```ts
// app/api/webhooks/dodo/route.ts
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/api/supabase";
import { grantUnits } from "@/lib/credits/service";
import { ledgerKeys } from "@/lib/credits/keys";
import { PURCHASE_GRANT_UNITS, PACK_PRICE_CENTS } from "@/lib/credits/constants";

// Event names and payload shape confirmed against Dodo docs in Task 10.
type DodoEvent = { type: string; data: Record<string, unknown> };

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  let evt: DodoEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    }) as DodoEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const data = evt.data as {
    payment_id?: string;
    metadata?: { clerk_user_id?: string };
    total_amount?: number;
    currency?: string;
  };

  const paymentId = data.payment_id;
  const clerkUserId = data.metadata?.clerk_user_id;

  if (!paymentId || !clerkUserId) {
    // Nothing actionable, but 200 so Dodo stops retrying.
    return NextResponse.json({ ignored: "missing payment id or user metadata" }, { status: 200 });
  }

  const svc = createServiceClient();

  if (evt.type === "payment.succeeded") {
    await svc.from("purchases").upsert({
      user_id: clerkUserId,
      dodo_payment_id: paymentId,
      amount_cents: data.total_amount ?? PACK_PRICE_CENTS,
      currency: data.currency ?? "USD",
      credits_granted: PURCHASE_GRANT_UNITS,
      status: "succeeded",
      raw_event: evt as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    }, { onConflict: "dodo_payment_id" });

    // Idempotent: a redelivered webhook hits the unique idempotency key and
    // grants nothing further.
    const result = await grantUnits({
      userId: clerkUserId,
      units: PURCHASE_GRANT_UNITS,
      reason: "purchase",
      idempotencyKey: ledgerKeys.purchase(paymentId),
      metadata: { paymentId },
    });

    return NextResponse.json({ granted: result.granted, balanceUnits: result.balanceUnits });
  }

  if (evt.type === "refund.succeeded") {
    await svc.from("purchases")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("dodo_payment_id", paymentId);

    // Clamped at zero inside grant_units — the user may already have spent it.
    await grantUnits({
      userId: clerkUserId,
      units: -PURCHASE_GRANT_UNITS,
      reason: "refund",
      idempotencyKey: ledgerKeys.refund(paymentId),
      metadata: { paymentId },
    });

    return NextResponse.json({ refunded: true });
  }

  return NextResponse.json({ ignored: evt.type }, { status: 200 });
}
```

**Note:** the svix header names (`webhook-id` vs `svix-id`) must match what Dodo actually sends — confirm from the Task 10 doc reading and adjust.

- [ ] **Step 2: Verify**

Run: `pnpm tsc`
Expected: clean apart from `setup.ts`.

- [ ] **Step 3: Stage and report**

```bash
git add app/api/webhooks/dodo
```

---

### Task 12: Backfill script

**Files:**
- Create: `scripts/backfill-credits.ts`

**Interfaces:**
- Consumes: `grantUnits`, `ledgerKeys`, `SIGNUP_GRANT_UNITS`
- Produces: existing users granted; existing projects grandfathered

- [ ] **Step 1: Implement**

The script must, in dry-run mode by default (`--apply` to write):

1. Read every distinct `user_id` from `projects` where `user_id is not null`, plus every `user_id` in `icons`.
2. For each, call `grantUnits({ units: SIGNUP_GRANT_UNITS, reason: "signup_grant", idempotencyKey: ledgerKeys.signup(userId) })`. Clerk's `user.created` never fires for accounts that already exist, so without this every current user hits a paywall having never received a free allowance.
3. For every existing project, insert a **0-unit** `unlocks` row for `('conversion', projectId)` via `spendUnits({ units: 0 })`. Projects converted before the meter existed must not become chargeable retroactively.
4. For every existing project with an `svg_path`, download it and call `createVersion({ source: "conversion" })` so history starts from what the user already has.
5. Print a summary: users granted, projects grandfathered, versions created, and any failures.

Follow the style of `scripts/check-admin-access.ts` for env loading and the Supabase client.

- [ ] **Step 2: Dry run**

Run: `pnpm tsx scripts/backfill-credits.ts`
Expected: a summary with **no writes**. Show the counts to the user before proceeding.

- [ ] **Step 3: Apply — only after the user approves the dry-run counts**

Run: `pnpm tsx scripts/backfill-credits.ts --apply`
Expected: counts match the dry run.

- [ ] **Step 4: Verify idempotency by re-running**

Run: `pnpm tsx scripts/backfill-credits.ts --apply`
Expected: zero new grants (every idempotency key already used). If this grants again, **stop** — the idempotency keys are wrong.

- [ ] **Step 5: Stage and report**

```bash
git add scripts/backfill-credits.ts
```

---

## Phase 5 — UI

### Task 13: Always-visible credit balance

**Files:**
- Create: `components/shared/CreditBadge.tsx`
- Modify: `components/shared/Navbar.tsx`

**Interfaces:**
- Consumes: `GET /api/credits`, `formatCredits`
- Produces: `<CreditBadge />` — top-bar balance on every app page

- [ ] **Step 1: Implement the badge**

A client component that:
- Fetches `/api/credits` via TanStack Query (already a dependency), key `["credits"]`
- Renders `{credits} credits`, linking to `/pricing`
- When the balance is untouched (`balanceUnits === SIGNUP_GRANT_UNITS`), renders **"2 projects, on us"** instead of a bare number — the grant only works if users understand what it buys
- When `balanceUnits < CONVERSION_UNITS`, renders in a warning style and links to checkout
- Renders nothing while loading rather than flashing a zero — a momentary "0 credits" reads as "you're broke"

- [ ] **Step 2: Mount it in the navbar**

Add `<CreditBadge />` to `components/shared/Navbar.tsx`'s top bar so it appears on dashboard, editor, and icons pages.

- [ ] **Step 3: Invalidate after every charge**

In `components/editor/Toolbar.tsx` and the conversion flow in `app/(app)/dashboard/page.tsx`, call `queryClient.invalidateQueries({ queryKey: ["credits"] })` after a successful convert or export, so the number visibly moves when something is spent.

- [ ] **Step 4: Verify in the browser**

Start the dev server, sign in, and confirm the badge shows on `/dashboard` and `/editor/[id]`, and that it changes after a conversion.

- [ ] **Step 5: Stage and report**

```bash
git add components/shared/CreditBadge.tsx components/shared/Navbar.tsx
```

---

### Task 14: Version panel and export cost states

**Files:**
- Create: `components/editor/VersionPanel.tsx`, `components/shared/BuyCreditsModal.tsx`
- Modify: `components/editor/Toolbar.tsx`

**Interfaces:**
- Consumes: `GET /api/projects/[id]/versions`, `POST /api/payments/checkout`
- Produces: version list with restore; export button cost labelling; 402 handling

- [ ] **Step 1: Version panel**

Lists versions newest-first with version number, timestamp, and source. Versions where `unlocked === true` are marked "free to export". Clicking one loads it into the editor canvas (fetch its storage URL, `parseSvg`, `setPaths`). Switching versions costs nothing and the UI must say so.

- [ ] **Step 2: Export button states in `Toolbar.tsx`**

- Target version unlocked or `source === 'conversion'` → label **"Download"**
- Otherwise → label **"Export · 0.1 credit"**

The cost must be visible before the click, not discovered after.

- [ ] **Step 3: Buy modal on 402**

When any fetch returns 402, open `BuyCreditsModal`: "20 credits for $3 + tax", a button that POSTs `/api/payments/checkout` and redirects to `url`. The "+ tax" is required copy — Dodo's checkout total exceeds $3.

- [ ] **Step 4: Verify in the browser**

Convert, edit, save, and confirm: a new version appears; the export button shows the cost; exporting decrements the badge; re-exporting the same version does not.

- [ ] **Step 5: Stage and report**

```bash
git add components/editor/VersionPanel.tsx components/shared/BuyCreditsModal.tsx components/editor/Toolbar.tsx
```

---

### Task 15: Pricing page

**Files:**
- Create: `app/(marketing)/pricing/page.tsx`

- [ ] **Step 1: Implement**

A public, indexable page stating: 3 free credits on signup (two projects with edits); 20 credits for **$3 + tax**; 1 credit per conversion; 0.1 credits per edited-version export; conversions, previews, saves, version switching, and re-downloads free; credits never expire. Include a checkout button for signed-in users. Follow the layout patterns in `components/pseo/PseoShell.tsx`.

- [ ] **Step 2: Add to the sitemap**

Add `/pricing` to `app/sitemap.ts`.

- [ ] **Step 3: Verify**

Run `pnpm build` and confirm `/pricing` renders and appears in the sitemap.

- [ ] **Step 4: Stage and report**

```bash
git add "app/(marketing)/pricing" app/sitemap.ts
```

---

## Phase 6 — Cleanup and verification

### Task 16: Remove the guest path

**Files:**
- Delete: `app/api/projects/claim/route.ts`
- Modify: `app/api/projects/route.ts`, `app/(app)/dashboard/page.tsx`, `components/shared/ProjectCard.tsx`, `app/api/jobs/[id]/route.ts`, `proxy.ts`

- [ ] **Step 1: Delete the claim route**

```bash
rm -rf "app/api/projects/claim"
```

- [ ] **Step 2: Remove the guest branch from `GET /api/projects`**

Replace the `if (userId) { ... } else { ...ids= branch... }` with a `requireAuth()` call followed by the authenticated query only.

- [ ] **Step 3: Remove guest helpers from the dashboard**

Delete `GUEST_IDS_KEY`, `getGuestIds`, `addGuestId`, `clearGuestIds`, the claim `useEffect`, and the `isGuest` prop passed to `ProjectCard`. Remove the `isGuest` prop from `ProjectCard.tsx` and any branches on it.

- [ ] **Step 4: Protect the routes in `proxy.ts`**

```ts
// Every app route requires auth. The guest path was removed after the POC —
// app/(app)/layout.tsx already redirects, this rejects earlier.
const isProtectedPath = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/icons(.*)',
])
```
Delete the stale comment claiming the dashboard is open to guests.

- [ ] **Step 5: Verify no references remain**

Run: `grep -rn "guest\|Guest\|isGuest\|claim" --include="*.ts" --include="*.tsx" app components lib stores | grep -v "reclaim"`
Expected: no hits outside `lib/admin` (which reports on legacy rows) and comments describing the removal.

Run: `pnpm tsc && pnpm test`
Expected: clean apart from `setup.ts`.

- [ ] **Step 6: Stage and report**

```bash
git add -A app components proxy.ts
```

---

### Task 17: End-to-end verification

**Files:**
- Create: `__tests__/e2e/credits-flow.spec.ts`

- [ ] **Step 1: Set up the tunnel and webhook**

1. `ngrok http 3000` (requires `ngrok config add-authtoken <token>` once — the user runs this).
2. In the Dodo dashboard (test mode) → Developer → Webhooks, add an endpoint: `https://<ngrok-subdomain>.ngrok-free.app/api/webhooks/dodo`.
3. Copy the signing secret into `.env.local` as `DODO_WEBHOOK_SECRET`.
4. Confirm `.env.local` has `DODO_PAYMENTS_ENV=test_mode`, a **test-mode** `DODO_PAYMENTS_API_KEY`, and `DODO_CREDITS_PRODUCT_ID=pdt_0NkrXFtkhfLfC8arGkSwm`.
5. Restart the dev server so the new env is loaded.

- [ ] **Step 2: Write the Playwright spec**

Cover, following the pattern in `__tests__/e2e/upload-and-convert.spec.ts`:
- A new user has 3 credits and the badge reads "2 projects, on us"
- Convert → balance 2 credits
- Export the original version → balance unchanged (free)
- Edit, save → a new version appears; balance unchanged (saving is free)
- Export the edited version → balance 1.9 credits
- Export that same version again as PNG → balance unchanged
- Spend down to zero → convert returns 402 → the buy modal appears

- [ ] **Step 3: Run the automated suite**

Run: `pnpm test && pnpm test:e2e`
Expected: all pass. Record actual output — do not claim success without it.

- [ ] **Step 4: Manual verification in Chrome**

Drive the browser and confirm, capturing a screenshot of each:
1. Badge visible at top on dashboard and editor
2. Convert decrements by exactly 1 credit
3. Version panel lists versions; switching costs nothing
4. Export button shows "Export · 0.1 credit" for an edited version, "Download" for the original
5. 402 opens the buy modal reading "$3 + tax"
6. Checkout completes with a Dodo **test card**
7. The webhook fires (check the ngrok inspector at `http://127.0.0.1:4040`) and the balance increases by 20 credits
8. Re-delivering the webhook from the Dodo dashboard grants **nothing further** — this is the single most important check in the plan

- [ ] **Step 5: Report results**

Summarise what passed and what did not, with the actual command output and the observed balances. If anything failed, fix it before declaring the phase done.

---

## Self-Review Notes

**Spec coverage:** ledger/balance/unlocks (T2–T4), versions (T5–T7), conversion metering (T6), export metering (T8), signup grant (T9), checkout (T10), webhook (T11), backfill for both open risks (T12), always-visible balance (T13), version panel + cost labelling (T14), pricing page (T15), guest removal (T16), tests (T1, T4, T5, T9, T17).

**Deliberate deviations from the spec, and why:**
- Functions live in `0011` rather than `0010`, so tables and functions can be rolled back independently.
- Integration tests run as SQL assertion blocks (T3) rather than Vitest, because the only Supabase instance is production and the existing integration tests are `it.todo` stubs with no harness. The SQL blocks use throwaway `test_*` ids and clean up after themselves.
- Commits are staged and reported, never executed, per the user's standing instruction.

**Known gap:** Dodo's exact event names, header names, and request shapes are confirmed in Task 10 Step 1 rather than pinned here, because writing payment API calls from model memory is how purchases silently fail to grant credits.
