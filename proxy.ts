import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers applied to every response.
function applySecurityHeaders(response: NextResponse): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : ''

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline' https://*.clerk.com`,
    `img-src 'self' blob: data: https:`,
    `connect-src 'self' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com${supabaseHost ? ` https://${supabaseHost}` : ''}`,
    "font-src 'self' data: https://*.clerk.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev",
    "frame-ancestors 'none'",
    "frame-src https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    "worker-src blob:",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
}

// Editor and my-icons require full auth; dashboard is open to guests
const isProtectedPath = createRouteMatcher([
  '/editor(.*)',
  '/icons/my(.*)',
])

const isAuthPath = createRouteMatcher(['/login(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth()

  // Unauthenticated users must not reach protected routes.
  if (!userId && isProtectedPath(req)) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users hitting /login or / are bounced into the app.
  if (userId && isAuthPath(req)) {
    const dashboardUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
})

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
