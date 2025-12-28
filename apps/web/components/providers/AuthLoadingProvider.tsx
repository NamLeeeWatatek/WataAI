'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/LoadingLogo'

interface AuthLoadingContextType {
    isLoading: boolean
    isAuthenticated: boolean
}

const AuthLoadingContext = createContext<AuthLoadingContextType | undefined>(undefined)

export function useAuthLoading() {
    const context = useContext(AuthLoadingContext)
    if (context === undefined) {
        throw new Error('useAuthLoading must be used within AuthLoadingProvider')
    }
    return context
}

interface AuthLoadingProviderProps {
    children: ReactNode
    showLoadingScreen?: boolean
}

/**
 * Provider that wraps auth state and optionally shows a loading screen
 * Use showLoadingScreen={false} for pages that want to handle their own loading UI
 */
export function AuthLoadingProvider({
    children,
    showLoadingScreen = true
}: AuthLoadingProviderProps) {
    const { isLoading, isAuthenticated } = useAuth()

    const contextValue = {
        isLoading,
        isAuthenticated
    }

    if (showLoadingScreen && isLoading) {
        return (
            <AuthLoadingContext.Provider value={contextValue}>
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <LoadingLogo size="lg" text="Loading" />
                </div>
            </AuthLoadingContext.Provider>
        )
    }

    return (
        <AuthLoadingContext.Provider value={contextValue}>
            {children}
        </AuthLoadingContext.Provider>
    )
}

