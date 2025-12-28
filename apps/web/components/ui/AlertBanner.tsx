import { ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertVariant = 'info' | 'warning' | 'error' | 'success' | 'tip'

interface AlertBannerProps {
    variant?: AlertVariant
    title?: string
    children: ReactNode
    icon?: ReactNode
    className?: string
}

const variantStyles = {
    info: {
        container: 'bg-info/10 border-info/20',
        icon: 'text-info',
        title: 'text-info',
        IconComponent: Info
    },
    warning: {
        container: 'bg-warning/10 border-warning/20',
        icon: 'text-warning',
        title: 'text-warning',
        IconComponent: AlertTriangle
    },
    error: {
        container: 'bg-destructive/10 border-destructive/20',
        icon: 'text-destructive',
        title: 'text-destructive',
        IconComponent: AlertCircle
    },
    success: {
        container: 'bg-success/10 border-success/20',
        icon: 'text-success',
        title: 'text-success',
        IconComponent: CheckCircle2
    },
    tip: {
        container: 'bg-primary/10 border-primary/20',
        icon: 'text-primary',
        title: 'text-primary',
        IconComponent: Lightbulb
    }
}

export function AlertBanner({
    variant = 'info',
    title,
    children,
    icon,
    className
}: AlertBannerProps) {
    const styles = variantStyles[variant]
    const IconComponent = styles.IconComponent

    return (
        <div className={cn(
            'p-4 rounded-lg border flex gap-3 items-start',
            styles.container,
            className
        )}>
            <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
                {icon || <IconComponent className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={cn('font-semibold mb-1', styles.title)}>
                        {title}
                    </h4>
                )}
                <div className="text-sm text-muted-foreground leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    )
}

interface AlertInlineProps {
    variant?: AlertVariant
    children: ReactNode
    className?: string
}

export function AlertInline({ variant = 'info', children, className }: AlertInlineProps) {
    const styles = variantStyles[variant]
    const IconComponent = styles.IconComponent

    return (
        <div className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
            styles.container,
            className
        )}>
            <IconComponent className={cn('w-4 h-4 flex-shrink-0', styles.icon)} />
            <span className="text-muted-foreground">{children}</span>
        </div>
    )
}

interface CodeBlockProps {
    children: ReactNode
    label?: string
    className?: string
}

export function CodeBlock({ children, label, className }: CodeBlockProps) {
    return (
        <div className={cn('p-4 bg-muted border border-border rounded-lg', className)}>
            {label && (
                <p className="text-xs font-medium text-muted-foreground mb-2">
                    {label}
                </p>
            )}
            <code className="text-sm break-all font-mono">
                {children}
            </code>
        </div>
    )
}

