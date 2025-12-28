import React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface PageHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    iconClassName?: string
    children?: React.ReactNode
    className?: string
    premium?: boolean
    onRefresh?: () => void
    refreshing?: boolean
    breadcrumbs?: Array<{ label: string; href?: string }>
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconClassName,
    children,
    className,
    premium = false,
    onRefresh,
    refreshing = false,
    breadcrumbs
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-6 mb-8", className)}>
            {/* Breadcrumbs Placeholder - if needed in future */}

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    {/* Icon removed as per design requirement */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <h1 className={cn(
                            "text-3xl md:text-4xl font-black tracking-tight truncate",
                            premium && "bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                        )}>
                            {title}
                        </h1>
                        {description && (
                            <p className="text-muted-foreground font-medium text-sm md:text-base line-clamp-1">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl border-border/40 hover:bg-muted/50 transition-all hover:rotate-180 duration-500"
                            onClick={onRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", refreshing && "animate-spin")} />
                        </Button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    )
}
