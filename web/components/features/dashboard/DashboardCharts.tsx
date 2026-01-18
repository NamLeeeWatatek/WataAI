"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/shared/Chart"
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
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t('dashboard.charts.activityTrend')}</CardTitle>
          <CardDescription>{t('dashboard.charts.activityTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityConfig} className="h-[300px] w-full">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={<ChartTooltipContent className="bg-background/90 border-border/50 backdrop-blur-md shadow-xl" />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bots Status Chart */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t('dashboard.charts.botsStatus')}</CardTitle>
          <CardDescription>{t('dashboard.charts.botsStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={botsConfig} className="h-[300px] w-full">
            <BarChart data={botsData} barSize={40}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={<ChartTooltipContent className="bg-background/90 border-border/50 backdrop-blur-md shadow-xl" />}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                fill="url(#barGradient)"
                animationDuration={1500}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Users Growth Chart */}
      <Card className="md:col-span-2 overflow-hidden border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t('dashboard.charts.userGrowth')}</CardTitle>
          <CardDescription>{t('dashboard.charts.userGrowthDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={usersConfig} className="h-[300px] w-full">
            <LineChart data={usersTrendData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent className="bg-background/90 border-border/50 backdrop-blur-md shadow-xl" />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2, stroke: "hsl(var(--chart-1))" }}
                activeDot={{ r: 6, fill: "hsl(var(--chart-1))", strokeWidth: 0, className: "animate-pulse" }}
                animationDuration={2000}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
