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

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !accessToken)) {
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
        // signOut handles backend call, client cleanup, and redirection
        await signOut({ redirect: true, callbackUrl: '/login' });
    }

    const isEditMode = pathname.includes('mode=edit')
    const isCreationToolDetail = pathname.startsWith('/creation-tools/') && pathname.split('/').length > 2;
    const isWorkflowDetail = pathname.startsWith('/workflows/') && pathname.split('/').length > 2;
    const isSettingsPage = pathname.startsWith('/settings');
    const isChatPage = pathname.startsWith('/chat');



    return (
        <div className="h-screen flex bg-background overflow-hidden">
            <WorkspaceInitializer />
            {/* Mobile Sheet Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-80 border-none bg-background/60 backdrop-blur-3xl shadow-2xl">
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
                        user={user} // Pass user data
                        isLoggingOut={isLoggingOut}
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
                    isLoggingOut={isLoggingOut}
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
            </main >

            {/* Progress Overlay for async operations */}
            < ProgressOverlay />
        </div >
    )
}
