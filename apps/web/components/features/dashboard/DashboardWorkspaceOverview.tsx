import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { FiUsers, FiZap, FiMessageSquare, FiTrendingUp, FiTrendingDown } from "react-icons/fi"
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from "@/lib/types"

interface DashboardWorkspaceOverviewProps {
    stats: DashboardStats | undefined
}

export function DashboardWorkspaceOverview({ stats }: DashboardWorkspaceOverviewProps) {
    const { t } = useTranslation()

    const formatGrowthRate = (rate: number) => {
        const isPositive = rate >= 0
        return (
            <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
                {isPositive ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                <span>{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
            </div>
        )
    }

    return (
        <Card variant="glass" className="h-full border-white/5 shadow-xl">
            <CardHeader className="border-b border-border/10 px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-info rounded-full shadow-[0_0_15px_rgba(var(--info),0.5)]" />
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">
                            {t('dashboard.stats.workspaceOverview')}
                        </CardTitle>
                        <CardDescription className="text-sm opacity-70">
                            {t('dashboard.stats.overviewDescription', { defaultValue: 'Global workspace metrics' })}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                    {[
                        { label: t('dashboard.stats.activeWorkspaces'), value: stats?.workspaces?.active, icon: FiUsers, color: 'primary' },
                        { label: t('dashboard.stats.totalBots'), value: stats?.bots?.total, icon: FiZap, color: 'success' },
                        { label: t('dashboard.stats.totalConversations'), value: stats?.conversations?.total, icon: FiMessageSquare, color: 'info' }
                    ].map((item, idx) => (
                        <div key={idx} className="p-6 rounded-3xl bg-muted/10 border border-white/5 flex flex-col items-center text-center group hover:bg-muted/20 transition-all duration-500 hover:-translate-y-1">
                            <div className={cn("p-4 rounded-2xl mb-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", `bg-${item.color}/10 text-${item.color}`)}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-black mb-1">{item.value || 0}</span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-10 pt-6 border-t border-border/10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-sm font-bold">{t('dashboard.stats.growthRate')}</p>
                        <p className="text-xs text-muted-foreground opacity-70">Month over month comparison</p>
                    </div>
                    {stats?.workspaces && formatGrowthRate(stats.workspaces.growthRate)}
                </div>
            </CardContent>
        </Card>
    )
}
