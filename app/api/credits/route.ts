import { requireAuth } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { getBalance } from "@/lib/credits/service";
import { formatCredits } from "@/lib/credits/constants";
import type { CreditBalanceResponse } from "@/lib/types";

const ROUTE = "GET /api/credits";

/**
 * Current credit balance for the signed-in user.
 *
 * Never cached: the badge must move the moment something is spent, or users
 * cannot tell what an action cost them.
 */
export async function GET(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;

    const balanceUnits = await getBalance(userId);

    const body: CreditBalanceResponse = {
      balanceUnits,
      credits: formatCredits(balanceUnits),
    };

    return Response.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
