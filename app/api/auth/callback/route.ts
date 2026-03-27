import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/api/supabase'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!code) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'GET /api/auth/callback',
        error: { message: 'Missing code param in email confirmation callback' },
      }),
    )
    // Redirect to login with an error hint rather than exposing internals
    return NextResponse.redirect(new URL('/login?error=missing_code', siteUrl))
  }

  const supabase = await createRouteClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        route: 'GET /api/auth/callback',
        error: { message: error.message, code: error.status },
      }),
    )
    return NextResponse.redirect(new URL('/login?error=callback_failed', siteUrl))
  }

  return NextResponse.redirect(new URL('/dashboard', siteUrl))
}
