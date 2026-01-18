import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
    icon: LucideIcon
    title: string
    description: string
    className?: string
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
    return (
        <div
            className={cn(
                "group relative p-6 rounded-2xl bg-card border border-border/50",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300 hover:-translate-y-1",
                className
            )}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
