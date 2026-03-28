// Required environment variable: ANTHROPIC_API_KEY=sk-ant-...
// Add to .env.local alongside NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { aiGenerateRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { generateIcon } from "@/lib/ai/generateIcon";
import { AppError } from "@/lib/types";
import type { GenerateIconResponse } from "@/lib/types";

const ROUTE = "POST /api/ai/generate-icon";

const generateIconSchema = z.object({
  prompt: z.string().max(500).default(""),
  style: z.enum(["flat", "outline", "duotone"]),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "primaryColor must be a hex color like #3B82F6"),
  projectId: z.string().uuid().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { user } = await requireAuth();
    userId = user.id;

    const { remaining } = await enforceRateLimit(aiGenerateRatelimit, user.id);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = generateIconSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", {
        issues: parsed.error.issues,
      });
    }

    const { prompt, style, primaryColor, projectId } = parsed.data;

    if (!prompt && !projectId) {
      throw AppError.validation("Provide a prompt, a projectId, or both");
    }

    // If projectId provided: fetch + download source image for vision
    let imageBase64: string | undefined;
    let imageHash: string | undefined;

    if (projectId) {
      const svc = createServiceClient();

      const { data: project, error: projectErr } = await svc
        .from("projects")
        .select("source_image_path, source_image_hash, user_id")
        .eq("id", projectId)
        .single();

      if (projectErr || !project) throw AppError.notFound("Project");

      // Service client bypasses RLS — enforce ownership manually
      const typedProject = project as {
        source_image_path: string | null;
        source_image_hash: string | null;
        user_id: string;
      };

      if (typedProject.user_id !== userId) throw AppError.forbidden();

      if (!typedProject.source_image_path) {
        throw AppError.validation(
          "Project has no source image — cannot use vision mode",
        );
      }

      const { data: fileData, error: downloadErr } = await svc.storage
        .from("images")
        .download(typedProject.source_image_path);

      if (downloadErr || !fileData) {
        throw AppError.storage(
          `Failed to download source image: ${downloadErr?.message ?? "unknown"}`,
          { projectId, path: typedProject.source_image_path },
        );
      }

      const rawBuffer = Buffer.from(await fileData.arrayBuffer());

      // Resize to max 1024px and convert to JPEG before base64 —
      // Claude vision rejects images > 5 MB and phone photos easily exceed that.
      const sharp = (await import("sharp")).default;
      const resized = await sharp(rawBuffer)
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      imageBase64 = resized.toString("base64");
      imageHash = typedProject.source_image_hash ?? undefined;
    }

    const result = await generateIcon({
      prompt,
      style,
      primaryColor,
      imageBase64,
      imageHash,
    });

    // Auto-save to icon library (fire-and-forget — don't fail the request if save fails).
    // Icons are private by default; users opt-in to publishing via PATCH /api/icons/[id].
    void (async () => {
      try {
        const svc = createServiceClient();
        const { error } = await svc.from("icons").insert({
          user_id: userId,
          prompt: prompt ?? "",
          description: result.description,
          style,
          primary_color: primaryColor,
          svg_content: result.svgContent,
          path_count: result.pathCount,
          is_public: false,
        });
        if (error) console.warn("[generate-icon] Failed to save to library:", error.message);
      } catch (err: unknown) {
        console.warn("[generate-icon] Failed to save to library:", err);
      }
    })();

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        style,
        hasProjectId: Boolean(projectId),
        pathCount: result.pathCount,
      }),
    );

    const body: GenerateIconResponse = { svgContent: result.svgContent };

    return Response.json(body, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
