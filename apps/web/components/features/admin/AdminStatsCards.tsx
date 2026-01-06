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

    const gradients = {
        info: {
            bg: "from-blue-500/20 via-cyan-500/5 to-transparent",
            icon: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10",
            bar: "bg-blue-500"
        },
        primary: {
            bg: "from-violet-500/20 via-fuchsia-500/5 to-transparent",
            icon: "bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-violet-500/10",
            bar: "bg-violet-500"
        },
        warning: {
            bg: "from-amber-500/20 via-orange-500/5 to-transparent",
            icon: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10",
            bar: "bg-amber-500"
        },
        success: {
            bg: "from-emerald-500/20 via-green-500/5 to-transparent",
            icon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10",
            bar: "bg-emerald-500"
        }
    }

    const formatGrowthRate = (rate: number, colorKey: keyof typeof gradients = 'success') => {
        const isPositive = rate >= 0
        // Dynamic badge color based on growth direction
        const badgeColor = isPositive
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20";

        return (
            <Badge
                variant="outline"
                className={cn("h-6 px-2 gap-1 rounded-full font-bold border", badgeColor)}
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
            color: 'info' as keyof typeof gradients,
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
            color: 'primary' as keyof typeof gradients,
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
            color: 'warning' as keyof typeof gradients,
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
            color: 'success' as keyof typeof gradients,
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
            {cards.map((card, idx) => {
                const style = gradients[card.color] || gradients.primary;

                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="group h-full flex flex-col relative overflow-hidden border-border/50 hover:border-border/80 transition-all duration-500 hover:shadow-lg">
                            {/* Background Gradient Mesh */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br",
                                style.bg
                            )} />

                            {/* Accent Bar */}
                            <div className={cn(
                                "absolute top-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-500",
                                style.bar
                            )} />

                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-5">
                                    <div className={cn(
                                        "p-3 rounded-2xl border transition-all duration-300 shadow-sm group-hover:scale-110",
                                        style.icon
                                    )}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    {card.growth !== undefined && formatGrowthRate(card.growth, card.color)}
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
                )
            })}
        </div>
    )
}
