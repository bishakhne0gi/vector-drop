import { createServiceClient } from "@/lib/api/supabase";
import { computeSvgHash } from "@/lib/svg/canonicalize";
import { AppError, type ProjectVersion } from "@/lib/types";

/**
 * Project version history.
 *
 * Before this existed, PATCH /api/projects/[id] wrote every save to
 * projects/{id}/output.svg — each save destroyed the previous SVG, and the
 * original traced output was unrecoverable after the first edit.
 *
 * Versions are addressed by CANONICAL content hash (see lib/svg/canonicalize),
 * not raw bytes, so cosmetic differences — element ids, attribute order,
 * whitespace, sub-precision float drift — cannot produce a "new" version. That
 * matters commercially: a new version is separately chargeable, so an unstable
 * hash would bill people for saving artwork they never changed.
 */

export function versionStoragePath(projectId: string, contentHash: string): string {
  return `projects/${projectId}/versions/${contentHash}.svg`;
}

/**
 * Creates a version, or returns the existing one when this project already has
 * a version with the same canonical content.
 *
 * `created: false` means the artwork is unchanged — saving twice without edits
 * creates nothing.
 */
export async function createVersion(args: {
  projectId: string;
  userId: string;
  svg: string;
  source: "conversion" | "edit";
  pathCount?: number;
}): Promise<{ version: ProjectVersion; created: boolean }> {
  const svc = createServiceClient();
  const contentHash = computeSvgHash(args.svg);

  const { data: existing } = await svc
    .from("project_versions")
    .select("*")
    .eq("project_id", args.projectId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing) return { version: existing as ProjectVersion, created: false };

  const { data: last } = await svc
    .from("project_versions")
    .select("version_number")
    .eq("project_id", args.projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = ((last?.version_number as number | undefined) ?? 0) + 1;
  const storagePath = versionStoragePath(args.projectId, contentHash);
  const byteSize = Buffer.byteLength(args.svg, "utf8");

  const { error: uploadErr } = await svc.storage
    .from("images")
    .upload(storagePath, new Blob([args.svg], { type: "image/svg+xml" }), {
      upsert: true,
      contentType: "image/svg+xml",
    });

  if (uploadErr) {
    throw AppError.storage(`Failed to store version: ${uploadErr.message}`, { storagePath });
  }

  const { data: inserted, error: insertErr } = await svc
    .from("project_versions")
    .insert({
      project_id: args.projectId,
      user_id: args.userId,
      version_number: versionNumber,
      content_hash: contentHash,
      storage_path: storagePath,
      source: args.source,
      path_count: args.pathCount ?? null,
      byte_size: byteSize,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    // A concurrent save may have inserted the same hash (or the same version
    // number) first. Both unique constraints are doing their job — re-read
    // rather than failing the user's save.
    const { data: raced } = await svc
      .from("project_versions")
      .select("*")
      .eq("project_id", args.projectId)
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (raced) return { version: raced as ProjectVersion, created: false };

    throw AppError.internal(`Failed to record version: ${insertErr?.message ?? "unknown"}`);
  }

  return { version: inserted as ProjectVersion, created: true };
}

/** Newest first. */
export async function listVersions(
  projectId: string,
  userId: string,
): Promise<ProjectVersion[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false });
  return (data ?? []) as ProjectVersion[];
}

export async function getVersion(versionId: string, userId: string): Promise<ProjectVersion> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions")
    .select("*")
    .eq("id", versionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw AppError.notFound("Version");
  return data as ProjectVersion;
}

export async function getLatestVersion(
  projectId: string,
  userId: string,
): Promise<ProjectVersion> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("project_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) throw AppError.notFound("Version");
  return data as ProjectVersion;
}
