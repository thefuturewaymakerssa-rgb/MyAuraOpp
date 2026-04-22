import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'

export async function proxy(request: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // 0. CORS PREFLIGHT — Must be FIRST before any auth or Supabase
  //    code runs. Returning early here bypasses all other logic.
  // ─────────────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('origin') ?? '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cron-secret',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // 1. Prepare headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  requestHeaders.set('x-url', request.url)

  // 2. Initialize response with headers
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 3. Initialize Supabase client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 4. Refresh session if expired
  let user = null;
  try {
    const { data: { user: foundUser } } = await supabase.auth.getUser()
    user = foundUser;
  } catch (err) {
    console.error("Middleware Auth Error (Invalid Token?):", err);
    // Continue with user as null - the redirect logic below will handle it
  }

  // 5. Define public routes
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/role-select',
    '/onboarding',
    '/privacy',
    '/terms',
    '/support',
    '/vibe/',
    '/links/',
    '/u/',
    '/jobs',
    '/auth/',
    '/api/',
  ]
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route))

  // 6. Auth redirect
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 6b. Admin route guard — handled in app/(authenticated)/admin/layout.tsx
  // This keeps the proxy lightweight as per Next.js 16 best practices.


  // 7. Security Headers
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' blob: data: https://images.unsplash.com https://randomuser.me https://*.supabase.co; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co https://*.huggingface.co wss://*.supabase.co; " +
    "media-src 'self' blob: https://*.supabase.co; " +
    "frame-src 'none'; " +
    "base-uri 'self';"
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 8. Additional Security Headers (Sprint 2.6)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), payment=()'
  );

  // 9. CORS headers for actual API requests (Sprint 2.5)
  //    Preflight OPTIONS is handled above (step 0).
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') ?? '';
    const allowedOrigins = [
      'https://futurewaymakers.co.za',
      'http://localhost:3000',
    ];

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Vary', 'Origin');
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - auth/callback (OAuth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
