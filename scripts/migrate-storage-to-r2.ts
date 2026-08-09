/**
 * One-off copy of every object from Supabase Storage into Cloudflare R2.
 *
 * Supabase's free storage quota ran out, so the bytes moved to R2. Only the
 * bytes — Postgres stays where it is. Object keys are preserved EXACTLY, so no
 * database column has to be rewritten: every `source_image_path`, `svg_path`
 * and `storage_path` already stored keeps resolving after the cutover.
 *
 * The work list is derived from the database rather than from a bucket listing,
 * because those three columns are the only paths the app will ever ask for.
 * Anything orphaned in the old bucket is unreachable and not worth paying to
 * store again.
 *
 * Idempotent: an object already present in R2 with the same size is skipped, so
 * re-running after a partial failure copies only what is missing. Nothing is
 * ever deleted from Supabase — the old bucket stays intact as a rollback path
 * until you are satisfied.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-storage-to-r2.ts           # dry run
 *   node --env-file=.env.local scripts/migrate-storage-to-r2.ts --apply   # copy
 *
 * Talks to PostgREST over plain fetch on purpose: lib/api/supabase.ts pulls in
 * @clerk/nextjs/server, which will not resolve under bare node.
 */
import {
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET ?? "vectordrop-images";

const SUPABASE_BUCKET = "images";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=.env.local scripts/migrate-storage-to-r2.ts");
  process.exit(1);
}

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY.");
  process.exit(1);
}

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/** PostgREST caps a single response at 1000 rows; page through in chunks. */
const PAGE = 1000;
/** Copies run in parallel, but bounded — this is someone's laptop, not a fleet. */
const CONCURRENCY = 8;

async function restPaged<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${SUPABASE_URL}/rest/v1/${path}${sep}limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers: restHeaders });
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function contentTypeFor(key: string): string {
  if (key.endsWith(".svg")) return "image/svg+xml";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function collectKeys(): Promise<string[]> {
  const keys = new Set<string>();

  const projects = await restPaged<{
    source_image_path: string | null;
    svg_path: string | null;
  }>("projects?select=source_image_path,svg_path");

  for (const p of projects) {
    if (p.source_image_path) keys.add(p.source_image_path);
    if (p.svg_path) keys.add(p.svg_path);
  }

  const versions = await restPaged<{ storage_path: string | null }>(
    "project_versions?select=storage_path",
  );
  for (const v of versions) {
    if (v.storage_path) keys.add(v.storage_path);
  }

  return [...keys];
}

/** Byte length already in R2, or null when the object is absent. */
async function r2Size(key: string): Promise<number | null> {
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    return head.ContentLength ?? 0;
  } catch {
    return null;
  }
}

/**
 * Supabase drops the occasional connection mid-run (NGHTTP2_INTERNAL_ERROR)
 * when several transfers are in flight. Over a thousand-object migration that
 * is a near-certainty, not an edge case, so every request retries with backoff.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      // 5xx is worth another go; 4xx means the answer will not change.
      if (res.status >= 500 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2 ** i * 500));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2 ** i * 500));
      }
    }
  }

  throw lastErr;
}

function supabaseObjectUrl(key: string): string {
  return `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/**
 * Byte length at the source, without transferring the body.
 *
 * Egress is the scarce resource here — the Supabase quota running out is why
 * this migration exists. Sizing via HEAD keeps a dry run almost free and, more
 * importantly, lets a re-run skip already-copied objects without paying to
 * download them a second time.
 *
 * Returns -1 when the object exists but the size is unknown, so the caller
 * falls back to a full download rather than wrongly skipping it.
 */
async function sizeAtSupabase(key: string): Promise<number | null> {
  const res = await fetchWithRetry(supabaseObjectUrl(key), {
    method: "HEAD",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      // Without this Supabase gzips the SVGs and reports the COMPRESSED length,
      // which would never equal the uncompressed byte count stored in R2 — so
      // every object would look like it still needed copying, forever.
      "Accept-Encoding": "identity",
    },
  });
  if (!res.ok) return null;
  if (res.headers.get("content-encoding")) return -1; // compressed anyway: cannot compare
  const len = res.headers.get("content-length");
  return len === null ? -1 : Number(len);
}

async function downloadFromSupabase(key: string): Promise<Buffer | null> {
  const res = await fetchWithRetry(supabaseObjectUrl(key), {
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

interface Tally {
  copied: number;
  skipped: number;
  missing: number;
  failed: number;
  bytes: number;
}

async function migrateKey(key: string, tally: Tally): Promise<void> {
  // Both sides are probed with HEADs first. Only an object that genuinely
  // needs copying is ever transferred.
  const [srcSize, existing] = await Promise.all([
    sizeAtSupabase(key),
    r2Size(key),
  ]);

  if (srcSize === null) {
    // Referenced by a row but absent from the old bucket — already broken
    // before this migration, and nothing here can fix it.
    tally.missing++;
    console.warn(`  MISSING in Supabase: ${key}`);
    return;
  }

  // srcSize of -1 means the source withheld a Content-Length, so the sizes
  // cannot be compared and the object is copied to be safe.
  if (srcSize >= 0 && existing === srcSize) {
    tally.skipped++;
    return;
  }

  if (!APPLY) {
    tally.copied++;
    tally.bytes += Math.max(srcSize, 0);
    return;
  }

  const body = await downloadFromSupabase(key);
  if (!body) {
    tally.missing++;
    console.warn(`  MISSING in Supabase: ${key}`);
    return;
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentTypeFor(key),
      }),
    );
    tally.copied++;
    tally.bytes += body.length;
  } catch (err) {
    tally.failed++;
    console.error(`  FAILED ${key}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Fail loudly when R2 is unreachable.
 *
 * Without this the run is actively misleading: every per-object HEAD would
 * throw, get swallowed as "not in R2 yet", and the summary would confidently
 * report that all 1000+ objects still need copying — the same output bad
 * credentials and an empty bucket produce.
 */
async function preflight(): Promise<void> {
  try {
    await r2.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Cannot reach R2 bucket "${R2_BUCKET}": ${msg}\n`);
    console.error("Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");
    console.error("The API token needs Object Read & Write on this bucket.");
    process.exit(1);
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (copying)\n" : "MODE: DRY RUN (no writes)\n");

  await preflight();
  console.log(`Supabase bucket: ${SUPABASE_BUCKET}`);
  console.log(`R2 bucket:       ${R2_BUCKET}\n`);

  const keys = await collectKeys();
  console.log(`${keys.length} distinct object(s) referenced by the database.\n`);

  const tally: Tally = { copied: 0, skipped: 0, missing: 0, failed: 0, bytes: 0 };
  let cursor = 0;

  async function worker() {
    while (cursor < keys.length) {
      const key = keys[cursor++];
      // One object must never abort the migration. Before this, a single
      // dropped connection rejected the whole worker pool and killed the run
      // 25 objects in, with no summary and no record of what had been copied.
      try {
        await migrateKey(key, tally);
      } catch (err) {
        tally.failed++;
        console.error(
          `  FAILED ${key}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      const done = tally.copied + tally.skipped + tally.missing + tally.failed;
      if (done % 25 === 0) console.log(`  ...${done}/${keys.length}`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker),
  );

  const mb = (tally.bytes / 1024 / 1024).toFixed(2);
  console.log("\n─── Summary ───────────────────────────────");
  console.log(`${APPLY ? "Copied" : "Would copy"}: ${tally.copied} (${mb} MB)`);
  console.log(`Already in R2:  ${tally.skipped}`);
  console.log(`Missing at source: ${tally.missing}`);
  console.log(`Failed:         ${tally.failed}`);

  if (!APPLY) console.log("\nRe-run with --apply to perform the copy.");
  if (tally.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
