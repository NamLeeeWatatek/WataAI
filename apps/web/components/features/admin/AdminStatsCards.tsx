import { Card, CardContent } from "@/components/ui/Card"
import { motion } from 'framer-motion'
import { Badge } from "@/components/ui/Badge"
import { Users, LayoutGrid, Wrench, Sparkles, TrendingUp, TrendingDown, ClipboardList } from "lucide-react"
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface AdminStatsCardsProps {
    stats: any
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
    const { t } = useTranslation()

    const formatGrowthRate = (rate: number) => {
        const isPositive = rate >= 0
        return (
            <Badge
                variant={isPositive ? 'success' : 'destructive'}
                className="h-7 px-3 gap-1 rounded-full font-bold border-none"
            >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-[10px]">{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
            </Badge>
        )
    }

    const cards = [
        {
            id: 'users',
            title: t('dashboard.stats.totalUsers'),
            icon: Users,
            color: 'info',
            total: stats?.users?.total,
            growth: stats?.users?.growthRate,
            substats: [
                { label: t('dashboard.stats.active'), value: stats?.users?.active },
                { label: t('dashboard.stats.new'), value: stats?.users?.newUsers }
            ]
        },
        {
            id: 'workspaces',
            title: t('dashboard.stats.totalWorkspaces'),
            icon: LayoutGrid,
            color: 'primary',
            total: stats?.workspaces?.total,
            growth: stats?.workspaces?.growthRate,
            substats: [
                { label: t('dashboard.stats.growthRate'), value: `${stats?.workspaces?.growthRate?.toFixed(1) || 0}%` }
            ]
        },
        {
            id: 'tools',
            title: t('admin.stats.creationTools'),
            icon: Wrench,
            color: 'warning',
            total: stats?.creationTools?.total,
            growth: stats?.creationTools?.growthRate,
            substats: [
                { label: t('dashboard.stats.active'), value: stats?.creationTools?.active },
                { label: t('dashboard.stats.new'), value: stats?.creationTools?.current }
            ]
        },
        {
            id: 'jobs',
            title: t('admin.stats.generationJobs'),
            icon: ClipboardList,
            color: 'success',
            total: stats?.jobs?.total,
            growth: stats?.jobs?.growthRate,
            substats: [
                { label: t('dashboard.stats.success'), value: `${stats?.jobs?.successRate?.toFixed(1) || 0}%` },
                { label: t('common.error'), value: stats?.jobs?.failed }
            ]
        }
    ]

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <Card variant="premium" className="group h-full flex flex-col pt-2 transition-all duration-500">
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
                            card.color === 'info' ? 'bg-info' :
                                card.color === 'primary' ? 'bg-primary' :
                                    card.color === 'warning' ? 'bg-warning' :
                                        card.color === 'success' ? 'bg-success' : 'bg-muted'
                        )} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-all duration-300",
                                    card.color === 'info' ? 'bg-info/10 text-info group-hover:bg-info group-hover:text-white' :
                                        card.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' :
                                            card.color === 'warning' ? 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-black' :
                                                card.color === 'success' ? 'bg-success/10 text-success group-hover:bg-success group-hover:text-white' : 'bg-muted/10 text-muted-foreground'
                                )}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                {card.growth !== undefined && formatGrowthRate(card.growth)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold tracking-tight group-hover:translate-x-1 transition-transform">{card.total || 0}</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {card.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
                                {card.substats.map((sub, sidx) => (
                                    <div key={sidx} className="flex flex-col flex-1">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{sub.label}</span>
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
