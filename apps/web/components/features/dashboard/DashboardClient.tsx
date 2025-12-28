'use client'

import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { FiDownload } from "react-icons/fi"
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion } from 'framer-motion'
import { DashboardStatsCards } from '@/components/features/dashboard/DashboardStatsCards'
import { DashboardTopBots } from '@/components/features/dashboard/DashboardTopBots'
import { DashboardWorkspaceOverview } from '@/components/features/dashboard/DashboardWorkspaceOverview'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { DashboardCharts } from '@/components/features/dashboard/DashboardCharts'
import { AlertTriangle, Database, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/lib/hooks/useAuth'

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export function DashboardClient() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const { data: stats, isLoading, error } = useDashboardStats()

    if (isLoading) {
        return (
            <div className="w-full min-h-full pb-12">
                <div className="mb-10 px-1 animate-pulse">
                    <div className="h-8 w-48 bg-muted/40 rounded-lg mb-2"></div>
                    <div className="h-4 w-64 bg-muted/30 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted/20 rounded-2xl border border-border/40"></div>
                    ))}
                </div>
                <div className="h-96 bg-muted/10 rounded-2xl border border-border/40 mb-12"></div>
            </div>
        )
    }
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full min-h-full pb-12 bg-grid-pattern"
        >
            <motion.div variants={itemVariants}>
                <PageHeader
                    title={t('dashboard.title')}
                    description={t('dashboard.welcomeBack', { name: user?.name || 'User' })}
                    icon={LayoutDashboard}
                    className="mb-10 px-1"
                >
                    <Button variant="outline" rounded="xl" className="glass shadow-lg hover:shadow-xl transition-all duration-300">
                        <FiDownload className="mr-2 h-4 w-4" />
                        {t('dashboard.downloadReport')}
                    </Button>
                </PageHeader>
            </motion.div>

            {/* Stats Cards */}
            <DashboardStatsCards stats={stats} itemVariants={itemVariants} />

            {/* Professional Charts Section */}
            {stats && (
                <motion.div variants={itemVariants} className="mt-8">
                    <DashboardCharts
                        activityTrend={stats.activityTrend || []}
                        stats={stats}
                    />
                </motion.div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-8 lg:grid-cols-2 mt-12">
                <motion.div variants={itemVariants}>
                    <DashboardTopBots stats={stats} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <DashboardWorkspaceOverview stats={stats} />
                </motion.div>
            </div>
        </motion.div>
    )
}
