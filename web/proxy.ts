import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import {
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "@/lib/config/routes"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix))

  // 1. Redirect logged-in users away from Auth pages (Login/Register)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // 2. Redirect unauthenticated users from Protected routes
  if (isProtectedRoute && !isLoggedIn) {
    let callbackUrl = pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)

    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    )
  }

  return NextResponse.next()
})

export const config = {
  // Standard Next.js matcher to skip static files and internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
