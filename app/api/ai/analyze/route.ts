import { z } from "zod";
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { aiRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { analyzeImage } from "@/lib/ai/analyze";
import { AppError } from "@/lib/types";

const ROUTE = "POST /api/ai/analyze";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME),
  provider: z.enum(['claude', 'gemini']).default('claude'),
});

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { user } = await requireAuth();
    userId = user.id;

    const { remaining } = await enforceRateLimit(aiRatelimit, user.id);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = analyzeSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", { issues: parsed.error.issues });
    }
    const { imageBase64, mimeType, provider } = parsed.data;

    const suggestion = await analyzeImage(imageBase64, mimeType, provider);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        provider,
      }),
    );

    return Response.json(
      { suggestion },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
