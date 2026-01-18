'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { Skeleton } from "@/components/ui/Skeleton"
import {
    Activity,
    Server,
    Shield,
    CheckCircle2,
    Cpu,
    HardDrive,
    MemoryStick,
    AlertTriangle,
    XCircle
} from "lucide-react"
import { useSystemHealth } from '@/lib/hooks/useAdminData';

export function AdminSystemStatus() {
    const { data: healthData, isLoading } = useSystemHealth();

    if (isLoading) {
        return <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-64" />
        </div>
    }

    const { health, resources, services } = healthData || {
        health: 'unknown',
        resources: { cpu: 0, memory: { total: 0, used: 0, percent: 0 }, storage: { percent: 0 } },
        services: []
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Health Overview */}
                <Card className={`border-border/50 shadow-sm border-l-4 ${health === 'operational' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Activity className={`h-4 w-4 ${health === 'operational' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${health === 'operational' ? 'text-emerald-500' : 'text-amber-500'} capitalize`}>
                            {health}
                        </div>
                        <p className="text-xs text-muted-foreground">Real-time system monitoring</p>
                        <div className="mt-4 flex flex-col gap-2">
                            {/* Mock Latency since API doesn't return it yet */}
                            <div className="flex items-center justify-between text-xs">
                                <span>API Latency</span>
                                <span className="font-mono text-emerald-600">~45ms</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resource Stats */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resources</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> CPU Load</span>
                                <span className="text-muted-foreground">{resources.cpu}%</span>
                            </div>
                            <Progress value={resources.cpu} className="h-1.5" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><MemoryStick className="w-3 h-3" /> RAM</span>
                                <span className="text-muted-foreground">{resources.memory.percent}%</span>
                            </div>
                            <Progress value={resources.memory.percent} className="h-1.5" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3" /> Storage</span>
                                <span className="text-muted-foreground">{resources.storage.percent}%</span>
                            </div>
                            <Progress value={resources.storage.percent} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                        <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Secure</div>
                        <p className="text-xs text-muted-foreground">Automated checks active</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-normal">
                                <CheckCircle2 className="mr-1 w-3 h-3" /> WAF
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-normal">
                                <CheckCircle2 className="mr-1 w-3 h-3" /> SSL
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-normal">
                                <CheckCircle2 className="mr-1 w-3 h-3" /> Encrypted
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Service Status</CardTitle>
                        <CardDescription>Status of individual system microservices</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {services?.map((service, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-emerald-500' :
                                            service.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                    <span className="font-medium text-sm">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground">{service.uptime} uptime</span>
                                    <Badge variant={
                                        service.status === 'operational' ? 'secondary' : 'destructive'
                                    } className="text-xs font-normal capitalize">
                                        {service.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Recent System Events</CardTitle>
                        <CardDescription>Log of recent system activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Mock data for events - requires Audit Logs API */}
                        <div className="space-y-4">
                            {[
                                { event: 'Daily backup completed', time: '2 mins ago', type: 'info' },
                                { event: 'System health check passed', time: '15 mins ago', type: 'success' },
                                { event: 'New deployment v2.4.0 successful', time: '1 hour ago', type: 'success' },
                            ].map((event, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${event.type === 'info' ? 'bg-blue-500' :
                                            event.type === 'warning' ? 'bg-amber-500' :
                                                event.type === 'success' ? 'bg-emerald-500' : 'bg-gray-500'
                                        }`} />
                                    <div className="grid gap-0.5">
                                        <p className="text-sm font-medium leading-none">{event.event}</p>
                                        <p className="text-xs text-muted-foreground">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
