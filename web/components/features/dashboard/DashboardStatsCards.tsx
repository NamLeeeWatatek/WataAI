import { Card, CardContent } from "@/components/ui/Card"
import { Users, Zap, MessageSquare, Activity, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from "@/lib/types"


interface DashboardStatsCardsProps {
    stats: DashboardStats | undefined
    itemVariants?: any
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
    const { t } = useTranslation()

    const formatGrowthRate = (rate: number) => {
        const isPositive = rate >= 0
        return (
            <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                <span>{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
            </div>
        )
    }

    const gradients = {
        primary: {
            bg: "from-teal-500/20 via-cyan-500/5 to-transparent",
            icon: "bg-teal-500/10 text-teal-500 border-teal-500/20 shadow-teal-500/10",
            bar: "bg-teal-500"
        },
        success: {
            bg: "from-emerald-500/20 via-green-500/5 to-transparent",
            icon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10",
            bar: "bg-emerald-500"
        },
        info: {
            bg: "from-blue-500/20 via-cyan-500/5 to-transparent",
            icon: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10",
            bar: "bg-blue-500"
        },
        warning: {
            bg: "from-amber-500/20 via-orange-500/5 to-transparent",
            icon: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10",
            bar: "bg-amber-500"
        }
    }

    const cards = [
        {
            id: 'users',
            title: t('dashboard.stats.members'),
            icon: Users,
            color: 'primary' as keyof typeof gradients,
            total: stats?.users?.total,
            growth: stats?.users?.growthRate,
            substats: [
                { label: t('dashboard.stats.active'), value: stats?.users?.active },
                { label: t('dashboard.stats.new'), value: stats?.users?.newUsers }
            ]
        },
        {
            id: 'bots',
            title: t('dashboard.stats.totalBots'),
            icon: Zap,
            color: 'success' as keyof typeof gradients,
            total: stats?.bots?.total,
            growth: stats?.bots?.growthRate,
            substats: [
                { label: t('dashboard.stats.active'), value: stats?.bots?.active },
                { label: t('dashboard.stats.success'), value: `${stats?.bots?.avgSuccessRate?.toFixed(1) || 0}%` }
            ]
        },
        {
            id: 'conversations',
            title: t('dashboard.stats.conversations'),
            icon: MessageSquare,
            color: 'info' as keyof typeof gradients,
            total: stats?.conversations?.total,
            growth: stats?.conversations?.growthRate,
            substats: [
                { label: t('dashboard.stats.active'), value: stats?.conversations?.active },
                { label: t('dashboard.stats.avgMsgs'), value: stats?.conversations?.avgMessagesPerConversation?.toFixed(1) }
            ]
        },
        {
            id: 'flows',
            title: t('dashboard.stats.flowExecutions'),
            icon: Activity,
            color: 'warning' as keyof typeof gradients,
            total: stats?.flows?.totalExecutions,
            growth: stats?.flows?.growthRate,
            substats: [
                { label: t('dashboard.stats.success'), value: `${stats?.flows?.successRate?.toFixed(1) || 0}%` },
                { label: t('dashboard.stats.avgTime'), value: `${stats?.flows?.avgExecutionTime?.toFixed(1) || 0}s` }
            ]
        }
    ]

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {cards.map((card) => {
                const style = gradients[card.color] || gradients.primary;
                return (
                    <div key={card.id}>
                        <Card className="relative overflow-hidden h-full border-border/50">
                            {/* Background Gradient Mesh - Removed for performance */}

                            {/* Accent Bar */}
                            <div className={cn(
                                "absolute top-0 left-0 w-1 h-full opacity-20",
                                style.bar
                            )} />

                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "p-3 rounded-2xl border shadow-sm",
                                        style.icon
                                    )}>
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    {card.growth !== undefined && formatGrowthRate(card.growth)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-bold tracking-tighter">{card.total || 0}</h3>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                                        {card.title}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border/20 relative z-10">
                                    {card.substats.map((sub, idx) => (
                                        <div key={idx} className="flex flex-col flex-1">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{sub.label}</span>
                                            <span className="text-sm font-bold">{sub.value || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    )
}
