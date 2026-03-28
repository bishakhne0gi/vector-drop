import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/api/supabase'

export async function POST(): Promise<NextResponse> {
  const supabase = await createRouteClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    // Sign-out errors are non-fatal from a security standpoint — the session
    // cookie will be cleared below regardless. Log and continue.
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'POST /api/auth/signout',
        error: { message: error.message, code: error.status },
      }),
    )
  }

  return NextResponse.json({ ok: true })
}
