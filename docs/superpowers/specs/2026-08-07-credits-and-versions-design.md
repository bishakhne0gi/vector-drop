# Credits, Versions, and Dodo Payments — Design

**Date:** 2026-08-07
**Status:** Approved, ready for implementation planning
**Sub-project:** 1 of 6 (see "Roadmap Context")

## Problem

VectorDrop has no revenue mechanism and no version history.

Payments are entirely unbuilt: `app/api/payments/coffee/`, `app/api/webhooks/dodo/`,
`app/coffee/`, and `app/coffee/thanks/` are empty directories, and the string "dodo"
appears nowhere in the codebase.

Worse, `PATCH /api/projects/[id]` writes every save to the same storage path
(`projects/{projectId}/output.svg`). Each save destroys the previous SVG. The original
traced output is unrecoverable the moment a user saves an edit.

These are one problem, not two: charging for edited-version exports requires durable
version identity.

## Goals

1. Every save produces a durable, addressable version. Nothing is ever overwritten.
2. Conversion is metered at 1 credit, against a signup grant sized so a new user can finish
   two real projects — edits and exports included — before being asked for money.
3. Exporting an edited version costs 0.1 credits, charged once per version, any format.
4. Purchases via Dodo are correct under webhook retries and duplicate deliveries.
5. Remove the dead guest code path; the app is authenticated-only.

## Non-Goals

- Metering AI features. `analyze` and `restyle` have no UI callers, and `generate-icon`
  stays free for now. Revisit if PostHog shows abuse.
- Metering the icon library. The icon download route has been **removed** (see "Completed
  Ahead of Plan").
- Charging for previews, saves, version switching, or re-downloads of anything already paid for.
- Subscriptions or multiple pricing tiers. One pack: $3 = 20 credits.
- Expiring credits. Purchased credits do not expire.

## Pricing Model

| Action | Credits | Units |
|---|---|---|
| Signup grant | 3 | 30 |
| Pack (one purchase) | 20 for $3 | 200 |
| Convert a project | 1 | 10 |
| Export the conversion's original version | 0 | 0 |
| Export an edited version (once per version, any format) | 0.1 | 1 |
| Preview, save, switch or restore a version, re-download | 0 | 0 |

### Fractional credits

0.1-credit charges mean fractional balances. Floating point is never used for balances.
The database stores an **integer count of tenths** — 1 credit = 10 units — and the UI
divides by 10 for display. Every amount in the system is an integer number of units.

### Why the grant is 3 credits

The free allowance must cover a *complete* experience, not a teaser. A user who converts,
edits, and cannot afford to export what they made has been shown the product and then
blocked at the only moment that mattered.

Three credits buys: two conversions (20 units), plus ten edited-version exports (10 units)
spread across them. That is two finished projects with room to iterate on each.

**Known and accepted leak:** the grant is a single pool, so a user who never edits can spend
all three credits on conversions and get three free projects rather than two — exporting the
original version is free. Preventing this requires two separate balances (a conversion
allowance and a unit pool), doubling the checks and failure modes in the code that handles
money. The marginal cost of one extra trace is CPU cents; the complexity is permanent. The
leak is deliberate.

### What "charged once per version" means

A charge unlocks a *version*, permanently. Exporting version 4 as SVG and later as PNG
costs 1 unit total. Re-downloading version 4 next month is free. Switching between versions
in the editor is free — only the act of exporting a not-yet-unlocked *edited* version costs
anything.

The conversion charge covers exporting that project's original traced output. A user who
converts and downloads without editing pays exactly 1 credit.

## Architecture

Chosen approach: **ledger + cached balance + unlock table**. Rejected alternatives:

- *Counter column only* — no idempotency (a retried Dodo webhook grants credits twice),
  no audit trail for support questions, and no record of what a charge bought, so free
  re-downloads cannot be enforced.
- *Ledger only, balance via SUM* — correct but scans a user's full history on every export
  and every balance render. The eventual fix is exactly the cached balance, so build it now.

### Schema — migration `0010_credits_and_versions.sql`

All new tables key on `user_id text` (Clerk IDs), consistent with migration 0008. All new
tables have **RLS enabled with zero policies**, following the `legacy_user_map` pattern from
0009: service-role access only, unreachable from client code even by mistake.

#### `project_versions`

```
id             uuid pk default gen_random_uuid()
project_id     uuid not null references projects(id) on delete cascade
user_id        text not null
version_number int  not null
content_hash   text not null
storage_path   text not null
source         text not null check (source in ('conversion','edit'))
path_count     int
byte_size      int
created_at     timestamptz not null default now()

unique (project_id, content_hash)
unique (project_id, version_number)
index on (project_id, version_number desc)
```

`unique (project_id, content_hash)` makes double-charging for identical bytes structurally
impossible. `source = 'conversion'` marks the free-to-export original.

Storage layout: `projects/{projectId}/versions/{content_hash}.svg`.

#### `user_credits`

```
user_id           text primary key
balance_units     int not null default 0 check (balance_units >= 0)
lifetime_granted  int not null default 0
lifetime_spent    int not null default 0
updated_at        timestamptz not null default now()
```

All three counters are in units (tenths of a credit).

#### `credit_ledger`

```
id              uuid pk default gen_random_uuid()
user_id         text not null
delta_units     int  not null
reason          text not null check (reason in
                  ('signup_grant','purchase','conversion','version_export',
                   'refund','admin_adjust'))
balance_after   int  not null
idempotency_key text not null unique
metadata        jsonb
created_at      timestamptz not null default now()

index on (user_id, created_at desc)
```

Append-only. Never updated, never deleted.

Idempotency keys are structural, not random:

| Reason | Key |
|---|---|
| `signup_grant` | `signup:{userId}` |
| `purchase` | `dodo:{paymentId}` |
| `conversion` | `convert:{projectId}` |
| `version_export` | `export:{userId}:{versionId}` |
| `refund` | `refund:{paymentId}` |
| `admin_adjust` | `admin:{uuid}` |

#### `unlocks`

Generalised over both chargeable things, so conversions and version exports share one
idempotency mechanism.

```
id         uuid pk default gen_random_uuid()
user_id    text not null
kind       text not null check (kind in ('conversion','version_export'))
ref_id     uuid not null            -- project_id for conversion, version_id for export
ledger_id  uuid references credit_ledger(id)
created_at timestamptz not null default now()

unique (user_id, kind, ref_id)
```

#### `purchases`

```
id              uuid pk default gen_random_uuid()
user_id         text not null
dodo_payment_id text not null unique
amount_cents    int  not null
currency        text not null
credits_granted int  not null       -- in units
status          text not null check (status in
                  ('pending','succeeded','failed','refunded'))
raw_event       jsonb
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

### Postgres functions

All credit mutation happens inside these two functions. No route mutates `user_credits`
directly.

#### `spend_units(p_user_id text, p_kind text, p_ref_id uuid, p_units int, p_reason text)`

Returns `(charged boolean, balance_units int)`. Raises `insufficient_credits` when the
balance is below `p_units` and no unlock exists.

Single transaction:

1. If a row exists in `unlocks` for `(p_user_id, p_kind, p_ref_id)`, return
   `(charged := false, balance_units := current)`. This is the free-repeat path: re-download,
   re-export in another format, or a retried request.
2. If `p_units = 0`, insert the unlock row with no ledger entry and return
   `(charged := false, ...)`. This records that the original version is exportable without
   ever touching the balance.
3. `update user_credits set balance_units = balance_units - p_units,
   lifetime_spent = lifetime_spent + p_units
   where user_id = p_user_id and balance_units >= p_units returning balance_units`.
   No row returned means insufficient credits — raise.
   The implicit row lock on `UPDATE` serialises concurrent spends, so a double-clicked
   button cannot charge twice.
4. Insert the `credit_ledger` row (`delta_units := -p_units`, `reason := p_reason`).
5. Insert the `unlocks` row referencing that ledger row.
6. Return `(charged := true, balance_units := new balance)`.

#### `grant_units(p_user_id text, p_delta_units int, p_reason text, p_idempotency_key text, p_metadata jsonb)`

Returns `(granted boolean, balance_units int)`.

1. Insert into `credit_ledger` with `on conflict (idempotency_key) do nothing`.
2. If no row was inserted, return `(granted := false, ...)` — the balance is untouched. A
   webhook delivered five times grants credits exactly once.
3. Upsert `user_credits`, adding `p_delta_units` to the balance and to `lifetime_granted`.
4. For negative deltas (refunds), clamp the balance at zero so the check constraint cannot
   be violated by a user who already spent. Record the *actual* applied delta in
   `balance_after`.

## Data Flow

### Conversion — 1 credit

`POST /api/projects/[id]/convert`:

1. `requireAuth()`, ownership check, existing rate limit.
2. **Pre-check:** if no unlock exists for `('conversion', projectId)` and
   `balance_units < 10`, return **402** before doing any work.
3. Run the pipeline (quantize → trace → assemble) as today.
4. Upload the result and insert `project_versions` row 1 with `source = 'conversion'` and
   `content_hash = computeSvgHash(svg)`.
5. **Then** `spend_units(userId, 'conversion', projectId, 10, 'conversion')`.
6. Insert a 0-unit unlock for `('version_export', version1.id)` so the original is
   permanently free to export.

The debit is after the pipeline succeeds, so a failed trace never costs a credit. The
idempotency key is per project, so re-converting the same project — including a Redis cache
hit on an identical image — never charges twice.

`projects.svg_path` continues to point at the latest version so existing read paths
(dashboard thumbnails, editor load, `attachSignedUrls`) keep working unchanged.

### Save — free

`PATCH /api/projects/[id]` changes from destructive overwrite to append:

1. Sanitize the incoming SVG (unchanged, `lib/svg/sanitize.ts`).
2. Compute `computeSvgHash()`.
3. If a version with that `(project_id, content_hash)` exists, return it — no new row, no
   new upload. Saving twice without edits creates nothing.
4. Otherwise upload to `projects/{projectId}/versions/{hash}.svg`, insert the next
   `version_number` with `source = 'edit'`, and update `projects.svg_path`.

No credits are involved. Saving, switching versions, and restoring an older version are all
free — users must be able to work in the editor without watching a meter.

`output.svg` is never written again.

### Export — 0.1 credits for edited versions, free for the original

`GET /api/projects/[id]/export?format=svg|png&versionId={uuid}` (defaults to latest):

1. `requireAuth()`, then verify project ownership.
2. Resolve the target version and its `source`.
3. Determine cost: `source = 'conversion'` → 0 units; `source = 'edit'` → 1 unit.
4. **Pre-check (cheap, non-authoritative):** if the version is not unlocked, costs units, and
   the balance is short, return **402** immediately, before doing any work.
5. Produce the bytes: download the version's SVG, sanitize, and for PNG render via `sharp`.
6. **Debit (authoritative, atomic):** `spend_units(userId, 'version_export', versionId, cost,
   'version_export')`.
7. Return the file, with `X-Credits-Remaining` (in units) and `X-Credit-Charged` headers.

The pre-check exists so users fail fast. The debit is step 6, after the bytes exist, so a
`sharp` failure never costs anything. If the response is lost in flight after a successful
debit, the unlock row already exists and the retry is free.

### Purchase

1. `POST /api/payments/checkout` creates a Dodo checkout session for the **USD $3.00** /
   200-unit product, carrying `clerk_user_id` in metadata, and returns the redirect URL.
   All prices are USD; `amount_cents` is 300 and `currency` is `USD`.
2. User completes payment on Dodo's hosted checkout.
3. Dodo redirects to `/dashboard?purchase=success`.
4. `POST /api/webhooks/dodo` verifies the signature with **svix** (already a dependency;
   same pattern as `app/api/webhooks/clerk/route.ts`), upserts the `purchases` row, and on a
   succeeded payment calls `grant_units(+200, 'purchase', 'dodo:{paymentId}')`.

The redirect is cosmetic. The webhook is the only thing that grants credits, so a user who
closes the tab before redirecting still gets what they paid for.

`POST /api/payments/checkout` is rate-limited with the existing `writeRatelimit` helper from
`lib/cache/redis.ts`, keyed on the Clerk user ID, so session creation cannot be spammed.

Dodo variable names already exist in this project from the abandoned buy-me-a-coffee feature,
and those names are authoritative. Their *values*, however, are mostly placeholders — the
coffee feature was scaffolded and never wired up:

| Variable | State in `.env.local` | Needed |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | real value, presumed live-mode | test-mode key for local dev |
| `DODO_PAYMENTS_ENV` | `live_mode` | must be `test_mode` locally |
| `DODO_COFFEE_PRODUCT_ID` | placeholder | unused by this feature |
| `DODO_WEBHOOK_SECRET` | placeholder | real secret from the webhook endpoint |
| `DODO_CREDITS_PRODUCT_ID` | absent | **new** — added to `.env.example` |

**The test-mode product has been created:** "20 Credits", `pdt_0NkrXFtkhfLfC8arGkSwm`, one-time,
$3.00 USD, tax category SaaS.

**Tax is added on top of the price**, not included: at a 10% rate the customer is charged
$3.30 and the business nets $3.00. This is a deliberate choice. Because the checkout total
therefore exceeds the advertised price, all pricing copy must read "$3 + tax" or "plus
applicable tax" — a total that appears higher than advertised, with no warning, is a common
reason cheap purchases get abandoned.

**Local development must run `DODO_PAYMENTS_ENV=test_mode`.** Test mode requires the
test-mode API key and test-mode webhook secret, which Dodo issues separately from the live
pair — changing only the env value is not sufficient.

The credits product must exist in **both** modes, with its own ID in each. `.env.local` holds
the test-mode ID; Vercel production holds the live-mode ID, created at go-live.

### Signup grant

`app/api/webhooks/clerk/route.ts` already handles `user.created` with svix verification. It
gains one call: `grant_units(+30, 'signup_grant', 'signup:{userId}')` — 3 credits, sized for
two complete projects with edits and exports (see "Why the grant is 3 credits").

The free allowance is *just credits*. There is no separate free-tier counter anywhere, and
no second balance to keep in sync.

## New Types and Errors

`lib/types.ts` gains:

- `ErrorCode` member `PAYMENT_REQUIRED` and `AppError.paymentRequired()` returning 402.
- `ProjectVersion`, `CreditBalance`, `LedgerEntry`, and export/checkout response types.

`lib/credits/` is a new module holding:

- Typed wrappers over the two Postgres functions, so no route calls `supabase.rpc` directly.
- `UNITS_PER_CREDIT = 10` and the cost table (`CONVERSION_UNITS = 10`,
  `VERSION_EXPORT_UNITS = 1`), defined once and imported everywhere. No route hardcodes a price.
- `formatCredits(units)` for display.

## UI

- **Credit balance, always visible at the top of every app page.** Not tucked into a menu —
  rendered in the top bar of `components/shared/Navbar.tsx`, so it is present on the
  dashboard, the editor, and the icons pages without the user going looking for it. Shows
  credits (`units / 10`, one decimal place only when fractional), links to `/pricing`, and
  refreshes after any charge so the number visibly moves when something is spent. A balance
  people cannot see is a balance they cannot reason about, and the first time they learn the
  number is at a paywall, it reads as a trap.

  New users with an untouched grant see it labelled **"2 projects, on us"** rather than a
  bare "3.0" — the grant only does its job if people understand what it buys. Once any credit
  is spent, it reverts to the plain balance.

  Low-balance state (under 1 credit, i.e. cannot start another conversion) styles the
  indicator as a warning and links straight to checkout, so running out is never a surprise
  that lands mid-task.
- **Convert button** shows "Convert · 1 credit" when the project has not been paid for, and
  no cost once its conversion unlock exists.
- **Export button** reads "Download" when the version is the original or already unlocked,
  and "Export · 0.1 credit" when it is an edited version that is not.
- **Insufficient-balance modal** on 402: "20 credits for $3 + tax", with the checkout button.
  The "+ tax" is not optional copy — the Dodo checkout total is higher than $3, and a price
  that changes between the button and the payment page loses the sale.
- **Version history panel** in the editor: list versions with timestamps, preview, restore.
  Versions already unlocked are marked so users can see what is free to export.
- **`/pricing` page** describing the single pack and the cost table. Public and indexable,
  alongside the existing pSEO routes.

## Guest Removal

The guest path is dead code: `app/(app)/layout.tsx` redirects unauthenticated users to
`/login`, and `/dashboard` lives under `(app)`, so no guest can reach it from the frontend.

Remove:

- `app/api/projects/claim/route.ts` (entire route)
- The `ids=` guest branch in `GET /api/projects`
- `getGuestIds` / `addGuestId` / `clearGuestIds` in `app/(app)/dashboard/page.tsx`
- The `isGuest` prop on `components/shared/ProjectCard.tsx`
- Guest handling in `app/api/projects/[id]/convert/route.ts` and `app/api/jobs/[id]/route.ts`

Change:

- `proxy.ts` — add `/dashboard` and `/icons` to `isProtectedPath`; fix the stale comment
  claiming the dashboard is open to guests.

Migrations are applied with `supabase db push`.

Data:

- The migration **reports the count** of rows with `user_id is null`. It does not delete
  them. Deletion happens only after the count has been shown to the owner and explicitly
  approved, with a backup of the rows and their storage paths taken first.
- `projects.user_id` becomes `not null` only after that cleanup, in a follow-up migration.

## Error Handling

| Scenario | Behaviour |
|---|---|
| Balance short, conversion not unlocked | 402 `PAYMENT_REQUIRED`, no debit, pipeline never runs |
| Balance short, edited-version export | 402, no debit, no bytes produced |
| Conversion pipeline fails | 500, **no debit** (debit follows a successful trace) |
| `sharp` PNG render fails | 500, **no debit** |
| Response lost after successful debit | Unlock row exists; retry is free |
| Double-clicked Convert or Export | Row lock in `spend_units` serialises; one debit |
| Re-converting the same project | `convert:{projectId}` key already used; free |
| Exporting the original version | 0 units; unlock recorded, balance untouched |
| Dodo webhook delivered N times | Unique `idempotency_key`; credits granted once |
| Webhook arrives before user_credits row exists | `grant_units` upserts the row |
| Refund for already-spent credits | Balance clamped at 0; actual delta recorded |
| Webhook signature invalid | 400, nothing written |

## Testing

**Unit**
- Content-hash stability and sensitivity — DONE, see "Completed Ahead of Plan".
- Unit/credit conversion and `formatCredits` display, including 0.1 and 1.5 credits.
- Ledger idempotency-key construction.

**Integration (against Supabase)**
- Conversion debits exactly 10 units and creates one unlock.
- Re-converting the same project debits nothing.
- Conversion with 9 units raises and leaves the balance untouched.
- Exporting an original version debits 0 and records an unlock.
- Exporting an edited version debits exactly 1 unit.
- Exporting the same edited version again, in a different format, debits nothing.
- Concurrent exports of one version produce exactly one debit.
- `grant_units` called twice with the same key grants once.
- Refund clamping at zero.
- `PATCH` with unchanged SVG creates no new version.
- Balances never go negative and never hold a fractional value.

**E2E (Playwright)**
- Signup → 3 credits → convert (1 credit) → export original (free) → edit → save (free) →
  export edited (0.1) → balance reads 1.9.
- The full free journey: two projects, several edited exports each, all succeed without
  payment — this is the experience the grant exists to guarantee, so it is tested explicitly.
- Spend the grant down → 402 on the next conversion → pricing modal appears.
- Re-download of an already-exported version does not change the balance.

**Manual (Chrome, Dodo test mode)**
- Full purchase flow: 402 → checkout → payment → webhook → balance updates → convert succeeds.
- Version history panel: create several versions, switch between them freely, confirm only
  exporting an edited version charges.

## Roadmap Context

This is sub-project 1 of 6. Each subsequent one gets its own spec, plan, implementation, and
browser verification:

1. **Credits + versions + Dodo payments** ← this spec
2. Tracing presets and live preview
3. Export formats (PDF/EPS, React component, favicon pack, DXF)
4. SVG optimization panel (`svgo` is already a dependency but unused)
5. Batch conversion
6. Background removal

Billing is first because every later feature needs a meter to charge against.

Note for sub-project 2: tracing presets let users re-run conversion with different settings.
Under this design, re-converting an existing project is free (`convert:{projectId}`), so
experimenting with presets costs nothing. That is deliberate — a live preview users are
afraid to touch is worthless. Revisit only if it proves expensive in practice.

## Completed Ahead of Plan

Two items were resolved before implementation planning began.

### Hash stability — RESOLVED

The risk was real and worse than first described. `lib/parseSvg.ts` assigned unnamed paths
an id of `path-{n}-{Math.random()}`, and `serializeSvg` writes ids back into the saved file.
Opening the editor twice on the same conversion and saving each time produced byte-different
files for identical artwork — two hashes, two charges. It was also a latent bug before
billing existed, since random ids were being baked into every saved SVG.

Fixed in two layers:

1. **Deterministic ids at the source** (`lib/parseSvg.ts`). Generated ids are now sequential
   (`path-1`, `path-2`), with author-supplied ids reserved first so numbering cannot collide
   with them.

2. **Canonicalisation before hashing** (`lib/svg/canonicalize.ts`, new). `computeSvgHash()`
   hashes a canonical form rather than raw bytes, neutralising differences that are not
   visual: element ids, `class` and `data-*` attributes, attribute order, whitespace, hex
   colour casing, `-0` vs `0`, and float drift below 3 decimal places. Anything that changes
   rendering still changes the hash. Number normalisation is restricted to an allow-list of
   geometry attributes, so colour values are never mangled — a naive pass over every
   attribute would rewrite `#000000` to `#0`.

`content_hash` in `project_versions` is `computeSvgHash()`, not a raw-byte digest.

Covered by 24 passing tests across `__tests__/unit/svg/canonicalize.test.ts` (17) and
`__tests__/unit/parseSvg.test.ts` (7), split between stability cases (must hash the same)
and sensitivity cases (must hash differently), including a regression guard for the
all-digit colour bug.

### Icon download route — REMOVED

`app/api/icons/[id]/download/route.ts` is deleted, along with its callers in
`components/icons/IconCard.tsx` and `components/icons/IconDetailModal.tsx`.

Note: `increment_download_count` is still called from `GET /api/icons/[id]`, and
`icons.download_count` is still read by the admin portal. With downloads gone, that counter
now effectively measures icon *detail views*. It is left in place deliberately — removing it
would cascade into the admin queries and UI, which is out of scope here.

## Open Risks

1. **Dodo API drift.** Event names and API shapes must be read from current documentation,
   not recalled. A wrong event name means payments that silently never grant credits.

2. **Existing users get nothing.** The signup grant fires on Clerk's `user.created`, which
   never fires for accounts that already exist. A one-off backfill script must grant 30 units
   to every existing user with idempotency key `signup:{userId}`, run once after the
   migration. Without it, current users hit a paywall on their first conversion with no free
   allowance ever having been given.

3. **Existing projects predate the meter.** Projects converted before this ships have no
   conversion unlock, so their owners would be charged to export edits of work they already
   did. The migration backfills a 0-unit `('conversion', projectId)` unlock for every
   existing project, grandfathering them in.

4. **Storage growth.** Versions are never deleted, so a user who saves 200 times stores 200
   SVGs. Acceptable at current scale (SVGs are small, and the content-hash unique constraint
   deduplicates no-op saves). Revisit with a retention policy if storage costs become visible.
