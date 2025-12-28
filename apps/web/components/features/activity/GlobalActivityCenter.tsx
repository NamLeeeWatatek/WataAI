'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
    Activity,
    History,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Cpu,
    Globe,
    Zap,
    ExternalLink,
    X,
    Loader2
} from 'lucide-react';
import { auditApi, AuditLog } from '@/lib/api/audit';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/Progress';
import { ProductDetailsDialog } from '../products/ProductDetailsDialog';

export function GlobalActivityCenter() {
    const { workspace } = useAuth();
    const { activeJobs, removeJob, refreshJobs } = useCreationJobs();
    const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);

    const pendingCount = useMemo(() =>
        activeJobs.filter(j => j.status === CreationJobStatus.PENDING || j.status === CreationJobStatus.PROCESSING).length,
        [activeJobs]);

    const fetchHistory = useCallback(async () => {
        if (!workspace?.id) return;
        setLoadingHistory(true);
        try {
            const { data } = await auditApi.getMyActivity(workspace.id, {
                limit: 30
            });
            setHistoryLogs(data.items);
        } catch (error) {
            console.error('Failed to fetch activity history', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [workspace?.id]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'JOB_STARTED': return <Play className="w-3.5 h-3.5 text-blue-500" />;
            case 'JOB_COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
            case 'JOB_FAILED': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
            case 'CRAWL_STARTED': return <Globe className="w-3.5 h-3.5 text-indigo-500" />;
            case 'CRAWL_COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
            case 'DOCUMENT_PROCESSING': return <Cpu className="w-3.5 h-3.5 text-amber-500" />;
            case 'CREATE': return <Zap className="w-3.5 h-3.5 text-yellow-500" />;
            default: return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    };

    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative w-9 h-9 rounded-full hover:bg-primary/5 transition-all duration-300"
                        onClick={fetchHistory}
                    >
                        <Activity className={cn("w-4 h-4", pendingCount > 0 && "text-primary animate-pulse")} />
                        {pendingCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-bounce" />
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/40 backdrop-blur-xl bg-background/95">
                    <SheetHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <SheetTitle className="text-xl font-bold tracking-tight">System Activity</SheetTitle>
                            {pendingCount > 0 && (
                                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                                    {pendingCount} Active
                                </Badge>
                            )}
                        </div>
                        <SheetDescription>
                            Monitor real-time processes and review your activity history.
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="active" className="flex-1 flex flex-col mt-6 overflow-hidden">
                        <div className="px-6 mb-4">
                            <TabsList className="w-full h-10 bg-muted/50 p-1 border border-border/20 rounded-xl">
                                <TabsTrigger value="active" className="flex-1 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    Active Tasks
                                </TabsTrigger>
                                <TabsTrigger value="history" className="flex-1 rounded-lg text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    History Feed
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="active" className="flex-1 overflow-hidden m-0 border-none outline-none">
                            <ScrollArea className="h-full px-6">
                                <div className="space-y-4 pb-10">
                                    {activeJobs.length > 0 ? (
                                        activeJobs.map((job) => (
                                            <div key={job.id} className="group p-4 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/40 transition-all cursor-pointer overflow-hidden relative"
                                                onClick={() => job.status === CreationJobStatus.COMPLETED && setSelectedJob(job)}>

                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="min-w-0 pr-4">
                                                        <h5 className="font-bold text-xs uppercase tracking-wider text-primary truncate">
                                                            {job.creationTool?.name || 'Creation Process'}
                                                        </h5>
                                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-60">
                                                            ID: {job.id.split('-')[0]}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] h-4 px-1.5 uppercase font-bold tracking-tighter",
                                                                job.status === CreationJobStatus.COMPLETED && "bg-green-500/10 text-green-600 border-green-500/20",
                                                                job.status === CreationJobStatus.FAILED && "bg-destructive/10 text-destructive border-destructive/20",
                                                                (job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING) && "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
                                                            )}
                                                        >
                                                            {job.status}
                                                        </Badge>
                                                        {(job.status === CreationJobStatus.COMPLETED || job.status === CreationJobStatus.FAILED) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING ? (
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span className="text-muted-foreground tracking-tight">PROGRESS</span>
                                                            <span className="text-primary">{job.progress}%</span>
                                                        </div>
                                                        <Progress
                                                            value={job.progress}
                                                            className="h-1.5"
                                                            indicatorClassName="bg-gradient-to-r from-primary to-indigo-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium italic">
                                                            {job.status === CreationJobStatus.COMPLETED ? (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                    <span>Task finished successfully</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                                                                    <span>Task failed</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {job.status === CreationJobStatus.COMPLETED && <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                            <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mb-4 border border-border/20 grayscale opacity-40">
                                                <Zap className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-sm font-bold mb-1">No Active Tasks</h3>
                                            <p className="text-xs text-muted-foreground balance">
                                                When you start a job, crawl, or sync, it will appear here in real-time.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            {activeJobs.length > 0 && (
                                <div className="px-6 py-4 border-t border-border/10 bg-muted/5">
                                    <Button variant="outline" size="sm" className="w-full text-[10px] h-8 font-bold gap-2" onClick={() => refreshJobs()}>
                                        <RefreshCw className="w-3 h-3" />
                                        Update Progress
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="flex-1 overflow-hidden m-0 border-none outline-none flex flex-col">
                            <div className="px-6 mb-2 flex justify-end">
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 opacity-60 hover:opacity-100" onClick={fetchHistory} disabled={loadingHistory}>
                                    <RefreshCw className={cn("w-3 h-3", loadingHistory && "animate-spin")} />
                                    Refresh Feed
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 px-6">
                                <div className="space-y-2 pb-10">
                                    {loadingHistory ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-xl" />
                                        ))
                                    ) : historyLogs.length > 0 ? (
                                        historyLogs.map((log) => (
                                            <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/20 group">
                                                <div className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-tight truncate lowercase first-letter:uppercase">
                                                            {log.action.replace(/_/g, ' ')}
                                                        </span>
                                                        <Badge variant="outline" className="text-[8px] h-3 px-1 bg-muted/10 opacity-60">
                                                            {log.resourceType}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 opacity-40 grayscale">
                                            <History className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Feed is empty</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </SheetContent>
            </Sheet>

            <ProductDetailsDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open) => !open && setSelectedJob(null)}
            />
        </>
    );
}
