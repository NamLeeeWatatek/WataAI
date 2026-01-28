
import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUiStore } from '@/lib/store/zustand/ui-store'
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
    LayoutDashboard,
    Zap,
    History,
    Settings2,
    Brain,
    Home,
    Bot,
    Sparkles,
    Library,
    ShieldCheck,
    Workflow,
    Layers,
} from 'lucide-react'

interface NavigationItem {
    name: string
    href?: string
    icon?: any
    children?: Array<{
        name: string
        href: string
        icon?: any
    }>
}

export const DashboardBreadcrumb = React.memo(() => {
    const pathname = usePathname()
    const { t } = useTranslation()

    const { breadcrumbNames } = useUiStore()

    // Synchronize with DashboardSidebar mapping for consistency
    const navigation = useMemo<NavigationItem[]>(() => [
        { name: t('dashboard.title'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('navigation.creationTools'), href: '/creation-tools', icon: Sparkles },
        { name: t('navigation.assetLibrary'), href: '/my-products', icon: Library },
        { name: t('dashboard.bots'), href: '/bots', icon: Bot },
        { name: t('dashboard.conversations'), href: '/conversations', icon: History },
        { name: t('dashboard.knowledgeBase'), href: '/knowledge-base', icon: Brain },
        { name: t('dashboard.channels'), href: '/channels', icon: Zap },
        { name: t('settings'), href: '/settings', icon: Settings2 },
        {
            name: t('dashboard.workflows'),
            href: '/workflows',
            icon: Workflow,
            children: [
                { name: t('dashboard.allWorkflows'), href: '/workflows' },
                { name: t('dashboard.createNew'), href: '/workflows/new' }
            ]
        },
        // System / Admin Routes
        { name: t('navigation.adminSystem'), href: '/system', icon: ShieldCheck },
        { name: t('navigation.users'), href: '/system/users', icon: ShieldCheck },
        { name: t('navigation.rolesPermissions'), href: '/system/roles-permissions', icon: ShieldCheck },
        { name: t('navigation.creationTools'), href: '/system/creation-tools', icon: Sparkles },
        { name: t('navigation.templates'), href: '/system/templates', icon: Layers },
    ], [t])

    const breadcrumbItems = useMemo(() => {
        if (pathname === '/dashboard') return null

        const segments = pathname.split('/').filter(Boolean)
        const items: React.ReactNode[] = []
        let currentPath = ''

        segments.forEach((segment, index) => {
            currentPath += `/${segment}`
            const isLast = index === segments.length - 1

            // Priority matching: Exact match > Child match
            const navItem = navigation.find(item => item.href === currentPath)
            const parentItem = navigation.find(item => item.children?.some(child => child.href === currentPath))
            const childItem = parentItem?.children?.find(child => child.href === currentPath)

            // Final item properties
            const matchItem = navItem || childItem;

            // Priority: Store override > Navigation match > Auto formatted
            let label = breadcrumbNames[segment] || matchItem?.name;

            if (!label) {
                // If it's a UUID-like string and no name in store, try to keep it shorter or formatting
                label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                // UUID shortening logic
                if (label.length > 20 && /[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment)) {
                    label = label.substring(0, 8) + '...'
                }
            }

            // Show icon for ANY segment that has a matching navItem or childItem
            const Icon = matchItem?.icon || (index === 0 ? navItem?.icon : null)

            items.push(
                <React.Fragment key={currentPath}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {isLast ? (
                            <BreadcrumbPage className="flex items-center gap-2">
                                {Icon && <Icon className="w-4 h-4 opacity-70" />}
                                <span suppressHydrationWarning className="line-clamp-1">{label}</span>
                            </BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink asChild>
                                <Link href={currentPath as any} className="flex items-center gap-2 hover:text-foreground transition-colors group">
                                    {Icon && <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                    <span suppressHydrationWarning className="line-clamp-1">{label}</span>
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
        <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 hover:text-foreground transition-colors group">
                            <Home className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <span suppressHydrationWarning className="font-medium">{t('common.home', { defaultValue: 'Home' })}</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems}
            </BreadcrumbList>
        </Breadcrumb>
    )
})

DashboardBreadcrumb.displayName = 'DashboardBreadcrumb'
