import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AppError } from "@/lib/types";

/**
 * Server-side Supabase client for route handlers.
 * Uses the anon key + session cookies so RLS is enforced automatically.
 */
export async function createRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Route handlers cannot set cookies after streaming starts — safe to ignore
          }
        },
      },
    },
  );
}

/**
 * Service-role client for privileged server-side operations (migrations, pipeline).
 * NEVER expose to client code.
 */
export function createServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Asserts a user session exists, throws AppError(401) otherwise.
 */
export async function requireAuth() {
  const supabase = await createRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw AppError.unauthorized();
  }

  return { supabase, user };
}
