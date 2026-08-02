import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers applied to every response.
function applySecurityHeaders(response: NextResponse): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : ''

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.vectordrop.co.in https://challenges.cloudflare.com https://us-assets.i.posthog.com`,
    `style-src 'self' 'unsafe-inline' https://*.clerk.com https://clerk.vectordrop.co.in`,
    `img-src 'self' blob: data: https:`,
    `connect-src 'self' https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.vectordrop.co.in https://challenges.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com${supabaseHost ? ` https://${supabaseHost}` : ''}`,
    "font-src 'self' data: https://*.clerk.com https://clerk.vectordrop.co.in",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.vectordrop.co.in",
    "frame-ancestors 'none'",
    "frame-src https://*.clerk.com https://*.clerk.accounts.dev https://clerk.vectordrop.co.in https://challenges.cloudflare.com",
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

// The admin portal. Never indexed, never reachable by a non-allowlisted account.
// Deliberately NOT in isProtectedPath: a redirect to /login would confirm the
// route exists. Rejections rewrite to an unmatched path so the response is
// byte-for-byte the same 404 any random URL produces.
const isAdminPath = createRouteMatcher(['/hades(.*)'])

const NOT_FOUND_REWRITE = '/_hades_absent'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'bneogi102002@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth()

  // Safety net for the dev→prod Clerk cutover. If a returning user has not
  // yet been remapped (because the webhook never fired or failed), do it now.
  // Fire-and-forget — failures are logged but do not block the request.
  if (userId && typeof sessionClaims?.email === 'string') {
    const email = sessionClaims.email.toLowerCase()
    void import('@/lib/auth/remap-legacy-user').then(({ remapLegacyUser }) =>
      remapLegacyUser({ email, prodClerkId: userId }).catch((err) =>
        console.error('[legacy-remap]', err),
      ),
    )
  }

  // Defence in depth for /hades. The authoritative check is requireAdmin() in
  // every admin page — it re-reads the *verified* primary email from the Clerk
  // API. This layer rejects earlier, before any page code runs, when the
  // request is plainly not the admin's. A session whose token carries no email
  // claim falls through to requireAdmin rather than risk locking the owner out.
  if (isAdminPath(req)) {
    const claimEmail =
      typeof sessionClaims?.email === 'string'
        ? sessionClaims.email.toLowerCase()
        : null
    if (!userId || (claimEmail && !ADMIN_EMAILS.includes(claimEmail))) {
      return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, req.url))
    }
  }

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

  // Belt and braces on top of the route's `robots` metadata: this covers every
  // response under /hades, HTML or not, and every crawler that honours it.
  if (isAdminPath(req)) {
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex',
    )
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  }

  return response
})

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
