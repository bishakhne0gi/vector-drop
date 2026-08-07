import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/api/supabase";
import { grantUnits } from "@/lib/credits/service";
import { ledgerKeys } from "@/lib/credits/keys";
import { PURCHASE_GRANT_UNITS, PACK_PRICE_CENTS } from "@/lib/credits/constants";

/**
 * Dodo Payments webhook.
 *
 * This endpoint is the ONLY thing that grants purchased credits. The browser
 * redirect after checkout is cosmetic — a customer who closes the tab still
 * gets what they paid for, because the credit comes from here.
 *
 * Signature verification uses Standard Webhooks (svix), same as the Clerk
 * webhook. Header names confirmed from Dodo's docs: webhook-id,
 * webhook-timestamp, webhook-signature (NOT the svix-* names Clerk uses).
 *
 * Events: payment.succeeded, payment.failed, refund.succeeded, refund.failed.
 */

const ROUTE = "POST /api/webhooks/dodo";

interface DodoEvent {
  type: string;
  data?: Record<string, unknown>;
}

/**
 * Dodo's public docs do not publish the exact payload nesting, so read
 * defensively and log anything unrecognised. The raw event is persisted on the
 * purchase row so a mis-read can be reconciled after the fact rather than
 * silently losing a payment.
 */
function extractPaymentId(evt: DodoEvent): string | null {
  const d = evt.data ?? {};
  const candidates = [d.payment_id, d.id, (d.payment as Record<string, unknown> | undefined)?.id];
  const found = candidates.find((v) => typeof v === "string" && v.length > 0);
  return (found as string | undefined) ?? null;
}

function extractUserId(evt: DodoEvent): string | null {
  const d = evt.data ?? {};
  const metadata = (d.metadata ?? {}) as Record<string, unknown>;
  const value = metadata.clerk_user_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();

  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("your_")) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        route: ROUTE,
        userId: null,
        error: { code: "INTERNAL_ERROR", message: "DODO_WEBHOOK_SECRET not configured" },
      }),
    );
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();

  let evt: DodoEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    }) as DodoEvent;
  } catch {
    // Unverified payloads are never trusted — an attacker who could forge these
    // would be able to mint credits for free.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const paymentId = extractPaymentId(evt);
  const clerkUserId = extractUserId(evt);

  if (!paymentId || !clerkUserId) {
    // Return 200: there is nothing actionable, and a non-2xx would make Dodo
    // retry forever. Logged loudly because it means a payment may be stranded.
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        route: ROUTE,
        userId: clerkUserId,
        message: "Dodo event missing payment id or clerk_user_id metadata",
        context: { type: evt.type, paymentId, rawKeys: Object.keys(evt.data ?? {}) },
      }),
    );
    return NextResponse.json({ ignored: "missing payment id or user metadata" }, { status: 200 });
  }

  const data = evt.data ?? {};
  const svc = createServiceClient();

  if (evt.type === "payment.succeeded") {
    await svc.from("purchases").upsert(
      {
        user_id: clerkUserId,
        dodo_payment_id: paymentId,
        amount_cents: typeof data.total_amount === "number" ? data.total_amount : PACK_PRICE_CENTS,
        currency: typeof data.currency === "string" ? data.currency : "USD",
        credits_granted: PURCHASE_GRANT_UNITS,
        status: "succeeded",
        raw_event: evt as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "dodo_payment_id" },
    );

    // Idempotent: a redelivered webhook hits the unique idempotency key and
    // grants nothing further. Dodo WILL redeliver — that is how webhooks work.
    const result = await grantUnits({
      userId: clerkUserId,
      units: PURCHASE_GRANT_UNITS,
      reason: "purchase",
      idempotencyKey: ledgerKeys.purchase(paymentId),
      metadata: { paymentId },
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId: clerkUserId,
        durationMs: Date.now() - start,
        event: evt.type,
        paymentId,
        granted: result.granted,
        balanceUnits: result.balanceUnits,
      }),
    );

    return NextResponse.json({ granted: result.granted, balanceUnits: result.balanceUnits });
  }

  if (evt.type === "refund.succeeded") {
    await svc
      .from("purchases")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("dodo_payment_id", paymentId);

    // Clamped at zero inside grant_units — the user may already have spent the
    // credits being refunded, and a negative balance would break the check
    // constraint and block every future grant.
    const result = await grantUnits({
      userId: clerkUserId,
      units: -PURCHASE_GRANT_UNITS,
      reason: "refund",
      idempotencyKey: ledgerKeys.refund(paymentId),
      metadata: { paymentId },
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        route: ROUTE,
        userId: clerkUserId,
        durationMs: Date.now() - start,
        event: evt.type,
        paymentId,
        applied: result.granted,
        balanceUnits: result.balanceUnits,
      }),
    );

    return NextResponse.json({ refunded: true, balanceUnits: result.balanceUnits });
  }

  if (evt.type === "payment.failed") {
    await svc.from("purchases").upsert(
      {
        user_id: clerkUserId,
        dodo_payment_id: paymentId,
        amount_cents: typeof data.total_amount === "number" ? data.total_amount : PACK_PRICE_CENTS,
        currency: typeof data.currency === "string" ? data.currency : "USD",
        credits_granted: 0,
        status: "failed",
        raw_event: evt as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "dodo_payment_id" },
    );
    return NextResponse.json({ recorded: "failed" });
  }

  return NextResponse.json({ ignored: evt.type }, { status: 200 });
}
