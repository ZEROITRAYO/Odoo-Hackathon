// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password']
const PUBLIC_PREFIXES = ['/reset-password', '/api/auth']

// Role-based route access map
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/procurement': ['PROCUREMENT_OFFICER', 'ADMIN'],
  '/vendor/': ['VENDOR', 'ADMIN'],   // vendor portal (e.g. /vendor/rfqs) — trailing slash avoids matching /vendors
  '/manager': ['MANAGER', 'ADMIN'],
}

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    // If already logged in, redirect to dashboard
    if (session?.user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Allow public prefixes (reset-password links, auth API)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Not authenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role

  // Check role-based route restrictions
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to dashboard with an error state
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}