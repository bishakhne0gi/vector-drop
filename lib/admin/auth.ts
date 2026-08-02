import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { isAdminEmail } from "./config";

export interface AdminIdentity {
  userId: string;
  email: string;
}

/**
 * Gate for every /hades screen.
 *
 * Rules:
 *  - must have a Clerk session
 *  - the session's *primary* email must be **verified** by Clerk
 *  - that email must be on the ADMIN_EMAILS allowlist
 *
 * Any failure renders a plain 404 — a non-admin can never tell /hades exists.
 * Call this in EVERY page, not just the layout: a layout alone can be skipped
 * by client-side navigation reusing a cached segment.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const { userId } = await auth();
  if (!userId) notFound();

  let email: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    if (primary && primary.verification?.status === "verified") {
      email = primary.emailAddress;
    }
  } catch (err) {
    console.error("[hades] failed to resolve Clerk user", err);
    notFound();
  }

  if (!isAdminEmail(email)) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "admin_access_denied",
        userId,
        email,
      }),
    );
    notFound();
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "admin_access",
      userId,
      email,
    }),
  );

  return { userId, email: email as string };
}
