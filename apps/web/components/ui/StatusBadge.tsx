import * as React from "react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Create a local alias for Badge properties since it is not exported from the component
type BadgeProps = React.ComponentProps<typeof Badge>;

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    status: string
    variant?: BadgeProps['variant']
    showIcon?: boolean
    animatePending?: boolean
    label?: string
}

export function StatusBadge({
    status,
    className,
    variant,
    showIcon = false,
    animatePending = true,
    label,
    children,
    ...props
}: StatusBadgeProps) {
    if (!status) return null;

    const normalizedStatus = status.toLowerCase();

    // 1. Determine base variant
    let computedVariant: BadgeProps['variant'] = "secondary";

    if (variant) {
        computedVariant = variant;
    } else if (
        ['completed', 'success', 'active', 'ready', 'published', 'enabled', 'resolved'].includes(normalizedStatus)
    ) {
        computedVariant = "success";
    } else if (
        ['failed', 'error', 'rejected', 'destructive', 'inactive', 'disabled', 'canceled', 'cancelled', 'stopped'].includes(normalizedStatus)
    ) {
        computedVariant = "destructive";
    } else if (
        ['warning', 'paused', 'warming_up', 'review'].includes(normalizedStatus)
    ) {
        computedVariant = "warning";
    } else if (
        ['processing', 'indexing', 'crawling', 'running', 'in_progress', 'syncing'].includes(normalizedStatus)
    ) {
        // We use secondary but will apply blue styling via class since 'info' variant doesn't exist in Badge
        computedVariant = "secondary";
    } else if (
        ['pending', 'queued', 'waiting'].includes(normalizedStatus)
    ) {
        computedVariant = "secondary";
    } else {
        computedVariant = "outline";
    }

    // 2. Extra styling for specific states that map to generic variants
    const isProcessing = ['processing', 'indexing', 'crawling', 'running', 'in_progress', 'syncing'].includes(normalizedStatus);
    const isPending = ['pending', 'queued', 'waiting'].includes(normalizedStatus);

    return (
        <Badge
            variant={computedVariant}
            className={cn(
                "capitalize whitespace-nowrap",
                // Blue tint for processing
                isProcessing && "bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border-transparent",
                // Pulse for active states if requested
                animatePending && (isProcessing || isPending) && "animate-pulse",
                className
            )}
            {...props}
        >
            {showIcon && isProcessing && <Loader2 className="mr-1 h-3 w-3" />}
            {children || label || normalizedStatus.replace(/_/g, " ")}
        </Badge>
    )
}
