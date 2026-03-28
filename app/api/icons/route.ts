import { z } from "zod";
import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { AppError, Icon, IconListResponse, SaveIconRequest } from "@/lib/types";

const ROUTE_GET = "GET /api/icons";
const ROUTE_POST = "POST /api/icons";

const MAX_LIMIT = 96;
const DEFAULT_LIMIT = 48;

const saveIconSchema = z.object({
  prompt: z.string().max(500),
  description: z.string().max(1000),
  style: z.enum(["flat", "outline", "duotone"]),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "primaryColor must be a hex color like #3B82F6"),
  svgContent: z.string().min(1),
  pathCount: z.number().int().nonnegative(),
  isPublic: z.boolean().optional(),
}) satisfies z.ZodType<SaveIconRequest>;

export async function GET(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const style = url.searchParams.get("style") ?? undefined;
    const mine = url.searchParams.get("mine") === "true";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;

    // Validate style if provided
    if (style !== undefined && !["lucide", "neobrutalism", "glassmorphism"].includes(style)) {
      throw AppError.validation("style must be one of: flat, outline, duotone");
    }

    if (mine) {
      const auth = await requireAuth();
      userId = auth.userId;
    }

    const svc = createServiceClient();
    let query = svc
      .from("icons")
      .select("*", { count: "exact" });

    if (mine) {
      query = query.eq("user_id", userId as string);
    } else {
      query = query.eq("is_public", true);
    }

    if (search) {
      const escapedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/[(),]/g, '');
      query = query.or(
        `prompt.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`,
      );
    }

    if (style) {
      query = query.eq("style", style);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw AppError.internal(`Failed to fetch icons: ${error.message}`);
    }

    const icons = (data ?? []) as Icon[];
    const total = count ?? 0;

    const body: IconListResponse = {
      icons,
      total,
      hasMore: offset + limit < total,
    };

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE_GET,
        userId,
        durationMs: Date.now() - start,
        count: icons.length,
        total,
      }),
    );

    return Response.json(body);
  } catch (err) {
    return handleError(err, ROUTE_GET, userId, Date.now() - start);
  }
}

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;

    await enforceRateLimit(writeRatelimit, userId);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = saveIconSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid request body", {
        issues: parsed.error.issues,
      });
    }

    const { prompt, description, style, primaryColor, svgContent, pathCount, isPublic } =
      parsed.data;

    const svc = createServiceClient();
    const { data: icon, error: insertError } = await svc
      .from("icons")
      .insert({
        user_id: userId,
        prompt,
        description,
        style,
        primary_color: primaryColor,
        svg_content: svgContent,
        path_count: pathCount,
        is_public: isPublic ?? true,
      })
      .select()
      .single();

    if (insertError || !icon) {
      throw AppError.internal(
        `Failed to save icon: ${insertError?.message ?? "no data returned"}`,
      );
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE_POST,
        userId,
        durationMs: Date.now() - start,
        iconId: icon.id,
        style,
      }),
    );

    return Response.json({ icon }, { status: 201 });
  } catch (err) {
    return handleError(err, ROUTE_POST, userId, Date.now() - start);
  }
}
