import React from 'react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DashboardFooter } from './DashboardFooter'

interface PageShellProps {
    children: React.ReactNode
    title?: string
    titleClassName?: string
    description?: string
    actions?: React.ReactNode
    onRefresh?: () => void
    refreshing?: boolean
    className?: string
    contentClassName?: string
    fullWidth?: boolean
    footer?: React.ReactNode
    showDefaultFooter?: boolean
}

export const PageShell = ({
    children,
    title,
    description,
    actions,
    onRefresh,
    refreshing,
    className,
    contentClassName,
    fullWidth = false,
    footer,
    showDefaultFooter = true
}: PageShellProps) => {
    return (
        <div className={cn("flex flex-col min-h-full", className)}>
            {title && (
                <header>
                    <PageHeader
                        title={title}
                        description={description}
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                    >
                        {actions}
                    </PageHeader>
                </header>
            )}

            <section className={cn("flex-1", contentClassName)}>
                {children}
            </section>

            {footer ? (
                <footer>{footer}</footer>
            ) : showDefaultFooter ? (
                <DashboardFooter />
            ) : null}
        </div>
    )
}
