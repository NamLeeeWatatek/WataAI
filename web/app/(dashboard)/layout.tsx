'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'
import { cn } from '@/lib/utils'

import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { CreationJobsProvider } from '@/components/providers/CreationJobsProvider'
import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer'

import { LoadingLogo } from '@/components/shared/LoadingLogo'
import { ProgressOverlay } from '@/components/shared/ProgressOverlay'


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Layout state
    const [expandedSections, setExpandedSections] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Auth hooks
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const { isAuthenticated, isLoading, signOut, accessToken, user } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useTranslation()

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !accessToken)) {
            // Unauthenticated logic handled by useAuth or global session watcher
        }
    }, [isLoading, isAuthenticated, accessToken, router])

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
        await signOut({ redirect: true, callbackUrl: '/login' });
    }

    const isEditMode = pathname.includes('mode=edit')
    const isChatPage = pathname.startsWith('/chat');

    return (
        <div className="h-screen flex bg-background overflow-hidden font-sans">
            <WorkspaceInitializer />

            {/* Mobile Sheet Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-auto border-none bg-transparent shadow-none">
                    <div className="h-full w-full">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </SheetHeader>
                        <DashboardSidebar
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                            onSignOutConfirm={() => {
                                setSidebarOpen(false);
                                handleSignOut();
                            }}
                            sidebarOpen={true}
                            onCloseSidebar={() => setSidebarOpen(false)}
                            user={user}
                            isLoggingOut={isLoggingOut}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
                <DashboardSidebar
                    expandedSections={expandedSections}
                    onToggleSection={toggleSection}
                    onSignOutConfirm={handleSignOut}
                    sidebarOpen={true}
                    user={user}
                    isLoggingOut={isLoggingOut}
                />
            </div>

            {/* Main content area */}
            <main
                id="main-content"
                className="flex-1 flex flex-col lg:pl-64 overflow-hidden min-w-0 outline-none"
                tabIndex={-1}
            >
                <CreationJobsProvider>
                    <DashboardHeader
                        showNotifications={showNotifications}
                        onToggleNotifications={handleToggleNotifications}
                        onToggleSidebar={handleToggleSidebar}
                    />

                    <div className="flex-1 overflow-hidden relative min-h-0 bg-secondary/5">
                        <div className={cn(
                            "h-full w-full overflow-auto",
                            !isChatPage && !isEditMode && "page-container min-h-full"
                        )}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </div>
                    </div>
                </CreationJobsProvider>
            </main>

            {/* Progress Overlay for async operations */}
            <ProgressOverlay />
        </div>
    )
}
