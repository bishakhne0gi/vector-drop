/**
 * Dodo Payments client.
 *
 * Verified against https://docs.dodopayments.com on 2026-08-07:
 *   - Base URLs: test  https://test.dodopayments.com
 *                live  https://live.dodopayments.com
 *   - Checkout Sessions: POST /checkouts
 *       body:     { product_cart: [{ product_id, quantity }], customer?,
 *                   billing_address?, return_url?, metadata? }
 *       response: { session_id, checkout_url, client_secret?, payment_id?, ... }
 *   - Auth: Authorization: Bearer <api key>
 *   - NOTE: POST /payments is deprecated; Checkout Sessions is the supported path.
 *   - Webhook events: payment.succeeded, payment.failed,
 *                     refund.succeeded, refund.failed
 *   - Webhook headers (Standard Webhooks): webhook-id, webhook-timestamp,
 *                     webhook-signature
 *
 * Do not rewrite these from memory — re-read the docs if the API changes.
 */
import { AppError } from "@/lib/types";

const TEST_BASE = "https://test.dodopayments.com";
const LIVE_BASE = "https://live.dodopayments.com";

function baseUrl(): string {
  return process.env.DODO_PAYMENTS_ENV === "live_mode" ? LIVE_BASE : TEST_BASE;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith("your_")) {
    throw AppError.internal(`${name} is not configured`);
  }
  return value;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Creates a hosted checkout session for the 20-credit pack.
 *
 * `metadata.clerk_user_id` is the only link between the payment and the account
 * to credit — the webhook reads it to know whose balance to increase. Without
 * it a successful payment cannot be attributed to anyone.
 */
export async function createCheckoutSession(args: {
  userId: string;
  email?: string;
}): Promise<CheckoutSession> {
  const apiKey = requireEnv("DODO_PAYMENTS_API_KEY");
  const productId = requireEnv("DODO_CREDITS_PRODUCT_ID");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const body: Record<string, unknown> = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: `${appUrl}/dashboard?purchase=success`,
    metadata: { clerk_user_id: args.userId },
  };

  if (args.email) {
    body.customer = { email: args.email };
  }

  const res = await fetch(`${baseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw AppError.internal(`Dodo checkout failed (${res.status}): ${text.slice(0, 500)}`);
  }

  let parsed: { session_id?: string; checkout_url?: string | null };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw AppError.internal(`Dodo returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!parsed.checkout_url) {
    throw AppError.internal(
      `Dodo checkout session has no checkout_url: ${text.slice(0, 300)}`,
    );
  }

  return { sessionId: parsed.session_id ?? "", url: parsed.checkout_url };
}
