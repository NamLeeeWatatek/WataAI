import { Card, CardContent } from "@/components/ui/Card"
import { motion } from 'framer-motion'
import { Users, Zap, MessageSquare, Activity, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from "@/lib/types"

import { Variants } from 'framer-motion'

interface DashboardStatsCardsProps {
    stats: DashboardStats | undefined
    itemVariants: Variants
}

export function DashboardStatsCards({ stats, itemVariants }: DashboardStatsCardsProps) {
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

    const cards = [
        {
            id: 'users',
            title: t('dashboard.stats.members'),
            icon: Users,
            color: 'primary',
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
            color: 'success',
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
            color: 'info',
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
            color: 'warning',
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
            {cards.map((card) => (
                <motion.div key={card.id} variants={itemVariants}>
                    <Card variant="glass" className="overflow-hidden border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className={cn(
                                    "p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500",
                                    card.color === 'primary' ? 'bg-primary/10 text-primary' :
                                        card.color === 'success' ? 'bg-success/10 text-success' :
                                            card.color === 'info' ? 'bg-info/10 text-info' :
                                                card.color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-muted/10 text-muted-foreground'
                                )}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                {card.growth !== undefined && formatGrowthRate(card.growth)}
                            </div>
                            <div className="space-y-1 block relative z-10">
                                <h3 className="text-4xl font-bold tracking-tighter">{card.total || 0}</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
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
                </motion.div>
            ))}
        </div>
    )
}
