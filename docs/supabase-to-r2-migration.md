# Moving VectorDrop's storage from Supabase to Cloudflare R2

**Date:** 10 August 2026
**Scope:** object storage only — Postgres stayed on Supabase
**Result:** 1,136 objects / 1.69 GB moved, zero failures, zero database rows rewritten

---

## 1. The problem

VectorDrop turns raster images into SVGs. That sounds like a light workload until you count what a single conversion actually writes to disk:

1. the **source image** the user uploaded (JPEG/PNG/WebP, up to 10 MB)
2. the **traced `output.svg`**
3. a **version SVG** for every save, addressed by content hash

The conversion pipeline quantises the image into colour clusters, traces each colour mask separately with potrace, then assembles the layers into one SVG. That process is *lossy in the wrong direction* for file size: a 200 KB photograph can become a **multi-megabyte** vector file, because every colour region becomes its own path with hundreds of curve points.

The real numbers from the production bucket:

| Metric | Value |
|---|---|
| Distinct objects | 1,156 |
| Total size | 1.74 GB |
| Average object | ~1.53 MB |
| Largest single SVG | **8.2 MB** |

Supabase's free tier gives you 1 GB of storage. We were at 1.74 GB. **Uploads had stopped working.** New users hit a wall on their first conversion — the single worst moment to fail.

That's the trigger. Not a performance problem, not an architecture itch. The product was broken and the meter had run out.

---

## 2. Why R2 specifically

Three reasons, in order of how much they mattered.

### Zero egress fees

This is the headline and it's the real reason. Cloudflare R2 charges **nothing** for data transfer out. S3 charges roughly $0.09/GB; most object stores charge something.

For a vectoriser this is decisive. Every time a user opens the editor, previews a project, or exports a file, we serve a multi-megabyte SVG back out. Egress is not an occasional cost for us — it's *the* cost, and it scales linearly with engagement. A product that gets more popular gets more expensive in exactly the dimension we can't control.

With R2, growth in usage costs nothing extra in bandwidth. We only pay for what we store.

### A genuinely free tier that fits

R2's free allowance: **10 GB storage, 1 million Class A operations, 10 million Class B operations per month.**

We needed 1.74 GB. That's 17% of the free tier — with room to roughly 5× before paying anything. Compare to Supabase, where we'd already blown through 1 GB.

### S3-compatible API

R2 speaks the S3 protocol. That means the standard `@aws-sdk/client-s3` works, including presigned URLs. No proprietary SDK, no lock-in, and if R2 ever disappoints, the same code points at S3 or Backblaze with an endpoint change.

### Why we did *not* move the database

Postgres stayed on Supabase, deliberately. The quota we exhausted was **storage**, not database. Moving Postgres would have meant rewriting every query, every RLS policy, every migration, and re-pointing the credits ledger — enormous risk, zero benefit to the actual problem.

> Migrate the thing that's broken. Not the thing next to it.

---

## 3. The architecture

The old setup and the new one are structurally identical, which is the point.

**Before:** private Supabase bucket. Server mints short-lived signed URLs. Browser uploads directly via signed PUT; reads via signed GET.

**After:** private R2 bucket. Server mints short-lived presigned URLs with SigV4. Browser uploads directly via presigned PUT; reads via presigned GET.

The browser never holds a credential in either design. Every URL expires (5–60 minutes depending on use). The bucket is private — there is no public development URL enabled.

All of it funnels through **one file**, `lib/storage/r2.ts`, exposing six operations: `downloadObject`, `uploadObject`, `copyObject`, `deleteObject`, `objectExists`, and the two URL signers. Nine call sites across the API routes, the version service, and the admin portal talk to that seam and nothing else.

### The decision that made this easy

**Object keys were preserved byte-for-byte.**

```
projects/{userId}/{uuid}/{filename}      ← source images
projects/{projectId}/output.svg          ← traced output
projects/{projectId}/versions/{hash}.svg ← version history
```

Because the keys didn't change, **not a single database column had to be rewritten.** Every `source_image_path`, `svg_path` and `storage_path` already sitting in Postgres still resolved after the cutover.

This turned a dangerous dual-write migration into a boring file copy. No downtime window, no backfill of foreign keys, no risk of a half-updated table. If the copy failed we simply pointed back at Supabase.

---

## 4. Five things that went wrong

This is the honest part. The migration took five separate corrections, and each one is a lesson.

### 4.1 Presigning succeeds for files that don't exist

Supabase's `createSignedUrl()` **returns an error** if the object is missing. Three places in the codebase relied on that — they caught the error and rendered a placeholder instead of a broken image.

S3-style presigning is a **purely local cryptographic operation**. It never contacts the server. It will happily sign a URL for a key that has never existed; you only discover the truth when the browser gets a 404.

Silently swapping one for the other would have replaced every graceful placeholder with a broken image icon. Fixed by adding explicit `HeadObject` probes (`objectExists`) before signing, in the project list, the preview redirect, and the admin portal.

> **Lesson:** when replacing a dependency, audit what you relied on its *errors* to tell you — not just its successes.

### 4.2 The dry run lied, confidently

The first dry run reported "1,136 objects to copy" — and it was meaningless. The credentials were still placeholder text. Every R2 lookup threw, got swallowed by a `catch` that returned "not present", and every object was counted as needing a copy.

The failure mode is nasty because **bad credentials and an empty bucket produce identical output.**

Fixed with a `HeadBucket` preflight that aborts loudly before any work begins.

> **Lesson:** a script that can't reach its destination must fail, not produce a confident plan. Design so that "broken" and "nothing to do" never look the same.

### 4.3 gzip made the size comparison useless

To make re-runs cheap, the script skips objects already in R2 with a matching byte size. Switching from full downloads to `HEAD` requests dropped the reported total from **1,743 MB to 468 MB**.

Supabase was gzipping the SVGs and reporting the *compressed* length. R2 stores *uncompressed* bytes. The two would never compare equal — so nothing would ever be skipped, and every re-run would re-copy everything.

Fixed by sending `Accept-Encoding: identity` on the HEAD, and treating any response that's still compressed as "size unknown, copy it anyway". The total went back to exactly 1,743.04 MB, matching the full-download measurement.

> **Lesson:** when a number changes by 4× after a "harmless" optimisation, that's a bug, not a win. Chase the discrepancy.

### 4.4 The order of operations wasted the scarce resource

The original script downloaded each object from Supabase *first*, then checked whether R2 already had it. On a quota-constrained source, that's exactly backwards — and a re-run after a partial failure would re-download everything it had already copied.

Reordered to probe **both sides with HEADs** and only transfer what genuinely needs it. A dry run went from pulling 1.7 GB of egress to ~40 seconds of metadata requests.

> **Lesson:** identify your scarce resource, then make sure the cheap check happens before the expensive one.

### 4.5 One dropped connection killed the whole run

The real migration crashed at **object 25 of 1,156** with `NGHTTP2_INTERNAL_ERROR` — a transient HTTP/2 hiccup from Supabase. Because the worker pool was a bare `Promise.all`, one rejection took down all eight workers. The process died with no summary and no record of what had been copied.

Worse, the shell reported **exit code 0**, because the command was piped into `grep` and the pipeline returns the *last* command's status.

Two fixes: retry with exponential backoff (4 attempts, network errors and 5xx only), and a per-object `try/catch` so a persistent failure is recorded and the run continues.

> **Lesson:** across a thousand network operations, a transient failure isn't an edge case — it's a certainty. Budget for it.

---

## 5. Two bugs that only appeared in the browser

Everything above was server-side. The first real upload attempt in production surfaced two more.

### 5.1 Content-Security-Policy blocked the upload

```
Refused to connect to 'https://vectordrop-images.<account>.r2.cloudflarestorage.com/...'
because it violates the document's Content-Security-Policy.
```

The app's `connect-src` directive listed Supabase but not R2. The browser refused the presigned PUT **before sending it**.

Easy to miss, because nothing in the server code changed — the CSP is a middleware header, and it had a hardcoded list of allowed hosts. Fixed by deriving the R2 host from `R2_ACCOUNT_ID` and `R2_BUCKET`, the same way the Supabase host was already derived.

> **Lesson:** direct-to-storage uploads mean your storage provider becomes part of your frontend's security policy.

### 5.2 The SDK signed a checksum of nothing

Hiding inside the blocked URL:

```
x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32
```

`AAAAAA==` is the CRC32 of **empty content**.

AWS SDK v3 (since ~3.729) defaults to `requestChecksumCalculation: "WHEN_SUPPORTED"`. For a normal upload it hashes the body and sends the checksum. But when *presigning*, there is no body yet — so it hashed nothing, and baked the checksum of nothing into the URL as a signed requirement.

The browser would then PUT the real file, and R2 would reject it for not matching. Fixing the CSP alone would have swapped one error for another.

Fixed with `requestChecksumCalculation: "WHEN_REQUIRED"` on the S3 client.

> **Lesson:** presigned URLs are signed *before the data exists*. Any SDK feature that inspects the body is a landmine.

---

## 6. Results

| | |
|---|---|
| Objects copied | 1,091 |
| Already present (from the crashed first run) | 45 |
| **Total in R2** | **1,136 / 1,136** |
| Data transferred | 1.69 GB |
| Failed | **0** |
| Database rows rewritten | **0** |
| Broken before we started | 20 |

Verified by an independent re-scan reporting `Would copy: 0, Already in R2: 1136`, plus an end-to-end check that presigned GETs return HTTP 200 with correct content types (`image/svg+xml`, `image/png`, `image/jpeg`) and a full upload→download round-trip that came back byte-identical.

The 20 "missing" objects were rows pointing at files that had already vanished *before* the migration — pre-existing breakage the copy couldn't fix. Thanks to the `objectExists` probes from §4.1, they now render as placeholders rather than broken images.

**Supabase Storage was never deleted.** The old bucket remains intact as a rollback path.

---

## 7. What to take away

1. **Migrate the broken thing, not its neighbours.** Storage was full; the database was fine. Scope discipline turned a scary migration into a file copy.

2. **Preserving keys is worth more than clever tooling.** Identical object paths meant zero schema changes, zero downtime, and a trivial rollback.

3. **Egress pricing is architecture.** For any product that serves large files back to users repeatedly, the bandwidth bill dominates. R2's zero-egress model doesn't just save money — it removes a scaling cliff.

4. **Two APIs that look alike are not alike.** The presign-succeeds-for-missing-files difference was invisible in the types and would have shipped silently.

5. **Verify with the real mechanism.** The migration script confirmed bytes were in R2. It took a *separate* check — presign, then fetch like a browser — to prove the app would actually work. Those are different claims.

6. **Distrust confident output.** The dry run's most dangerous moment wasn't when it crashed. It was when it succeeded while completely misconfigured.

---

## Appendix: the migration script

`scripts/migrate-storage-to-r2.ts` — idempotent, resumable, and non-destructive.

```bash
node --env-file=.env.production scripts/migrate-storage-to-r2.ts          # dry run
node --env-file=.env.production scripts/migrate-storage-to-r2.ts --apply  # copy
```

It derives its work list from the **database** rather than a bucket listing, because `source_image_path`, `svg_path` and `storage_path` are the only keys the app will ever request. Anything orphaned in the old bucket is unreachable and not worth paying to store twice.
