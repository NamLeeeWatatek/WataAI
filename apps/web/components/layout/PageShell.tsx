import React from 'react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { LucideIcon } from 'lucide-react'

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
}

export const PageShell = ({
    children,
    title,
    titleClassName,
    description,
    actions,
    onRefresh,
    refreshing,
    className,
    contentClassName,
    fullWidth = false
}: PageShellProps) => {
    return (
        <div className={cn("flex flex-col", className)}>
            {title && (
                <PageHeader
                    title={title}
                    description={description}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    className="mb-6 px-1"
                >
                    {actions}
                </PageHeader>
            )}

            <div className={cn("flex-1", contentClassName)}>
                {children}
            </div>
        </div>
    )
}
