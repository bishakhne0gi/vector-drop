import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@/lib/types";

/**
 * Service-role client for all server-side database and storage operations.
 * Authorization is enforced explicitly in each route (userId filters + ownership checks).
 * NEVER expose to client code.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Asserts a Clerk session exists, throws AppError(401) otherwise.
 * Returns the authenticated Clerk userId.
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const { userId } = await auth()
  if (!userId) throw AppError.unauthorized()
  return { userId }
}
