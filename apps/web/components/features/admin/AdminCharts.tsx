"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/Chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Line, LineChart } from "recharts"
import { motion } from "framer-motion"

interface AdminChartsProps {
    stats: any
}

export function AdminCharts({ stats }: AdminChartsProps) {
    // Activity Trend Configuration
    const activityConfig = {
        value: {
            label: "System Actions",
            color: "hsl(var(--primary))",
        },
    }

    // Job Success Rate Configuration
    const jobsConfig = {
        successful: {
            label: "Successful",
            color: "hsl(142 76% 36%)",
        },
        failed: {
            label: "Failed",
            color: "hsl(0 84% 60%)",
        },
    }

    // Prepare Activity Trend Data
    const activityData = stats?.activityTrend?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: item.value,
    })) || []

    // Prepare Jobs Data (Pie Chart)
    const jobsData = [
        { name: "Successful", value: stats?.jobs?.successful || 0, fill: "hsl(var(--success))" },
        { name: "Failed", value: stats?.jobs?.failed || 0, fill: "hsl(var(--destructive))" },
    ]

    // Top Tools Data
    const toolsData = stats?.topCreationTools?.map((tool: any) => ({
        name: tool.name,
        count: tool.count,
    })) || []

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            {/* System Activity trend - Full Width on Mobile, 2 cols on Large */}
            <motion.div variants={itemVariants} className="md:col-span-2">
                <Card className="glass border-border/40 shadow-xl overflow-hidden group">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">System-wide Activity</CardTitle>
                                <CardDescription>Global user interaction and job processing trend</CardDescription>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ChartContainer config={activityConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Job Health (Pie Chart) */}
            <motion.div variants={itemVariants}>
                <Card className="glass border-border/40 shadow-xl overflow-hidden flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Job Health</CardTitle>
                        <CardDescription>Success vs Failure distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center pb-8">
                        <ChartContainer config={jobsConfig} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={jobsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {jobsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="flex gap-4 text-sm font-medium mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-success" />
                                <span>Success: {stats?.jobs?.successRate}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-destructive" />
                                <span>Failed: {stats?.jobs?.failed}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Top Creation Tools (Bar Chart) */}
            <motion.div variants={itemVariants} className="md:col-span-3">
                <Card className="glass border-border/40 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Tool Performance</CardTitle>
                        <CardDescription>Top creation tools by generation volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={toolsData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted/50" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 13, fontWeight: 500 }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar
                                        dataKey="count"
                                        radius={[0, 4, 4, 0]}
                                        fill="hsl(var(--primary))"
                                        barSize={30}
                                    >
                                        {toolsData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
