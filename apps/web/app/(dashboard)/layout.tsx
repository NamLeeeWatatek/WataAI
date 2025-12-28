'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { ProgressOverlay } from '@/components/ui/ProgressOverlay'
import toast from '@/lib/toast'

import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { CreationJobsProvider } from '@/components/providers/CreationJobsProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ActiveJobsWidget } from '@/components/features/creation-tools/ActiveJobsWidget'
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Redux-managed layout state
    const [expandedSections, setExpandedSections] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Auth hooks
    // Auth hooks - logic simplified for hybrid approach
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const { isAuthenticated, isLoading, signOut, accessToken, user } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useTranslation()

    // Handle session errors and redirects
    // We keep this for client-side protection fallback, but we don't block rendering
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !accessToken)) {
            // Optional: Force redirect if needed, but Middleware usually handles this
            // router.push('/login')
        }
    }, [isLoading, isAuthenticated, accessToken, router])

    // While performing logout, show global loading screen
    if (isLoggingOut) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={t('dashboard.confirm.signingOut')} />
            </div>
        )
    }

    // REMOVED: Blocking loading screen logic
    // We now allow partial rendering (skeleton or initial UI) instead of white screen.
    // Ideally, the parent Server Component has already validated the session.

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
        setIsLoggingOut(true);
        // signOut handles backend call, client cleanup, and redirection
        await signOut({ redirect: true, callbackUrl: '/login' });
    }

    const isEditMode = pathname.includes('mode=edit')
    const isSpecialPage = isEditMode

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            <WorkspaceInitializer />
            {/* Mobile Sheet Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-72 border-r border-border/40 bg-background/95 backdrop-blur-xl">
                    <DashboardSidebar
                        expandedSections={expandedSections}
                        onToggleSection={toggleSection}
                        onSignOutConfirm={() => {
                            setSidebarOpen(false);
                            handleSignOut();
                        }}
                        sidebarOpen={true}
                        onCloseSidebar={() => setSidebarOpen(false)}
                        user={user} // Pass user data
                    />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
                <DashboardSidebar
                    expandedSections={expandedSections}
                    onToggleSection={toggleSection}
                    onSignOutConfirm={handleSignOut}
                    sidebarOpen={true}
                    user={user} // Pass user data
                />
            </div>

            {/* Main content area */}
            <main className="flex-1 flex flex-col lg:pl-64 overflow-hidden min-w-0 transition-all duration-300">
                <CreationJobsProvider>
                    {/* Header with Redux-managed features */}
                    <DashboardHeader
                        showNotifications={showNotifications}
                        onToggleNotifications={handleToggleNotifications}
                        onToggleSidebar={handleToggleSidebar}
                    />

                    {/* Content area with conditional container classes */}
                    <div className="flex-1 overflow-hidden relative min-h-0">
                        <div className={`h-full ${isSpecialPage ? 'overflow-auto' : 'page-container overflow-auto'}`}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </div>
                    </div>
                    <ActiveJobsWidget />
                </CreationJobsProvider>
            </main >

            {/* Progress Overlay for async operations */}
            < ProgressOverlay />
        </div >
    )
}
