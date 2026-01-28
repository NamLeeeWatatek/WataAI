'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    Loader2,
    Settings2,
    Bot,
    History,
    Brain,
    Zap,
    Library
} from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/features/workspace/WorkspaceSwitcher'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { UserRole } from '@/types/next-auth'

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

    const getRoleName = (role: any): string => {
        if (!role) return '';
        if (typeof role === 'string') return role;
        if (typeof role === 'object' && 'name' in role) return role.name || '';
        return '';
    }

    return (
        <aside className={cn(
            "h-full w-64 glass flex flex-col bg-card/50",
            onCloseSidebar ? "border-r-0" : ""
        )}>
            {/* Brand Header */}
            <div className="flex h-16 shrink-0 items-center px-6 mb-2">
                <div className="relative w-48 h-12 transition-transform duration-500 hover:scale-105">
                    <Image
                        src="/images/logo.svg"
                        alt="WataAI Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            <div className="px-4 mb-2">
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
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group",
                                        active
                                            ? "text-primary bg-primary/10 shadow-sm"
                                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                                    )}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />
                                    )}
                                    <item.icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "opacity-60 group-hover:opacity-100")} />
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

            {/* User Profile Footer */}
            <div className="p-3 border-t border-border/20">
                <Card className="p-3 transition-all duration-300 overflow-visible border-none shadow-none bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-9 h-9 ring-2 ring-primary/10 shadow-md">
                            <AvatarImage src={user?.avatarUrl || user?.image || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                                {getUserInitial()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold truncate text-foreground tracking-tight">
                                    {getUserName()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {user?.role && (
                                    <Badge className="px-1.5 py-0 text-[8px] font-black uppercase tracking-wider border-none">
                                        {getRoleName(user.role)}
                                    </Badge>
                                )}
                                <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                    {getUserEmail()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 justify-start text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
                </Card>
            </div>
        </aside>
    )
})

AdminSidebar.displayName = 'AdminSidebar'
