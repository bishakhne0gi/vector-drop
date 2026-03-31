import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { AppError } from "@/lib/types";

const ROUTE = "POST /api/feedback";

const feedbackSchema = z.object({
  page: z.enum(["dashboard", "editor", "landing"]),
  rating: z.number().int().min(1).max(5),
  message: z.string().max(2000).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const { userId: clerkId } = await auth();
    userId = clerkId ?? null;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw AppError.validation("Request body must be valid JSON");
    }

    const parsed = feedbackSchema.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation("Invalid feedback data", {
        issues: parsed.error.issues,
      });
    }

    const { page, rating, message } = parsed.data;

    const svc = createServiceClient();
    const { error } = await svc.from("feedback").insert({
      user_id: userId,
      page,
      rating,
      message: message ?? null,
    });

    if (error) {
      throw AppError.internal(`Failed to save feedback: ${error.message}`);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        page,
        rating,
      }),
    );

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
