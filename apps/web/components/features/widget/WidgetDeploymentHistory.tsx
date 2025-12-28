'use client';

import { Rocket, RotateCcw, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

interface Deployment {
    id: string;
    version: string;
    deploymentType: 'publish' | 'rollback' | 'canary';
    previousVersion?: string;
    rollbackReason?: string;
    trafficPercentage: number;
    status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';
    deployedAt: string;
}

interface Props {
    deployments?: Deployment[];
    isLoading: boolean;
}

export function WidgetDeploymentHistory({ deployments, isLoading }: Props) {
    const getDeploymentIcon = (type: string) => {
        const iconClass = "w-5 h-5 transition-transform duration-500 group-hover:scale-110";
        switch (type) {
            case 'publish':
                return (
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                        <Rocket className={cn(iconClass, "text-blue-500")} />
                    </div>
                );
            case 'rollback':
                return (
                    <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 group-hover:bg-orange-500/20 transition-all">
                        <RotateCcw className={cn(iconClass, "text-orange-500")} />
                    </div>
                );
            case 'canary':
                return (
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                        <Activity className={cn(iconClass, "text-purple-500")} />
                    </div>
                );
            default:
                return (
                    <div className="p-2.5 bg-muted/20 rounded-xl border border-border/50 group-hover:bg-muted/30 transition-all">
                        <Rocket className={iconClass} />
                    </div>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        const badgeBase = "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 border transition-all duration-300";
        switch (status) {
            case 'deployed':
                return (
                    <div className={cn(badgeBase, "bg-green-500/10 text-green-600 border-green-500/20")}>
                        <div className="size-1 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </div>
                );
            case 'deploying':
                return (
                    <div className={cn(badgeBase, "bg-blue-500/10 text-blue-600 border-blue-500/20")}>
                        <Clock className="w-3 h-3 animate-spin" />
                        Syncing
                    </div>
                );
            case 'failed':
                return (
                    <div className={cn(badgeBase, "bg-destructive/10 text-destructive border-destructive/20")}>
                        <XCircle className="w-3 h-3" />
                        Terminated
                    </div>
                );
            case 'rolled_back':
                return (
                    <div className={cn(badgeBase, "bg-muted text-muted-foreground border-border/40")}>
                        <RotateCcw className="w-3 h-3" />
                        Reverted
                    </div>
                );
            default:
                return <Badge variant="outline" className="rounded-full text-[10px] font-bold">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="relative pl-14 opacity-50">
                        <div className="absolute left-0 top-1 w-12 h-12 rounded-2xl bg-muted/20 animate-pulse border border-border/50" />
                        <Card className="border border-border/40 shadow-xl bg-card/40 rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div className="h-6 w-1/3 bg-muted rounded-lg animate-pulse" />
                                    <div className="h-4 w-1/4 bg-muted/50 rounded-lg animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        );
    }

    if (!deployments || deployments.length === 0) {
        return (
            <Card className="border border-dashed border-border/60 bg-muted/5 rounded-[2rem]">
                <CardContent className="p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6 border border-border/50">
                        <Clock className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight mb-2">No Deployment Records</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                        This bot is currently in a pre-operational state. Initiate a sync to begin historical tracking.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
                {/* Timeline Axis */}
                <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-primary/30 via-border to-transparent" />

                <div className="space-y-8">
                    {deployments.map((deployment, idx) => (
                        <div key={deployment.id} className="relative pl-16 group">
                            {/* Deployment Icon / Marker */}
                            <div className="absolute left-0 top-1.5 z-10">
                                {getDeploymentIcon(deployment.deploymentType)}
                                {idx === 0 && (
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse" />
                                )}
                            </div>

                            <Card className="border border-border/40 shadow-xl group-hover:shadow-2xl transition-all duration-500 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden group-hover:-translate-y-1">
                                <div className={cn(
                                    "h-1.5 w-full bg-gradient-to-r transition-all duration-500",
                                    deployment.status === 'deployed' ? "from-primary/60 to-primary/10" : "from-muted/40 to-transparent"
                                )} />

                                <CardContent className="p-7">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <h3 className="font-black text-xl tracking-tight">
                                                    {deployment.deploymentType === 'publish' && 'Synchronized'}
                                                    {deployment.deploymentType === 'rollback' && 'Reverted to'}
                                                    {deployment.deploymentType === 'canary' && 'Canary Flux'}
                                                    {' '}
                                                    <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 ml-1">v{deployment.version}</span>
                                                </h3>
                                                {getStatusBadge(deployment.status)}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="size-3" />
                                                    {formatRelativeTime(deployment.deployedAt)}
                                                </div>
                                                {deployment.previousVersion && (
                                                    <div className="flex items-center gap-1.5 opacity-50">
                                                        <RotateCcw className="size-3" />
                                                        Previous: v{deployment.previousVersion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {deployment.trafficPercentage < 100 && (
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Flux Distribution</div>
                                                <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 text-sm font-black">
                                                    {deployment.trafficPercentage}% Operational
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {deployment.rollbackReason && (
                                        <div className="mt-6 p-5 bg-muted/30 border border-border/40 rounded-2xl relative overflow-hidden group/reason">
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover/reason:opacity-100 transition-opacity" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Reversion Logistics:</p>
                                            <p className="text-sm font-medium leading-relaxed">
                                                {deployment.rollbackReason}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
