'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Wrench,
    Sparkles,
    ChevronDown,
    LogOut,
    ArrowLeft,
    Folder,
    Loader2
} from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/features/workspace/WorkspaceSwitcher'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

interface NavigationItem {
    name: string
    href?: string
    icon: any
    permission?: string
    children?: Array<{
        name: string
        href: string
    }>
}

interface AdminSidebarProps {
    expandedSections: string[]
    onToggleSection: (section: string) => void
    onSignOutConfirm: () => void
    sidebarOpen: boolean
    onCloseSidebar?: () => void
    isLoggingOut?: boolean
}

import { PERMISSIONS } from '@/lib/config/permissions'

const getAdminNavigation = (t: any): NavigationItem[] => [
    { name: t('dashboard.title') || 'Dashboard', href: paths.system.root, icon: LayoutDashboard },
    { name: t('navigation.users'), href: paths.system.users.root, icon: Users, permission: PERMISSIONS.IAM.LIST_USERS },
    { name: t('navigation.rolesPermissions'), href: paths.system.roles.root, icon: ShieldCheck, permission: PERMISSIONS.IAM.LIST_ROLES },
    { name: t('navigation.categories'), href: paths.system.categories?.root, icon: Folder, permission: PERMISSIONS.TOOLS.LIST }, // Assuming Categories uses Tool list permission for now, or add specific later
    { name: t('navigation.creationTools'), href: paths.system.creationTools.root, icon: Wrench, permission: PERMISSIONS.TOOLS.LIST },
    { name: t('navigation.templates'), href: paths.system.templates.root, icon: Sparkles, permission: PERMISSIONS.TEMPLATES.LIST },
]

export const AdminSidebar = React.memo<AdminSidebarProps>(({
    expandedSections,
    onToggleSection,
    onSignOutConfirm,
    sidebarOpen,
    onCloseSidebar,
    isLoggingOut
}) => {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { user } = useAuth()
    const { hasPermission } = usePermissions()
    const navigation = getAdminNavigation(t)

    const isActive = (href: string) => {
        if (href === paths.system.root) return pathname === href
        return pathname.startsWith(href)
    }

    const getUserName = () => {
        if (!user) return 'Loading'
        return user.name || user.email || 'User'
    }

    const getUserEmail = () => {
        if (!user) return ''
        return user.email || ''
    }

    const getUserInitial = () => {
        const name = getUserName()
        return name.charAt(0).toUpperCase()
    }

    return (
        <aside className={cn(
            "flex flex-col h-full bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-r border-border/40",
            // Desktop standard positioning
            "hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50",
            // Allow override for Sheet usage (mobile)
            onCloseSidebar ? "flex w-full border-r-0 relative" : ""
        )}>
            {/* Header */}
            <div className="h-16 flex items-center px-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-foreground">{t('navigation.adminSystem')}</span>
                </div>
            </div>

            {/* Workspace Switcher */}
            <div className="px-4 pb-4">
                <WorkspaceSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
                {navigation.map((item) => {
                    // Permission Check
                    if (item.permission && !hasPermission(item.permission)) {
                        // Special check: If it's a list permission, maybe check 'read' or 'list' variant?
                        // For now strict check.
                        // Also support checking if ANY child is accessible?
                        return null;
                    }
                    // Alternate: if no specific permission but has children, check if has access to at least one child logic could go here.

                    const active = item.href ? isActive(item.href) : false
                    const isExpanded = expandedSections.includes(item.name.toLowerCase())
                    const hasChildren = item.children && item.children.length > 0

                    return (
                        <div key={item.name} className="space-y-0.5">
                            {hasChildren ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => onToggleSection(item.name.toLowerCase())}
                                    className={cn(
                                        "w-full justify-between h-9 px-3 text-sm font-medium transition-colors",
                                        "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-4 h-4 opacity-70" />
                                        <span className="">{item.name}</span>
                                    </div>
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </Button>
                            ) : (
                                <Link
                                    href={item.href as any}
                                    onClick={onCloseSidebar}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        active
                                            ? "bg-red-500/10 text-red-600 shadow-sm ring-1 ring-red-500/20"
                                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4", active ? "text-red-600" : "opacity-70")} />
                                    <span>{item.name}</span>
                                </Link>
                            )}

                            {hasChildren && isExpanded && (
                                <div className="pl-4 space-y-0.5 mt-0.5 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-px before:bg-border/50">
                                    {item.children!.map((child) => {
                                        const isChildActive = isActive(child.href)
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href as any}
                                                onClick={onCloseSidebar}
                                                className={cn(
                                                    "block pl-8 pr-3 py-1.5 rounded-lg text-sm transition-colors relative",
                                                    isChildActive
                                                        ? "text-red-600 font-medium bg-red-500/5"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                {child.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Separator */}
                <div className="my-4 border-t border-border/40" />

                {/* Back to App */}
                <Link
                    href="/dashboard"
                    onClick={onCloseSidebar}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                >
                    <ArrowLeft className="w-4 h-4 opacity-70" />
                    <span>{t('navigation.backToApp')}</span>
                </Link>

            </nav>

            <div className="p-3 border-t border-border/30">
                <div className="group rounded-xl border border-border/30 bg-card/20 p-3 hover:bg-card/40 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-9 h-9 border border-border/50">
                            <AvatarImage src={user?.avatarUrl || ''} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                                {getUserInitial()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {getUserName()}
                                </p>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {getUserEmail()}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={onSignOutConfirm}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        ) : (
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                        )}
                        <span>{isLoggingOut ? t('dashboard.signingOut') : t('dashboard.signOut')}</span>
                    </Button>
                </div>
            </div>
        </aside>
    )
})

AdminSidebar.displayName = 'AdminSidebar'
