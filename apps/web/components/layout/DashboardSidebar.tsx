'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { usePermissions } from '@/lib/hooks/usePermissions'
import {
    Layout,
    Radio,
    Settings,
    Database,
    ChevronDown,
    LogOut,
    MessageSquare,
    Bot,
    Sparkles,
    Package,
} from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/features/workspace/WorkspaceSwitcher'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { UserRole } from '@/types/next-auth'

interface NavigationItem {
    name: string
    href?: string
    icon: any
    children?: Array<{
        name: string
        href: string
    }>
}

interface UserProp {
    name?: string | null
    email?: string | null
    image?: string | null
    avatarUrl?: string | null
    role?: UserRole | string | null
}

interface DashboardSidebarProps {
    expandedSections: string[]
    onToggleSection: (section: string) => void
    onSignOutConfirm: () => void
    sidebarOpen: boolean
    onCloseSidebar?: () => void
    user?: UserProp | null
}

const getTranslatedNavigation = (t: any): NavigationItem[] => [
    { name: t('dashboard.title'), href: '/dashboard', icon: Layout },
    { name: 'Creation Tools', href: '/creation-tools', icon: Sparkles },
    // Jobs page removed in favor of global widget
    { name: 'My Products', href: '/my-products', icon: Package },
    // Admin was moved to Header
    { name: t('dashboard.bots'), href: '/bots', icon: Bot },
    { name: t('dashboard.chatAI'), href: '/chat', icon: MessageSquare },
    { name: t('dashboard.channels'), href: '/channels', icon: Radio },
    { name: t('dashboard.conversations'), href: '/conversations', icon: MessageSquare },
    { name: t('dashboard.knowledgeBase'), href: '/knowledge-base', icon: Database },
    { name: t('settings'), href: '/settings', icon: Settings },
]

const getRoleName = (role: UserRole | string | null | undefined): string => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && 'name' in role) return role.name || '';
    return '';
}

export const DashboardSidebar = React.memo<DashboardSidebarProps>(({
    expandedSections,
    onToggleSection,
    onSignOutConfirm,
    sidebarOpen,
    onCloseSidebar,
    user
}) => {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { capabilities } = usePermissions()
    const navigation = getTranslatedNavigation(t)

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const getUserName = () => {
        if (!user) return 'User'
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
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-foreground">Wata AI</span>
                </div>
            </div>

            {/* Workspace Switcher */}
            <div className="px-4 pb-4">
                <WorkspaceSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
                {navigation.map((item) => {
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
                                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-70")} />
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
                                                        ? "text-primary font-medium bg-primary/5"
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
            </nav>

            <div className="p-3 border-t border-border/30">
                <div className="group rounded-xl border border-border/30 bg-card/20 p-3 hover:bg-card/40 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-9 h-9 border border-border/50">
                            <AvatarImage src={user?.avatarUrl || user?.image || ''} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                                {getUserInitial()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {getUserName()}
                                </p>
                                {user?.role && (
                                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20 capitalize">
                                        {getRoleName(user.role)}
                                    </span>
                                )}
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
                    >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        <span>{t('dashboard.signOut')}</span>
                    </Button>
                </div>
            </div>
        </aside>
    )
})

DashboardSidebar.displayName = 'DashboardSidebar'
