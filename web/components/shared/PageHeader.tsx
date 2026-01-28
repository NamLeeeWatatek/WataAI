
import React from 'react'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const pageHeaderVariants = cva(
    "flex flex-col gap-6",
    {
        variants: {
            variant: {
                default: "pb-6 border-b border-border/10 mb-10",
                sticky: "sticky top-0 z-40 glass-floating px-6 py-4 w-full mb-10",
                dashboard: "p-0 mb-10",
                clean: "pb-4 mb-8",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

interface PageHeaderProps extends VariantProps<typeof pageHeaderVariants> {
    title: string
    description?: string
    icon?: React.ElementType
    children?: React.ReactNode
    className?: string
    premium?: boolean
    onRefresh?: () => void
    refreshing?: boolean
    iconClassName?: string
    /** Heading level to render. Use 'h2' if page already has an h1. Default: 'h1' */
    as?: 'h1' | 'h2' | 'h3'
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    children,
    className,
    variant,
    premium = false,
    onRefresh,
    refreshing = false,
    iconClassName,
    as: HeadingTag = 'h1'
}: PageHeaderProps) {
    return (
        <div className={cn(pageHeaderVariants({ variant, className }))}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    {Icon && (
                        <div className="hidden md:flex w-12 h-12 rounded-2xl bg-primary/5 items-center justify-center border border-primary/10 shadow-sm shrink-0">
                            <Icon className={cn("w-6 h-6 text-primary", iconClassName)} />
                        </div>
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <HeadingTag className={cn(
                            "text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3",
                            premium && "bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                        )}>
                            {/* Mobile-only icon */}
                            {Icon && <Icon className={cn("w-6 h-6 md:hidden text-primary", iconClassName)} />}
                            <span suppressHydrationWarning>{title}</span>
                        </HeadingTag>
                        {description && (
                            <p className="text-muted-foreground text-sm line-clamp-1 opacity-70">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {onRefresh && (
                        <Button
                            variant="glass"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl"
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
