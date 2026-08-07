/**
 * Idempotency keys for the credit ledger.
 *
 * These are structural, not random: the same real-world event always produces
 * the same key, and `credit_ledger.idempotency_key` is UNIQUE. That is what
 * makes a Dodo webhook delivered five times grant credits exactly once, and a
 * re-converted project cost nothing the second time.
 *
 * Each event type has its own prefix so a purchase and a refund for the same
 * payment id cannot collide.
 */
export const ledgerKeys = {
  /** One free grant per account, ever. */
  signup: (userId: string) => `signup:${userId}`,

  /** One grant per Dodo payment, however many times the webhook is delivered. */
  purchase: (paymentId: string) => `dodo:${paymentId}`,

  /** One charge per project — re-converting, including cache hits, is free. */
  conversion: (projectId: string) => `convert:${projectId}`,

  /** One charge per version per user — re-downloads and format changes are free. */
  versionExport: (userId: string, versionId: string) => `export:${userId}:${versionId}`,

  /** One deduction per refunded payment. */
  refund: (paymentId: string) => `refund:${paymentId}`,
} as const;
