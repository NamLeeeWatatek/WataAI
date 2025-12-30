"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/Chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useTranslation } from 'react-i18next'
import type { DashboardStats } from "@/lib/types"

interface DashboardChartsProps {
  stats: DashboardStats
  activityTrend: Array<{ date: string; value: number }>
}

export function DashboardCharts({ stats, activityTrend }: DashboardChartsProps) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language === 'vi' ? 'vi-VN' : 'en-US'

  // Chart configurations
  const activityConfig = {
    value: {
      label: t('dashboard.charts.activity'),
      color: "hsl(var(--primary))",
    },
  }

  const botsConfig = {
    active: {
      label: t('dashboard.charts.active'),
      color: "hsl(142 76% 36%)",
    },
    inactive: {
      label: t('dashboard.charts.inactive'),
      color: "hsl(0 84% 60%)",
    },
  }

  const usersConfig = {
    value: {
      label: t('dashboard.charts.users'),
      color: "hsl(221 83% 53%)",
    },
  }

  // Prepare data
  const botsData = [
    { name: t('dashboard.charts.active'), value: stats.bots?.active || 0 },
    { name: t('dashboard.charts.inactive'), value: stats.bots?.inactive || 0 },
  ]

  const usersTrendData = stats.users?.trend?.map(item => ({
    date: new Date(item.date).toLocaleDateString(currentLang, { month: 'short', day: 'numeric' }),
    value: item.value,
  })) || []

  const activityData = activityTrend?.map(item => ({
    date: new Date(item.date).toLocaleDateString(currentLang, { month: 'short', day: 'numeric' }),
    value: item.value,
  })) || []

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Activity Trend Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t('dashboard.charts.activityTrend')}</CardTitle>
          <CardDescription>{t('dashboard.charts.activityTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityConfig} className="h-[300px] w-full">
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bots Status Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t('dashboard.charts.botsStatus')}</CardTitle>
          <CardDescription>{t('dashboard.charts.botsStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={botsConfig} className="h-[300px] w-full">
            <BarChart data={botsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Users Growth Chart */}
      <Card className="md:col-span-2 overflow-hidden">
        <CardHeader>
          <CardTitle>{t('dashboard.charts.userGrowth')}</CardTitle>
          <CardDescription>{t('dashboard.charts.userGrowthDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={usersConfig} className="h-[300px] w-full">
            <LineChart data={usersTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
