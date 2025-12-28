'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb'
import {
    Layout,
    GitMerge,
    Grid,
    Radio,
    Settings,
    Database,
    Home,
    Bot,
    MessageSquare,
    ChevronRight,
    ShieldCheck,
} from 'lucide-react'

interface NavigationItem {
    name: string
    href?: string
    icon?: any
    children?: Array<{
        name: string
        href: string
    }>
}

const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'UGC Factory', href: '/ugc-factory', icon: Grid },
    { name: 'Conversations', href: '/conversations', icon: Grid },
    {
        name: 'Workflows',
        icon: GitMerge,
        children: [
            { name: 'All Workflows', href: '/flows' },
            { name: 'Create New', href: '/flows/new?mode=edit' }
        ]
    },
    { name: 'Channels', href: '/channels', icon: Radio },
    { name: 'Knowledge Base', href: '/knowledge-base/collections', icon: Database },
    { name: 'Bots', href: '/bots', icon: Bot },
    { name: 'Chat AI', href: '/chat', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'System Administration', href: '/system', icon: ShieldCheck },
    { name: 'Users', href: '/system/users' },
    { name: 'Roles & Permissions', href: '/system/roles-permissions' },
    { name: 'Creation Tools', href: '/system/creation-tools' },
    { name: 'Templates', href: '/system/templates' },
]

export const DashboardBreadcrumb = React.memo(() => {
    const pathname = usePathname()

    const breadcrumbItems = useMemo(() => {
        if (pathname === '/dashboard') return null

        const segments = pathname.split('/').filter(Boolean)
        const items: React.ReactNode[] = []
        let currentPath = ''

        segments.forEach((segment, index) => {
            currentPath += `/${segment}`
            const isLast = index === segments.length - 1

            // Try to find matching item in navigation (including children)
            const navItem = navigation.find(item =>
                item.href === currentPath ||
                item.children?.some(child => child.href === currentPath)
            )

            const childItem = navItem?.children?.find(child => child.href === currentPath)
            const label = childItem?.name || navItem?.name || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            const Icon = (index === 0 && navItem?.icon) ? navItem.icon : null

            items.push(
                <React.Fragment key={currentPath}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {isLast ? (
                            <BreadcrumbPage className="flex items-center gap-2">
                                {Icon && <Icon className="w-4 h-4" />}
                                <span>{label}</span>
                            </BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink asChild>
                                <Link href={currentPath as any} className="flex items-center gap-2">
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span>{label}</span>
                                </Link>
                            </BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                </React.Fragment>
            )
        })

        return items
    }, [pathname])

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems}
            </BreadcrumbList>
        </Breadcrumb>
    )
})

DashboardBreadcrumb.displayName = 'DashboardBreadcrumb'
