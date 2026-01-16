import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { MoreHorizontal, Bot } from "lucide-react"

export interface AgentCardProps extends React.HTMLAttributes<HTMLDivElement> {
    name: string
    description?: string
    icon?: string
    status?: 'online' | 'offline' | 'busy'
    tags?: string[]
    onAction?: () => void
}

export function AgentCard({
    name,
    description,
    icon,
    status = 'offline',
    tags = [],
    onAction,
    className,
    children,
    ...props
}: AgentCardProps) {
    return (
        <Card
            className={cn(
                "group relative overflow-hidden glass-card bg-card/40 border border-white/5 hover:bg-white/[0.03] dark:hover:bg-black/40 transition-all duration-300",
                className
            )}
            {...props}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                            <AvatarImage src={icon} alt={name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                <Bot className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        {status && (
                            <span
                                className={cn(
                                    "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-background",
                                    status === 'online' ? "bg-emerald-500" : status === 'busy' ? "bg-amber-500" : "bg-slate-500"
                                )}
                            />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-5 pt-2">
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-white/5 dark:bg-black/20 hover:bg-white/10 dark:hover:bg-white/5 border-none text-[10px] py-0 h-5"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
                {children}
            </CardContent>

            {/* Hover Glow Effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        </Card >
    )
}
