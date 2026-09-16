"use client";

import { Toast } from "@/components/shared/Toast";

interface CreditToastProps {
  /** Credits added, as a display string (e.g. "20"). */
  credits: string;
  onDismiss: () => void;
}

/**
 * Confirms credits landing on the account.
 *
 * Payment happens on Dodo's site and the grant arrives out of band, so without
 * this the user comes back to a page that looks unchanged and has to hunt for a
 * number to work out whether their money did anything.
 *
 * The panel itself is Toast — shared with the failure notices, so the app's
 * confirmations and its errors cannot drift into looking like different
 * products.
 */
export function CreditToast({ credits, onDismiss }: CreditToastProps) {
  return (
    <Toast tone="success" onDismiss={onDismiss}>
      <strong style={{ fontWeight: 600 }}>{credits} credits</strong> added to your account
    </Toast>
  );
}
