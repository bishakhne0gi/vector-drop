import { z } from "zod";

import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { readRatelimit, writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { AppError, CreateProjectResponse } from "@/lib/types";



export async function GET(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;
  try {
    // Auth required — the guest listing path was removed with the POC cutover.
    const authResult = await requireAuth();
    userId = authResult.userId;

    const svc = createServiceClient();

    const { remaining: readRemaining } = await enforceRateLimit(readRatelimit, userId);

    const { data: projects, error } = await svc
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw AppError.internal(`Failed to fetch projects: ${error.message}`);
    }

    const list = projects ?? [];
    await attachSignedUrls(svc, list);

    return Response.json(list, {
      headers: { "X-RateLimit-Remaining": String(readRemaining) },
    });
  } catch (err) {
    return handleError(err, "GET /api/projects", userId, Date.now() - start);
  }
}

async function attachSignedUrls(svc: ReturnType<typeof createServiceClient>, list: Array<Record<string, unknown>>) {
  const projectsWithSvg = list.filter((p) => p.svg_path);
  if (projectsWithSvg.length === 0) return;

  const svgPaths = projectsWithSvg.map((p) => p.svg_path as string);

  // Generate signed URLs one-by-one — bulk createSignedUrls silently returns
  // empty signedUrl strings for some paths; individual calls expose the real error.
  await Promise.all(
    projectsWithSvg.map(async (project) => {
      const { data, error } = await svc.storage
        .from("images")
        .createSignedUrl(project.svg_path as string, 3600);
      if (error) {
        // File missing (e.g. stale cache hit pointing to a deleted project's SVG).
        // Clear svg_path so the UI shows the placeholder instead of a broken image.
        console.warn("[attachSignedUrls] File not found, clearing svg_path:", project.svg_path);
        project.svg_path = null;
        project.status = "error";
        // Best-effort: mark the project row so it re-converts next time
        void svc.from("projects")
          .update({ svg_path: null, status: "error", error_message: "SVG file missing — please reconvert" })
          .eq("id", project.id as string);
      } else if (data?.signedUrl) {
        project.svg_url = data.signedUrl;
      }
    }),
  );
}

const ROUTE = "POST /api/projects";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1).max(500),
  mimeType: z.enum(ALLOWED_MIME),
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: "File is too large. Please upload an image smaller than 10 MB and try again.",
  }),
});

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const authResult = await requireAuth();
    userId = authResult.userId;

    await enforceRateLimit(writeRatelimit, userId);

    // Parse + validate body
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      const fileSizeIssue = parsed.error.issues.find((i) =>
        i.path.includes("fileSizeBytes") && i.code === "too_big",
      );
      if (fileSizeIssue) {
        throw AppError.validation(
          "File is too large. Please upload an image smaller than 10 MB and try again.",
        );
      }
      throw AppError.validation("Invalid request body", {
        issues: parsed.error.issues,
      });
    }
    const { name, fileName, mimeType, fileSizeBytes } = parsed.data;

    const storagePath = `projects/${userId}/${crypto.randomUUID()}/${fileName}`;

    const svc = createServiceClient();
    const { data: project, error: insertError } = await svc
      .from("projects")
      .insert({
        user_id: userId,
        name,
        source_image_path: storagePath,
        status: "pending",
      })
      .select()
      .single();

    if (insertError || !project) {
      throw AppError.internal(
        `Failed to create project: ${insertError?.message ?? "no data returned"}`,
      );
    }

    const { data: signedData, error: signedError } = await svc.storage
      .from("images")
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      await svc.from("projects").delete().eq("id", project.id);
      throw AppError.storage(
        `Failed to generate upload URL: ${signedError?.message ?? "unknown"}`,
        { storagePath },
      );
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        projectId: project.id,
        fileSizeBytes,
        mimeType,
      }),
    );

    const response: CreateProjectResponse = {
      project,
      uploadUrl: signedData.signedUrl,
      storagePath,
    };

    return Response.json(response, { status: 201 });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
