import { currentUser } from "@clerk/nextjs/server";
import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { createCheckoutSession } from "@/lib/payments/dodo";

const ROUTE = "POST /api/payments/checkout";

export async function POST(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;

    // Session creation hits a third-party API — rate limit it per user.
    await enforceRateLimit(writeRatelimit, userId);

    // Prefill the email so the customer does not retype it. Optional: if Clerk
    // is slow or the address is missing, Dodo collects it at checkout instead.
    let email: string | undefined;
    try {
      const user = await currentUser();
      email = user?.primaryEmailAddress?.emailAddress;
    } catch {
      email = undefined;
    }

    const session = await createCheckoutSession({ userId, email });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        sessionId: session.sessionId,
      }),
    );

    return Response.json({ url: session.url });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
