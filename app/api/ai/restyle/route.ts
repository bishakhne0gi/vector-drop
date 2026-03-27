import { z } from "zod";
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { aiRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { restyleSVG } from "@/lib/ai/restyle";
import { ThemeSchema } from "@/lib/ai/schemas";
import { AppError } from "@/lib/types";

const ROUTE = "POST /api/ai/restyle";

const restyleSchema = z.object({
  svgContent: z.string().min(1),
  theme: ThemeSchema,
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

    const parsed = restyleSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", { issues: parsed.error.issues });
    }
    const { svgContent, theme, provider } = parsed.data;

    const modifiedSvg = await restyleSVG(svgContent, theme, provider);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        themeId: theme.id,
        provider,
      }),
    );

    return Response.json(
      { svg: modifiedSvg, appliedTheme: theme.name },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
