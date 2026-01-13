'use client'

import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { FiDownload } from "react-icons/fi"
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardStatsCards } from '@/components/features/dashboard/DashboardStatsCards'
import { DashboardTopBots } from '@/components/features/dashboard/DashboardTopBots'
import { DashboardWorkspaceOverview } from '@/components/features/dashboard/DashboardWorkspaceOverview'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { DashboardCharts } from '@/components/features/dashboard/DashboardCharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/hooks/useAuth'

import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { DateRange } from "react-day-picker"
import { useState } from 'react'
import { subDays } from 'date-fns'

export function DashboardClient() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    const { data: stats, isLoading, error } = useDashboardStats(undefined, dateRange)

    if (isLoading) {
        return (
            <div className="w-full min-h-full pb-12">
                <div className="mb-10 px-2 animate-pulse">
                    <div className="h-10 w-64 bg-primary/5 rounded-2xl mb-3"></div>
                    <div className="h-5 w-80 bg-muted/20 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-card/40 rounded-3xl border border-primary/5 shadow-sm"></div>
                    ))}
                </div>
                <div className="h-[450px] bg-card/30 rounded-3xl border border-primary/5 shadow-sm mb-12"></div>
            </div>
        )
    }
    return (
        <div
            className="w-full min-h-full pb-12 bg-grid-pattern"
        >
            <div>
                <PageHeader
                    title={t('dashboard.title')}
                    description={t('dashboard.welcomeBack', { name: user?.name || t('welcome') })}
                    className="mb-10 px-2"
                >
                    <div className="flex items-center gap-2">
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                        <Button className="shadow-lg shadow-primary/10">
                            <FiDownload className="mr-2 h-4 w-4" />
                            {t('dashboard.downloadReport')}
                        </Button>
                    </div>
                </PageHeader>
            </div>

            {/* Stats Cards */}
            <DashboardStatsCards stats={stats} />

            {/* Professional Charts Section */}
            {stats && (
                <div className="mt-8">
                    <DashboardCharts
                        activityTrend={stats.activityTrend || []}
                        stats={stats}
                    />
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-8 lg:grid-cols-2 mt-12">
                <div>
                    <DashboardTopBots stats={stats} />
                </div>

                <div>
                    <DashboardWorkspaceOverview stats={stats} />
                </div>
            </div>
        </div>
    )
}
