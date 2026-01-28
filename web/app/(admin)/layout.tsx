'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'
import toast from '@/lib/toast'

import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreationJobsProvider } from '@/components/providers/CreationJobsProvider'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { PERMISSIONS } from '@/lib/config/permissions'

import { LoadingLogo } from '@/components/shared/LoadingLogo'
import { ProgressOverlay } from '@/components/shared/ProgressOverlay'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Redux-managed layout state
    const [expandedSections, setExpandedSections] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [queryClient] = useState(() => new QueryClient())
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Auth hooks
    const { isAuthenticated, isLoading, signOut, accessToken, error } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useTranslation()

    // Handle session errors and redirects
    useEffect(() => {
        if (isLoading) return

        if (error === 'RefreshAccessTokenError') {
            toast.error(t('error.unauthorized'))
            signOut()
            return
        }

        if (!isAuthenticated || !accessToken) {
            const currentPath = window.location.pathname + window.location.search
            router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}` as any)
        }
    }, [isLoading, isAuthenticated, accessToken, error, router, signOut])

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={t('common.loading')} />
            </div>
        )
    }

    // Handle authentication errors - redirect to login if not authenticated
    // Middleware handles most of this, but if client-side check fails, just redirect silently
    if (!isAuthenticated || !accessToken) {
        return null
    }

    // Layout action handlers
    const toggleSection = (sectionName: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionName)
                ? prev.filter(s => s !== sectionName)
                : [...prev, sectionName]
        )
    }

    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications)
    }

    const handleSignOut = async () => {
        setIsLoggingOut(true)
        toast.promise(
            signOut({ redirect: true, callbackUrl: '/login' }),
            {
                loading: t('dashboard.signingOut'),
                success: t('success.signedOut'),
                error: t('error.signedOut')
            }
        )
    }

    // Responsive page container logic
    // Write mode only: full width, no page-container
    const isEditMode = pathname.includes('mode=edit')

    // For admin, we mostly use page-container
    const isSpecialPage = isEditMode

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Mobile Sheet Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-auto border-none bg-transparent shadow-none">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Admin Navigation</SheetTitle>
                    </SheetHeader>
                    <AdminSidebar
                        expandedSections={expandedSections}
                        onToggleSection={toggleSection}
                        onSignOutConfirm={() => {
                            setSidebarOpen(false);
                            handleSignOut();
                        }}
                        sidebarOpen={true}
                        onCloseSidebar={() => setSidebarOpen(false)}
                        isLoggingOut={isLoggingOut}
                    />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
                <AdminSidebar
                    expandedSections={expandedSections}
                    onToggleSection={toggleSection}
                    onSignOutConfirm={handleSignOut}
                    sidebarOpen={true}
                    isLoggingOut={isLoggingOut}
                />
            </div>

            {/* Main content area */}
            <main id="main-content" className="flex-1 flex flex-col lg:pl-64 overflow-hidden min-w-0 transition-all duration-300">
                <QueryClientProvider client={queryClient}>
                    <CreationJobsProvider>
                        <PermissionGuard
                            permission={PERMISSIONS.SYSTEM.FULL_ACCESS}
                            redirectTo="/dashboard"
                        >
                            {/* Header with Redux-managed features */}
                            <DashboardHeader
                                showNotifications={showNotifications}
                                onToggleNotifications={handleToggleNotifications}
                                onToggleSidebar={handleToggleSidebar}
                            />

                            <div className={cn(
                                "flex-1 relative min-h-0 bg-secondary/5",
                                isSpecialPage ? "overflow-hidden" : "overflow-y-auto"
                            )}>
                                <div className={cn(
                                    !isSpecialPage && "page-container min-h-full",
                                    isSpecialPage && "h-full"
                                )}>
                                    <ErrorBoundary>
                                        {children}
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </PermissionGuard>
                    </CreationJobsProvider>
                </QueryClientProvider>
            </main>

            {/* Progress Overlay for async operations */}
            <ProgressOverlay />
        </div>
    )
}
