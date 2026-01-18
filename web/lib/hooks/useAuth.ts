'use client'

import { useMemo } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import type { User as AuthUser } from 'next-auth'
import { UserRole, WorkspaceEntity } from '@/types/next-auth'

export interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  user: (AuthUser & { id: string, role?: UserRole | null, avatarUrl?: string | null }) | null
  accessToken?: string
  workspace?: WorkspaceEntity | null
  workspaces?: WorkspaceEntity[] | undefined
  error?: string
  signOut: (options?: { redirect?: boolean; callbackUrl?: string }) => Promise<void>
}

/**
 * Clean useAuth hook that relies entirely on NextAuth v5 session.
 * Zero LocalStorage usage.
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.accessToken

  const value = useMemo<UseAuthReturn>(() => {
    return {
      isAuthenticated,
      isLoading,
      user: session?.user ?? null,
      accessToken: session?.accessToken,
      workspace: session?.workspace ?? null,
      workspaces: session?.workspaces,
      error: session?.error as string,
      signOut: async (options?: { redirect?: boolean; callbackUrl?: string }) => {
        const callbackUrl = options?.callbackUrl || '/login'

        if (options?.redirect === false) {
          await nextAuthSignOut({ callbackUrl, redirect: false })
        } else {
          await nextAuthSignOut({ callbackUrl, redirect: true })
        }
      },
    }
  }, [isAuthenticated, isLoading, session])

  return value
}
