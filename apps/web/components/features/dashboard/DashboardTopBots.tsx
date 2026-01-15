import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

import { Activity } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DashboardStats } from "@/lib/types"

interface DashboardTopBotsProps {
    stats: DashboardStats | undefined
}

export function DashboardTopBots({ stats }: DashboardTopBotsProps) {
    const { t } = useTranslation()

    return (
        <Card className="h-full">
            <CardHeader className="border-b border-border/10 px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full shadow-sm" />
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">
                            {t('dashboard.stats.topPerformingBots')}
                        </CardTitle>
                        <CardDescription className="text-sm opacity-70">
                            {t('dashboard.stats.botsMostConversations')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="space-y-6">
                    {stats?.topBots && stats.topBots.length > 0 ? (
                        stats.topBots.slice(0, 3).map((bot, index) => (
                            <div key={bot.id} className="group cursor-pointer">
                                <div className="flex items-center gap-5 mb-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                                        index === 0 ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-orange-500/30" :
                                            index === 1 ? "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-slate-500/30" :
                                                index === 2 ? "bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 shadow-amber-700/30" :
                                                    "bg-gradient-to-br from-primary via-primary/80 to-accent shadow-primary/30"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold truncate group-hover:text-primary transition-colors">{bot.name}</p>
                                        <p className="text-xs font-bold text-muted-foreground/80">
                                            {bot.count} {t('dashboard.stats.conversationsLabel')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{bot.metric?.toFixed(1)}%</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">{t('dashboard.stats.success')}</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${bot.metric || 0}%`, transition: 'width 1.5s ease-out' }}
                                        className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 shadow-[0_0_10px_rgba(139,92,246,0.3)] duration-700"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                            <Activity className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">{t('dashboard.stats.noDataAvailable')}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
