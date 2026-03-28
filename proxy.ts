import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers applied to every response.
// SVG content is served from /api routes with explicit Content-Type; the CSP
// here covers the HTML shell. img-src includes blob:/data: for the editor canvas.
function applySecurityHeaders(response: NextResponse, nonce: string): void {
  const isDev = process.env.NODE_ENV === 'development'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  // Extract just the hostname for CSP (e.g. "abc.supabase.co")
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : ''

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `connect-src 'self'${supabaseHost ? ` https://${supabaseHost}` : ''}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Initialise the response so Supabase cookie mutations have somewhere to land.
  // Must be re-assigned inside setAll to carry the refreshed session cookies.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies back onto the request so downstream
          // Server Components see the refreshed session.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Re-create the response with the mutated request so the
          // Set-Cookie header reaches the browser.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() contacts the Supabase Auth server and cryptographically
  // verifies the JWT. Do NOT use getSession() here — it reads unverified cookie
  // data and must never be used for authorization decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated users must not reach protected routes.
  // Note: /icons is public; only /icons/my requires auth.
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/editor') ||
    pathname.startsWith('/icons/my')

  if (!user && isProtectedPath) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users hitting /login or / are bounced into the app.
  if (user && (pathname === '/login' || pathname === '/')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Stamp the nonce so Server Components can read it via headers().
  supabaseResponse.headers.set('x-nonce', nonce)

  // Always return the Supabase response — not a plain NextResponse.next() —
  // so the refreshed session cookies are forwarded to the browser.
  applySecurityHeaders(supabaseResponse, nonce)
  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets.
    // Files with extensions (images, fonts, etc.) are excluded so the proxy
    // does not add latency to asset requests.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
