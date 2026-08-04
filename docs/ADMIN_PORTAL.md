# Admin portal (`/hades`)

A private, unindexed dashboard showing every user, every image they uploaded,
every SVG produced, and the daily conversion volume.

## Access

Access is granted by **one rule**: the Clerk session's *primary* email must be
**verified** and present on the `ADMIN_EMAILS` allowlist. Nothing else grants it
— not a role, not a URL, not a header.

Everyone else — logged out, logged in as a normal user, or a crawler — gets a
plain **404**, byte-identical to the 404 any unknown URL returns. The route
never announces that it exists.

Enforcement runs at two layers:

| Layer | File | What it does |
| --- | --- | --- |
| Proxy/middleware | `proxy.ts` | Rewrites `/hades*` to an unmatched path (→ 404) when there is no session, or when the session token's email claim is a non-admin. Falls through when the token carries no email claim, so a claim-less session can never lock the owner out. |
| Page | `lib/admin/auth.ts` → `requireAdmin()` | Authoritative. Re-reads the user from the **Clerk API**, requires the primary email to be `verification.status === "verified"`, checks the allowlist, and calls `notFound()` otherwise. Runs in the layout **and in every page** — a layout alone can be skipped by client-side navigation reusing a cached segment. |

Every grant and every denial is logged as structured JSON (`admin_access` /
`admin_access_denied`) with the userId and email.

## Configuration

```bash
# Comma-separated. Defaults to bneogi102002@gmail.com when unset, so the portal
# works on a fresh deploy with no configuration.
ADMIN_EMAILS=bneogi102002@gmail.com

# Timezone used to bucket rows into calendar days everywhere in the portal.
ADMIN_TIMEZONE=Asia/Kolkata
```

To add or revoke an admin, change `ADMIN_EMAILS` and redeploy. To harden
further, turn on 2FA for the admin account in the Clerk dashboard — the portal
surfaces each user's 2FA state on their detail page.

## Not indexed

- `robots` metadata on the `/hades` layout: `noindex, nofollow, nocache`.
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` plus
  `Cache-Control: private, no-store` on every `/hades` response (`proxy.ts`).
- **Deliberately absent from `robots.txt`.** Listing it there would publish the
  path to anyone who reads the file, which is the opposite of the goal.
- All four routes render dynamically (`ƒ` in the build output) — never
  prerendered into a static file.

## Screens

| Route | Shows |
| --- | --- |
| `/hades` | Today's conversions, active users, signups; 30-day bar chart; 14-day breakdown table; latest conversions and feedback. |
| `/hades/conversions` | Every upload with its source thumbnail and generated SVG side by side. Filter by day and status, 50 per page. |
| `/hades/users` | Clerk directory joined with per-user conversion/icon/feedback counts. Search by email, name or id; sort by activity, volume or signup date. |
| `/hades/users/[id]` | One user: totals, account state, conversions grouped by day with previews, icons, feedback. |
| `/hades/feedback` | Every rating and comment with the account that left it. Rating distribution, average, filters by rating / source page / day / has-a-comment / single user. |

## How feedback is attributed

`feedback.user_id` is a nullable Clerk id. Clerk owns the emails, Supabase owns
the rows, so the portal joins them in memory (`userById`) and every row lands in
one of three states, rendered consistently by `<UserCell>`:

| `user_id` | Renders as | Meaning |
| --- | --- | --- |
| matches a Clerk user | their email, linked to `/hades/users/<id>` | Signed-in user |
| `null` | `guest` | Left while logged out — genuinely unattributable |
| set, but unknown to Clerk | `unknown account`, still linked | Deleted account, or a legacy dev-instance id (see `remap-legacy-user.ts`) |

The third case is never silently dropped — a 1★ review from an account you can
no longer name still has to be visible. `/hades/feedback?user=<id>` filters to
one account, and `?user=guest` to anonymous submissions only.

## Implementation notes

- **Storage previews** use Supabase signed URLs with a 10-minute TTL, generated
  only for the rows currently on screen — a signed URL is a bearer credential,
  so the portal mints as few as possible. Paths whose file is missing are simply
  omitted and render an `n/a` placeholder.
- **No admin API routes exist.** Every screen is a Server Component reading
  Supabase directly, so there is no admin endpoint to find or attack, and no
  admin data crosses to the client beyond the rendered HTML.
- **Reads are unbounded but capped.** `lib/admin/queries.ts` pages through
  PostgREST 1000 rows at a time up to `MAX_ROWS` (50,000) and aggregates in
  memory. Fine at current volume; if the tables grow past that, move the daily
  rollups into a SQL view.
- **Users unknown to Clerk still get a row.** Project rows carrying a legacy dev
  Clerk id (see `lib/auth/remap-legacy-user.ts`) or belonging to a deleted
  account are listed as "deleted / unknown" rather than being silently dropped,
  so no conversion goes unaccounted for.
