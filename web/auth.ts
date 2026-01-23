import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import axios from "axios"
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

          let apiUrl =
            process.env.INTERNAL_API_URL ??
            process.env.NEXT_PUBLIC_API_URL ??
            'http://localhost:8000/api/v1';

          if (apiUrl && !apiUrl.endsWith('/v1')) {
            apiUrl = `${apiUrl}/v1`;
          }

          // Call backend email login using Axios
          const { data } = await axios.post(`${apiUrl}/auth/email/login`, {
            email: credentials.email,
            password: credentials.password,
          }, {
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => {
            if (err.response) {
              logger.error('[NextAuth] Login failed:', err.response.status, err.response.data);
              if (err.response.status === 401 || err.response.status === 403) {
                return { data: null };
              }
              throw new Error(`ServerError: ${err.response.status}`);
            }
            logger.error('[NextAuth] Backend connection failed:', err.message);
            throw new Error("ConnectionRefused");
          });

          if (!data || !data.token || !data.user) {
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
