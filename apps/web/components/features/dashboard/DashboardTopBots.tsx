import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { motion } from 'framer-motion'
import { FiActivity } from "react-icons/fi"
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from "@/lib/types"

interface DashboardTopBotsProps {
    stats: DashboardStats | undefined
}

export function DashboardTopBots({ stats }: DashboardTopBotsProps) {
    const { t } = useTranslation()

    return (
        <Card variant="glass" className="h-full border-white/5 shadow-xl">
            <CardHeader className="border-b border-border/10 px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
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
                        stats.topBots.slice(0, 3).map((bot: any, index: number) => (
                            <div key={bot.id} className="group cursor-pointer">
                                <div className="flex items-center gap-5 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold truncate group-hover:text-primary transition-colors">{bot.name}</p>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {bot.count} {t('dashboard.stats.conversationsLabel')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-success">{bot.metric?.toFixed(1)}%</p>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-70">{t('dashboard.stats.success')}</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${bot.metric || 0}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-primary to-success"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                            <FiActivity className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">{t('dashboard.stats.noDataAvailable')}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
