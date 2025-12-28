import type { NextAuthConfig, Session, User, Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { UserRole, WorkspaceEntity } from "./types/next-auth"

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

async function refreshAccessToken(token: JWT): Promise<JWT> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

    try {
        const response = await fetch(`${apiUrl}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: token.refreshToken }),
        })

        if (!response.ok) throw new Error("RefreshAccessTokenError")

        const data = await response.json()

        return {
            ...token,
            accessToken: data.token,
            refreshToken: data.refreshToken ?? token.refreshToken,
            accessTokenExpires: data.tokenExpires || (Date.now() + 60 * 60 * 1000),
            error: undefined
        }
    } catch (error) {
        console.error("[Auth] Token refresh failed", error)
        return { ...token, error: "RefreshAccessTokenError" }
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
        async jwt({ token, user, account }) {
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
                        console.error("[Auth] Social login exchange failed", error)
                        return { ...token, error: "SocialLoginError" }
                    }
                }
            }

            // Return previous token if the access token has not expired yet
            if (typeof token.accessTokenExpires === 'number' && Date.now() < token.accessTokenExpires - 60 * 1000) {
                return token
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token)
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token.error) {
                return null as any // Forces logout on client if refresh failed
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
