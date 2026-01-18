/**
 * Centralized Route Configuration
 * Used by both strict server-side middleware and client-side navigation logic.
 * This ensures "Single Source of Truth" for your application's routing security.
 */

// Routes that are public authentication pages
export const AUTH_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email'
];

// Routes requiring Admin role
export const ADMIN_ROUTE_PREFIX = '/system';

// Root path to redirect after login
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

// Routes requiring simple authentication (Logged in)
// Note: We use prefixes, so '/settings' covers '/settings/profile', etc.
export const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard',
    '/templates',
    '/inbox',
    '/settings',
    '/channels',
    '/bots',
    '/team',
    '/archives',
    '/analytics',
    '/ai-assistant',
    '/integrations',
    '/jobs',
    '/my-products',
    '/chat',
    '/conversations',
    '/knowledge-base',
    '/creation-tools',
    ADMIN_ROUTE_PREFIX, // Admin routes are implicitly protected
];

/**
 * Helper to check if a path matches any protected prefix
 */
export function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Helper to check if a path is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Helper to check if a path is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
    return pathname.startsWith(ADMIN_ROUTE_PREFIX);
}
