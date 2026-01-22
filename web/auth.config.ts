import type { NextAuthConfig, Session, User, Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { UserRole, WorkspaceEntity } from "./types/next-auth"
import { logger } from "@/lib/logger"

/**
 * Extended User for Authentication internal usage
 */
interface ExtendedAuthUser extends User {
    id: string
    accessToken: string
    refreshToken: string
    avatarUrl?: string | null
    workspace?: WorkspaceEntity | null
    role?: UserRole | null
    workspaces?: WorkspaceEntity[]
    tokenExpires?: number
}

// Global lock to prevent parallel refresh attempts for the same token in a single process
// This prevents the "race condition" where multiple parallel requests (e.g. middleware + client fetch)
// try to refresh at the same time, invalidating each other's tokens on the backend.
const refreshLocks = new Map<string, Promise<JWT>>();

async function refreshAccessToken(token: JWT): Promise<JWT> {
    const key = token.refreshToken as string;

    // 1. If a refresh is already in progress for this token, reuse that promise
    if (refreshLocks.has(key)) {
        logger.debug("[Auth] Refresh already in progress for this token, joining...");
        return refreshLocks.get(key)!;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

    const refreshPromise = (async () => {
        try {
            if (!token.refreshToken) {
                throw new Error("No refresh token available");
            }

            const response = await fetch(`${apiUrl}/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: token.refreshToken }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                logger.error("[Auth] Token refresh failed with status:", response.status, errorData);

                // CRITICAL FIX: Only invalidate session if it's a client error (4xx) (e.g. invalid refresh token)
                // If it's a server error (5xx) or network error, keep the old token to allow retries.
                if (response.status >= 400 && response.status < 500) {
                    throw new Error("RefreshAccessTokenError");
                }

                // For 5xx errors, return old token (retry later)
                return token;
            }

            const data = await response.json()

            return {
                ...token,
                accessToken: data.token,
                refreshToken: data.refreshToken ?? token.refreshToken,
                // Fallback to 1 hour if backend doesn't provide expiry
                accessTokenExpires: data.tokenExpires || (Date.now() + 60 * 60 * 1000),
                error: undefined
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logger.error("[Auth] Token refresh exception:", errorMessage);

            if (errorMessage === "RefreshAccessTokenError") {
                return {
                    ...token,
                    error: "RefreshAccessTokenError",
                    // Set expiry to far future to stop refresh attempts until logout
                    accessTokenExpires: Date.now() + 1000 * 60 * 60 * 24 * 365
                }
            }

            // For network errors or other exceptions, return old token (retry later)
            // Do NOT kill the session.
            return token;
        }
    })();

    // 2. Set the lock
    refreshLocks.set(key, refreshPromise);

    try {
        const result = await refreshPromise;
        return result;
    } finally {
        // 3. Always clean up the lock
        // We delay deletion slightly to handle very tightly packed requests
        setTimeout(() => refreshLocks.delete(key), 5000);
    }
}

export const authConfig = {
    trustHost: true,
    basePath: "/api/auth",
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Initial Sign In
            if (account) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

                // Handle Credentials
                if (account.provider === 'credentials' && user) {
                    const authUser = user as ExtendedAuthUser
                    return {
                        id: authUser.id,
                        name: authUser.name,
                        email: authUser.email,
                        accessToken: authUser.accessToken,
                        refreshToken: authUser.refreshToken,
                        accessTokenExpires: authUser.tokenExpires || (Date.now() + 60 * 60 * 1000),
                        role: authUser.role,
                        avatarUrl: authUser.avatarUrl,
                        workspace: authUser.workspace,
                        workspaces: authUser.workspaces || [],
                    }
                }

                // Handle Social Login (Google, Facebook)
                if (account.provider === 'google' || account.provider === 'facebook') {
                    try {
                        const endpoint = account.provider === 'google' ? '/auth/google/login' : '/auth/facebook/login'
                        const body = account.provider === 'google'
                            ? { idToken: account.id_token }
                            : { accessToken: account.access_token }

                        const response = await fetch(`${apiUrl}${endpoint}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })

                        if (!response.ok) {
                            throw new Error(`Backend social login failed: ${response.statusText}`)
                        }

                        const data = await response.json()
                        const user = data.user
                        const userName = user.name || user.firstName || user.email

                        return {
                            id: String(user.id),
                            name: userName,
                            email: user.email,
                            accessToken: data.token,
                            refreshToken: data.refreshToken,
                            accessTokenExpires: data.tokenExpires || (Date.now() + 60 * 60 * 1000),
                            role: user.role,
                            avatarUrl: user.avatarUrl,
                            workspace: data.workspace,
                            workspaces: data.workspaces || [],
                        }
                    } catch (error) {
                        logger.error("[Auth] Social login exchange failed", error)
                        return { ...token, error: "SocialLoginError" }
                    }
                }
            }

            // Handle Session Update
            if (trigger === "update" && session?.user) {
                return {
                    ...token,
                    name: session.user.name,
                    avatarUrl: session.user.avatarUrl,
                    image: session.user.avatarUrl, // ensure image property is also updated
                }
            }

            // 1. If there's already a refresh error, stop trying to refresh
            if (token.error === "RefreshAccessTokenError") {
                return token
            }

            // 2. Refresh token 2 minutes before it expires
            if (typeof token.accessTokenExpires === 'number' && Date.now() < token.accessTokenExpires - 2 * 60 * 1000) {
                return token
            }

            // 3. Access token has expired or is about to expire, try to update it
            logger.debug("[Auth] Token expiring soon, triggering refresh...");
            return refreshAccessToken(token)
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token.error) {
                // Return session with error flag, client should handle logout
                return { ...session, error: token.error }
            }

            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
                session.user.avatarUrl = token.avatarUrl as string | null
                session.user.image = token.avatarUrl as string | null
            }

            // Expose ONLY necessary data to client. refreshToken is EXCLUDED.
            return {
                ...session,
                accessToken: token.accessToken as string,
                workspace: token.workspace as WorkspaceEntity | null,
                workspaces: token.workspaces as WorkspaceEntity[],
                error: token.error,
            }
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
