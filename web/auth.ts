import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { authConfig } from "@/auth.config"
import { logger } from "@/lib/logger"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const apiUrl =
            process.env.INTERNAL_API_URL ??
            process.env.NEXT_PUBLIC_API_URL ??
            'http://localhost:8000/api/v1';

          // Call backend email login
          const response = await fetch(`${apiUrl}/auth/email/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }).catch(err => {
            // Network error (backend down)
            logger.error('[NextAuth] Backend connection failed:', err);
            throw new Error("ConnectionRefused");
          });

          if (!response.ok) {
            const error = await response.text()
            logger.error('[NextAuth] Login failed:', response.status, error)

            // 401/403 = Invalid Credentials. Return null to trigger standard "Sign In failed" flow.
            if (response.status === 401 || response.status === 403) {
              return null;
            }

            // 5xx or others = server error. Throw to trigger "Configuration" or "Error" flow.
            throw new Error(`ServerError: ${response.status}`);
          }

          const data = await response.json()

          if (!data.token || !data.user) {
            logger.error('[NextAuth] Invalid response structure');
            return null;
          }

          const userName = data.user.name || data.user.firstName || data.user.email

          return {
            id: String(data.user.id),
            email: data.user.email,
            name: userName,
            role: data.user.role,
            accessToken: data.token,
            refreshToken: data.refreshToken,
            tokenExpires: data.tokenExpires, // Capture backend expiry
            avatarUrl: data.user.avatarUrl || null,
            image: data.user.avatarUrl || null,
            workspace: data.workspace ? {
              id: data.workspace.id,
              name: data.workspace.name,
              slug: data.workspace.slug,
            } : null,
            // Pruned workspaces array to keep JWT cookie small (< 4KB). 
            // WorkspaceInitializer.tsx will fetch the full list client-side.
            workspaces: [],
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          logger.error('[NextAuth] Authorize error:', errMsg)

          if (errMsg === "ConnectionRefused" || errMsg.startsWith("ServerError")) {
            throw error; // Re-throw to be handled by NextAuth error page
          }
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
    }),
  ],
});
