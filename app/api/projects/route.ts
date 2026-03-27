import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError, CreateProjectResponse } from "@/lib/types";

export async function GET(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;
  try {
    const { supabase, user } = await requireAuth();
    userId = user.id;

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw AppError.internal(`Failed to fetch projects: ${error.message}`);
    }

    const list = projects ?? [];

    // Generate signed URLs for all projects that have an svg_path
    const svgPaths = list
      .filter((p) => p.svg_path && !p.svg_url)
      .map((p) => p.svg_path as string);

    if (svgPaths.length > 0) {
      const svc = createServiceClient();
      const { data: signed } = await svc.storage
        .from("images")
        .createSignedUrls(svgPaths, 60 * 60); // 1-hour URLs

      if (signed) {
        const urlMap = new Map(signed.map((s) => [s.path, s.signedUrl]));
        for (const project of list) {
          if (project.svg_path && !project.svg_url) {
            project.svg_url = urlMap.get(project.svg_path) ?? null;
          }
        }
      }
    }

    return Response.json(list);
  } catch (err) {
    return handleError(err, "GET /api/projects", userId, Date.now() - start);
  }
}

const ROUTE = "POST /api/projects";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1).max(500),
  mimeType: z.enum(ALLOWED_MIME),
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
});

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    // 1. Auth
    const { supabase, user } = await requireAuth();
    userId = user.id;

    // 2. Parse + validate body
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", {
        issues: parsed.error.issues,
      });
    }
    const { name, fileName, mimeType, fileSizeBytes } = parsed.data;

    // 3. Create project record (status = 'pending')
    const storagePath = `projects/${user.id}/${crypto.randomUUID()}/${fileName}`;

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
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

    // 4. Generate signed upload URL via service client (bypasses storage RLS)
    const serviceClient = createServiceClient();
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from("images")
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      // Roll back project record
      await serviceClient.from("projects").delete().eq("id", project.id);
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
