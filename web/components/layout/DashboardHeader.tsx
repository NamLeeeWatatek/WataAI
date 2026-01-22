'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { DashboardBreadcrumb } from './DashboardBreadcrumb'
import { DashboardNotifications } from './DashboardNotifications'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { GlobalActivityCenter } from '@/components/features/activity/GlobalActivityCenter'
import { Sun, Moon, Menu, ShieldAlert, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/usePermissions'
// Removed react-icons
import { useTranslation } from 'react-i18next'

import { usePathname } from 'next/navigation'
import { paths } from '@/lib/routes'

const AdminLink = () => {
    const { isSuperAdmin } = usePermissions()
    const pathname = usePathname()
    const { t } = useTranslation()

    if (pathname?.startsWith(paths.system.root)) return null

    const canAccessSystem = isSuperAdmin()

    if (!canAccessSystem) return null

    return (
        <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 text-primary hover:bg-primary/10 hover:text-primary font-black text-[10px] uppercase tracking-wider px-4 mr-2 h-9 shadow-sm shadow-primary/5 border border-primary/10"
            asChild
        >
            <Link href={paths.system.root as any}>
                <Settings className="w-3.5 h-3.5" />
                <span suppressHydrationWarning>{t('navigation.adminSystem')}</span>
            </Link>
        </Button>
    )
}

interface DashboardHeaderProps {
    showNotifications: boolean
    onToggleNotifications: () => void
    onToggleSidebar: () => void
}

export const DashboardHeader = React.memo<DashboardHeaderProps>(({
    showNotifications,
    onToggleNotifications,
    onToggleSidebar
}) => {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])


    return (
        <header className="glass-floating border-x-0 border-t-0 rounded-none h-16 flex-shrink-0 sticky top-0 z-40 transition-all duration-200">
            <div className="mx-auto w-full max-w-[1700px] px-6 md:px-10 lg:px-12 h-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        className="lg:hidden hover:bg-primary/5"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>

                    <DashboardBreadcrumb />
                </div>

                <div className="flex items-center gap-2">
                    {/* Admin Dashboard Link - Conditional */}
                    <AdminLink />

                    {/* Theme Toggle */}
                    {/* Theme Toggle - Disabled for now */}
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="relative w-9 h-9 rounded-full hover:bg-primary/5"
                        title="Toggle theme"
                    >
                        {!mounted ? (
                            <div className="w-4 h-4" />
                        ) : resolvedTheme === 'dark' ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                    </Button> */}

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Activity Center */}
                    <GlobalActivityCenter />

                    {/* Notifications */}
                    <DashboardNotifications
                        showNotifications={showNotifications}
                        onToggle={onToggleNotifications}
                    />
                </div>
            </div>
        </header>
    )
})

DashboardHeader.displayName = 'DashboardHeader'
