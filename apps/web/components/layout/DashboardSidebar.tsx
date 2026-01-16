'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { usePermissions } from '@/lib/hooks/usePermissions'
import {
    LayoutDashboard,
    Zap,
    Settings2,
    Database,
    ChevronDown,
    LogOut,
    MessageSquareText,
    Bot,
    Sparkles,
    Library,
    Loader2,
    History,
    Brain,
    Layout
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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

interface NavigationGroup {
    title: string
    items: NavigationItem[]
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
    isLoggingOut?: boolean
}

const getNavigationGroups = (t: any): NavigationGroup[] => [
    {
        title: t('sidebar.groups.overview'),
        items: [
            { name: t('dashboard.title'), href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: t('sidebar.groups.studio'),
        items: [
            { name: t('navigation.creationTools'), href: '/creation-tools', icon: Sparkles },
            { name: t('navigation.assetLibrary'), href: '/my-products', icon: Library },
        ]
    },
    {
        title: t('sidebar.groups.intelligence'),
        items: [
            { name: t('dashboard.bots'), href: '/bots', icon: Bot },
            { name: t('dashboard.chatAI'), href: '/chat', icon: MessageSquareText },
            { name: t('dashboard.conversations'), href: '/conversations', icon: History },
        ]
    },
    {
        title: t('sidebar.groups.knowledge'),
        items: [
            { name: t('dashboard.knowledgeBase'), href: '/knowledge-base', icon: Brain },
            { name: t('dashboard.channels'), href: '/channels', icon: Zap },
        ]
    },
    {
        title: t('sidebar.groups.system'),
        items: [
            { name: t('settings'), href: '/settings', icon: Settings2 },
        ]
    }
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
    user,
    isLoggingOut
}) => {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { capabilities } = usePermissions()
    const groups = getNavigationGroups(t)

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
        <React.Fragment>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => onToggleSection('close_mobile')}
                />
            )}

            <aside className={cn(
                "fixed top-0 left-0 z-50 h-screen w-64 glass flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full lg:z-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                onCloseSidebar ? "border-r-0" : ""
            )}>
                {/* Brand Header */}
                <div className="flex h-16 shrink-0 items-center justify-between px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-foreground font-display">Wata AI</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-8 overflow-y-auto scrollbar-thin py-6">
                    {groups.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const active = item.href ? isActive(item.href) : false
                                    const isExpanded = expandedSections.includes(item.name.toLowerCase())
                                    const hasChildren = item.children && item.children.length > 0

                                    return (
                                        <div key={item.name} className="space-y-1">
                                            {hasChildren ? (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => onToggleSection(item.name.toLowerCase())}
                                                    className={cn(
                                                        "w-full justify-between h-10 px-4 text-sm font-semibold transition-all",
                                                        "hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-xl"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <item.icon className="w-4 h-4 opacity-60" />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <ChevronDown
                                                        className={`w-3.5 h-3.5 transition-transform duration-200 opacity-40 ${isExpanded ? 'rotate-180' : ''}`}
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
                                                <div className="pl-6 space-y-1 mt-1 relative before:absolute before:left-[22px] before:top-0 before:bottom-0 before:w-px before:bg-border/40">
                                                    {item.children!.map((child) => {
                                                        const isChildActive = isActive(child.href)
                                                        return (
                                                            <Link
                                                                key={child.name}
                                                                href={child.href as any}
                                                                onClick={onCloseSidebar}
                                                                className={cn(
                                                                    "block pl-8 pr-4 py-2 rounded-lg text-sm transition-all relative",
                                                                    isChildActive
                                                                        ? "text-primary font-bold bg-primary/5"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
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
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-3 border-t border-border/20">
                    <Card className="p-3 hover:bg-card/60 transition-all duration-300 overflow-visible glass-card border-none shadow-none bg-transparent">
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
        </React.Fragment>
    )
})

DashboardSidebar.displayName = 'DashboardSidebar'
