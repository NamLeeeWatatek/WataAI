import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Sparkles, Database, Code2 } from "lucide-react"

const specifyBadgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all border shadow-sm",
    {
        variants: {
            variant: {
                default: "bg-white/10 dark:bg-black/20 text-foreground border-white/10 dark:border-white/5 backdrop-blur-md",
                rag: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/5",
                ai: "bg-teal-500/10 text-teal-500 border-teal-500/20 shadow-teal-500/5",
                code: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface SpecifyBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof specifyBadgeVariants> {
    label?: string
    icon?: React.ReactNode
}

export function SpecifyBadge({
    variant,
    label,
    icon,
    className,
    children,
    ...props
}: SpecifyBadgeProps) {
    const defaultIcon = () => {
        switch (variant) {
            case 'rag': return <Database className="size-3" />
            case 'ai': return <Sparkles className="size-3" />
            case 'code': return <Code2 className="size-3" />
            default: return null
        }
    }

    return (
        <div className={cn(specifyBadgeVariants({ variant, className }))} {...props}>
            {icon || defaultIcon()}
            <span>{label || children}</span>
        </div>
    )
}
