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
                default: "pb-8", // Internal padding instead of external margin
                sticky: "sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 border-b border-border/10 w-full",
                dashboard: "p-0",
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
    children?: React.ReactNode
    className?: string
    premium?: boolean
    onRefresh?: () => void
    refreshing?: boolean
}

export function PageHeader({
    title,
    description,
    children,
    className,
    variant,
    premium = false,
    onRefresh,
    refreshing = false,
}: PageHeaderProps) {
    return (
        <div className={cn(pageHeaderVariants({ variant, className }))}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
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
                            className="h-10 w-10 shrink-0 border-border/40 hover:bg-muted/50 transition-all duration-500 rounded-md"
                            onClick={onRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw className={cn("w-4 h-4 text-muted-foreground")} />
                        </Button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    )
}
