'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppSelector } from '@/lib/store/hooks'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb'
import { useTranslation } from 'react-i18next'
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

export const DashboardBreadcrumb = React.memo(() => {
    const pathname = usePathname()
    const { t } = useTranslation() // Hook added

    const breadcrumbNames = useAppSelector((state) => state.ui.breadcrumbNames)

    const navigation = useMemo<NavigationItem[]>(() => [
        { name: t('dashboard.title'), href: '/dashboard', icon: Layout },
        { name: t('dashboard.ugcFactory'), href: '/ugc-factory', icon: Grid },
        { name: t('dashboard.conversations'), href: '/conversations', icon: Grid },
        {
            name: t('dashboard.workflows'),
            icon: GitMerge,
            children: [
                { name: t('dashboard.allWorkflows'), href: '/flows' },
                { name: t('dashboard.createNew'), href: '/flows/new?mode=edit' }
            ]
        },
        { name: t('dashboard.channels'), href: '/channels', icon: Radio },
        { name: t('dashboard.knowledgeBase'), href: '/knowledge-base/collections', icon: Database },
        { name: t('dashboard.bots'), href: '/bots', icon: Bot },
        { name: t('dashboard.chatAI'), href: '/chat', icon: MessageSquare },
        { name: t('settings'), href: '/settings', icon: Settings },
        { name: t('navigation.adminSystem'), href: '/system', icon: ShieldCheck },
        { name: t('navigation.users'), href: '/system/users' },
        { name: t('navigation.rolesPermissions'), href: '/system/roles-permissions' },
        { name: t('navigation.creationTools'), href: '/system/creation-tools' },
        { name: t('navigation.templates'), href: '/system/templates' },
    ], [t])

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

            // Priority: Store override > Navigation match > Auto formatted
            let label = breadcrumbNames[segment] || childItem?.name || navItem?.name;

            if (!label) {
                // If it's a UUID-like string and no name in store, try to keep it shorter or formatting
                // But for now, just auto-format
                label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }

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
    }, [pathname, breadcrumbNames, navigation])

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            <span>{t('common.home', { defaultValue: 'Home' })}</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems}
            </BreadcrumbList>
        </Breadcrumb>
    )
})

DashboardBreadcrumb.displayName = 'DashboardBreadcrumb'
