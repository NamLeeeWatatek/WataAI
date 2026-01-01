import { ReactNode } from 'react'
import { Info, AlertTriangle, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/utils'

const alertVariants = cva(
    "p-4 rounded-xl border flex gap-4 items-start transition-all duration-300",
    {
        variants: {
            variant: {
                info: "bg-info/5 border-info/20 text-info",
                warning: "bg-warning/5 border-warning/20 text-warning",
                error: "bg-destructive/5 border-destructive/20 text-destructive",
                success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                tip: "bg-primary/5 border-primary/20 text-primary",
            },
        },
        defaultVariants: {
            variant: "info",
        },
    }
)

const ICON_MAP = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle2,
    tip: Lightbulb,
}

interface AlertBannerProps extends VariantProps<typeof alertVariants> {
    title?: string
    children: ReactNode
    icon?: ReactNode
    className?: string
}

export function AlertBanner({
    variant = 'info',
    title,
    children,
    icon,
    className
}: AlertBannerProps) {
    const IconComponent = ICON_MAP[variant as keyof typeof ICON_MAP] || Info

    return (
        <div className={cn(alertVariants({ variant, className }))}>
            <div className="flex-shrink-0 mt-0.5">
                {icon || <IconComponent className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="font-bold mb-1 tracking-tight">
                        {title}
                    </h4>
                )}
                <div className="text-sm font-medium opacity-90 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    )
}

interface AlertInlineProps extends VariantProps<typeof alertVariants> {
    children: ReactNode
    className?: string
}

export function AlertInline({ variant = 'info', children, className }: AlertInlineProps) {
    const IconComponent = ICON_MAP[variant as keyof typeof ICON_MAP] || Info

    return (
        <div className={cn(
            "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
            alertVariants({ variant }),
            className
        )}>
            <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="opacity-90">{children}</span>
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
        <div className={cn('p-4 bg-muted/30 border border-border/40 rounded-xl overflow-hidden', className)}>
            {label && (
                <p className="text-[10px] font-black text-muted-foreground/60 mb-2 uppercase tracking-widest">
                    {label}
                </p>
            )}
            <code className="text-sm break-all font-mono leading-relaxed">
                {children}
            </code>
        </div>
    )
}

