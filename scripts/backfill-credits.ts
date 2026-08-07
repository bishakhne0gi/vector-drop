/**
 * One-off backfill for the credits launch.
 *
 * Two problems this fixes, both of which would hit real users on day one:
 *
 *   1. Clerk's user.created webhook only fires for NEW signups, so every
 *      existing account has zero credits and would be paywalled immediately,
 *      having never received the free grant the pricing promises.
 *
 *   2. Projects converted before the meter existed have no conversion unlock,
 *      so their owners would be charged to export edits of work they already
 *      did — a paywall applied retroactively.
 *
 * Also creates version 1 for existing projects so history starts from what
 * users already have, rather than their first future save appearing as the
 * beginning of time.
 *
 * Every write is idempotent (structural idempotency keys + unique unlocks), so
 * re-running is safe and grants nothing further.
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-credits.ts           # dry run
 *   node --env-file=.env.local scripts/backfill-credits.ts --apply   # write
 *
 * Talks to PostgREST over plain fetch on purpose: lib/api/supabase.ts pulls in
 * @clerk/nextjs/server, which will not resolve under bare node.
 */
import { SIGNUP_GRANT_UNITS } from "../lib/credits/constants.ts";
import { ledgerKeys } from "../lib/credits/keys.ts";
import { computeSvgHash } from "../lib/svg/canonicalize.ts";

const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=.env.local scripts/backfill-credits.ts");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

interface ProjectRow {
  id: string;
  user_id: string | null;
  svg_path: string | null;
  status: string;
}

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function rpc(fn: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RPC ${fn} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function downloadSvg(storagePath: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${storagePath}`, {
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return res.ok ? res.text() : null;
}

async function uploadSvg(storagePath: string, svg: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "image/svg+xml",
      "x-upsert": "true",
    },
    body: svg,
  });
  return res.ok;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (no writes)\n");

  const projects = await rest<ProjectRow[]>(
    "projects?select=id,user_id,svg_path,status&user_id=not.is.null&order=created_at.asc",
  );
  const icons = await rest<Array<{ user_id: string }>>("icons?select=user_id");

  const userIds = [
    ...new Set([
      ...projects.map((p) => p.user_id!).filter(Boolean),
      ...icons.map((i) => i.user_id).filter(Boolean),
    ]),
  ];

  console.log(`Found ${userIds.length} users and ${projects.length} owned projects.\n`);

  let granted = 0;
  let alreadyGranted = 0;

  for (const userId of userIds) {
    if (!APPLY) {
      console.log(`  would grant ${SIGNUP_GRANT_UNITS} units -> ${userId}`);
      continue;
    }
    const rows = (await rpc("grant_units", {
      p_user_id: userId,
      p_delta_units: SIGNUP_GRANT_UNITS,
      p_reason: "signup_grant",
      p_idempotency_key: ledgerKeys.signup(userId),
      p_metadata: { backfill: true },
    })) as Array<{ granted: boolean; balance_units: number }>;

    if (rows[0]?.granted) {
      granted++;
      console.log(`  granted ${SIGNUP_GRANT_UNITS} units -> ${userId} (balance ${rows[0].balance_units})`);
    } else {
      alreadyGranted++;
      console.log(`  already granted -> ${userId}`);
    }
  }

  let grandfathered = 0;
  let versionsCreated = 0;
  let versionsSkipped = 0;
  const failures: string[] = [];

  for (const project of projects) {
    const userId = project.user_id!;

    if (!APPLY) {
      console.log(`  would grandfather project ${project.id}${project.svg_path ? " + version 1" : ""}`);
      continue;
    }

    try {
      // 0-unit unlock: the project is exportable without ever charging for a
      // conversion that predates the meter.
      await rpc("spend_units", {
        p_user_id: userId,
        p_kind: "conversion",
        p_ref_id: project.id,
        p_units: 0,
        p_reason: "conversion",
      });
      grandfathered++;

      if (!project.svg_path) {
        versionsSkipped++;
        continue;
      }

      const existing = await rest<Array<{ id: string }>>(
        `project_versions?project_id=eq.${project.id}&select=id&limit=1`,
      );
      if (existing.length > 0) {
        versionsSkipped++;
        continue;
      }

      const svg = await downloadSvg(project.svg_path);
      if (!svg) {
        failures.push(`${project.id}: svg missing at ${project.svg_path}`);
        continue;
      }

      const hash = computeSvgHash(svg);
      const storagePath = `projects/${project.id}/versions/${hash}.svg`;

      if (!(await uploadSvg(storagePath, svg))) {
        failures.push(`${project.id}: upload failed`);
        continue;
      }

      const insert = await fetch(`${SUPABASE_URL}/rest/v1/project_versions`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          project_id: project.id,
          user_id: userId,
          version_number: 1,
          content_hash: hash,
          storage_path: storagePath,
          source: "conversion",
          byte_size: Buffer.byteLength(svg, "utf8"),
        }),
      });

      if (!insert.ok) {
        failures.push(`${project.id}: version insert -> ${await insert.text()}`);
        continue;
      }

      const [version] = (await insert.json()) as Array<{ id: string }>;
      versionsCreated++;

      // The original version is always free to export.
      await rpc("spend_units", {
        p_user_id: userId,
        p_kind: "version_export",
        p_ref_id: version.id,
        p_units: 0,
        p_reason: "version_export",
      });

      console.log(`  project ${project.id}: grandfathered + version 1 created`);
    } catch (err) {
      failures.push(`${project.id}: ${(err as Error).message}`);
    }
  }

  console.log("\n─── Summary ─────────────────────────────");
  console.log(`users:            ${userIds.length}`);
  console.log(`projects:         ${projects.length}`);
  if (APPLY) {
    console.log(`granted:          ${granted}`);
    console.log(`already granted:  ${alreadyGranted}`);
    console.log(`grandfathered:    ${grandfathered}`);
    console.log(`versions created: ${versionsCreated}`);
    console.log(`versions skipped: ${versionsSkipped}`);
    console.log(`failures:         ${failures.length}`);
    for (const f of failures) console.log(`   ! ${f}`);
  } else {
    console.log("\nNo writes were made. Re-run with --apply to execute.");
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
