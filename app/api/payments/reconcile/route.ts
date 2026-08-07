import { requireAuth, createServiceClient } from "@/lib/api/supabase";
import { handleError } from "@/lib/api/handleError";
import { writeRatelimit, enforceRateLimit } from "@/lib/cache/redis";
import { listRecentPayments } from "@/lib/payments/dodo";
import { grantUnits, getBalance } from "@/lib/credits/service";
import { ledgerKeys } from "@/lib/credits/keys";
import { PURCHASE_GRANT_UNITS } from "@/lib/credits/constants";

const ROUTE = "POST /api/payments/reconcile";

/**
 * Safety net for purchases whose webhook never arrived.
 *
 * The webhook is the primary path, but it is not a guarantee: deliveries get
 * delayed, dropped, or fire while the server is unreachable. A customer who
 * paid and received nothing is the worst failure this system can produce, so
 * returning from checkout also asks Dodo directly what was paid.
 *
 * Safe to run alongside the webhook and safe to call repeatedly: grants use the
 * same structural idempotency key (`dodo:{paymentId}`), so whichever path gets
 * there first wins and the other is a no-op.
 */
export async function POST(): Promise<Response> {
  const start = Date.now();
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;

    await enforceRateLimit(writeRatelimit, userId);

    const payments = await listRecentPayments(20);
    const mine = payments.filter(
      (p) => p.clerkUserId === userId && p.status === "succeeded",
    );

    const svc = createServiceClient();
    let grantedCount = 0;

    for (const payment of mine) {
      const result = await grantUnits({
        userId,
        units: PURCHASE_GRANT_UNITS,
        reason: "purchase",
        idempotencyKey: ledgerKeys.purchase(payment.paymentId),
        metadata: { paymentId: payment.paymentId, source: "reconcile" },
      });

      if (!result.granted) continue;

      grantedCount++;

      // Only record the purchase when this call actually granted it — otherwise
      // the webhook already wrote the row.
      await svc.from("purchases").upsert(
        {
          user_id: userId,
          dodo_payment_id: payment.paymentId,
          amount_cents: payment.totalAmount,
          currency: payment.currency,
          credits_granted: PURCHASE_GRANT_UNITS,
          status: "succeeded",
          raw_event: { source: "reconcile", payment },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "dodo_payment_id" },
      );
    }

    const balanceUnits = await getBalance(userId);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId,
        durationMs: Date.now() - start,
        candidates: mine.length,
        granted: grantedCount,
        balanceUnits,
      }),
    );

    return Response.json({ granted: grantedCount, balanceUnits });
  } catch (err) {
    return handleError(err, ROUTE, userId, Date.now() - start);
  }
}
