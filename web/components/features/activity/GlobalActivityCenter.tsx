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
import { CreationJob, CreationJobStatus } from '../../../lib/types/creation-job';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProductDetailsDialog } from '../products/ProductDetailsDialog';
import { useTranslation } from 'react-i18next';

export function GlobalActivityCenter() {
    const { workspace } = useAuth();
    const { activeJobs, removeJob, refreshJobs, cancelJob } = useCreationJobs();
    const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);
    const { t } = useTranslation();

    const pendingCount = useMemo(() =>
        activeJobs.filter(j => j.status === CreationJobStatus.PENDING || j.status === CreationJobStatus.PROCESSING).length,
        [activeJobs]);

    const fetchHistory = useCallback(async () => {
        if (!workspace?.id) return;
        setLoadingHistory(true);
        try {
            const response = await auditApi.getMyActivity(workspace.id, {
                limit: 30
            }) as any;
            setHistoryLogs(response?.items || []);
        } catch (error) {
            console.error('Failed to fetch activity history', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [workspace?.id]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'JOB_STARTED': return <Play className="w-3.5 h-3.5 text-info" />;
            case 'JOB_COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
            case 'JOB_FAILED': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
            case 'CRAWL_STARTED': return <Globe className="w-3.5 h-3.5 text-primary" />;
            case 'CRAWL_COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
            case 'DOCUMENT_PROCESSING': return <Cpu className="w-3.5 h-3.5 text-warning" />;
            case 'CREATE': return <Zap className="w-3.5 h-3.5 text-warning" />;
            default: return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

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
                <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col border-l border-border/40 backdrop-blur-xl bg-background/95">
                    <SheetHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <SheetTitle className="text-xl font-bold tracking-tight" suppressHydrationWarning>{t('globalActivity.title')}</SheetTitle>
                            {pendingCount > 0 && (
                                <Badge className="animate-pulse border-none px-3 py-1">
                                    {pendingCount} <span suppressHydrationWarning>{t('globalActivity.active')}</span>
                                </Badge>
                            )}
                        </div>
                        <SheetDescription suppressHydrationWarning>
                            {t('globalActivity.description')}
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="active" className="flex-1 flex flex-col mt-6 overflow-hidden">
                        <div className="px-6 mb-4">
                            <TabsList variant="pills" className="w-full justify-start">
                                <TabsTrigger value="active" variant="pills" className="flex-1 text-xs font-bold" suppressHydrationWarning>
                                    {t('globalActivity.tabs.activeTasks')}
                                </TabsTrigger>
                                <TabsTrigger value="history" variant="pills" className="flex-1 text-xs font-bold" suppressHydrationWarning>
                                    {t('globalActivity.tabs.historyFeed')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="active" className="flex-1 overflow-hidden m-0 border-none outline-none flex flex-col">
                            <ScrollArea className="flex-1 px-6">
                                <div className="space-y-3 pb-10 mt-2">
                                    {activeJobs.length > 0 ? (
                                        activeJobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="group relative p-4 rounded-xl border border-border/30 bg-card/40 hover:bg-card/60 hover:border-border/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm"
                                                onClick={() => job.status === CreationJobStatus.COMPLETED && setSelectedJob(job)}
                                            >
                                                {/* Left accent border for active/processing jobs */}
                                                {(job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING) && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary animate-pulse" />
                                                )}

                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <div className={cn(
                                                                "p-1 rounded-md shrink-0",
                                                                job.status === CreationJobStatus.COMPLETED ? "bg-success/10 text-success" :
                                                                    job.status === CreationJobStatus.FAILED ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                                            )}>
                                                                {job.status === CreationJobStatus.COMPLETED ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                                    job.status === CreationJobStatus.FAILED ? <XCircle className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />}
                                                            </div>
                                                            <h5 className="font-bold text-sm tracking-tight text-foreground/90 truncate mr-2">
                                                                {job.creationTool?.name || <span suppressHydrationWarning>{t('globalActivity.systemProcess')}</span>}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium ml-7 opacity-60">
                                                            <span className="bg-muted px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">ID: {job.id.split('-')[0]}</span>
                                                            {job.createdAt && <span className="truncate opacity-80">• {format(new Date(job.createdAt), 'HH:mm')}</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className="flex items-center gap-1.5 order-2">
                                                            {job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-7 h-7 text-destructive/90 hover:text-destructive hover:bg-destructive/15 rounded-full transition-all bg-destructive/10 shrink-0"
                                                                    onClick={(e) => { e.stopPropagation(); cancelJob(job.id); }}
                                                                    title="Cancel Job"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-7 h-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                                                    onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                                                                    title="Remove from history"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] h-5 px-2 uppercase font-bold tracking-wider order-1 shrink-0",
                                                                job.status === CreationJobStatus.COMPLETED ? "border-success/30 text-success bg-success/5 shadow-[0_0_10px_rgba(var(--success),0.05)]" :
                                                                    job.status === CreationJobStatus.FAILED ? "border-destructive/30 text-destructive bg-destructive/5" :
                                                                        job.status === CreationJobStatus.CANCELED ? "border-muted-foreground/30 text-muted-foreground bg-muted/5" :
                                                                            "border-primary/30 text-primary bg-primary/5 shadow-[0_0_10px_rgba(var(--primary),0.05)]"
                                                            )}
                                                        >
                                                            {job.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING ? (
                                                    <div className="mt-2 space-y-2 ml-7">
                                                        <div className="flex justify-between items-end text-[10px]">
                                                            <span className="text-muted-foreground uppercase font-black tracking-widest opacity-40 text-[8px]" suppressHydrationWarning>{t('globalActivity.currentProgress')}</span>
                                                            <span className="text-primary font-mono font-bold">{job.progress}%</span>
                                                        </div>
                                                        <div className="relative h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-700 ease-in-out"
                                                                style={{ width: `${job.progress}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 animate-shimmer scale-x-150 origin-left" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between text-xs mt-1 ml-7">
                                                        <div className="flex items-center gap-2">
                                                            {job.status === CreationJobStatus.COMPLETED ? (
                                                                <span className="text-success/80 font-semibold flex items-center gap-1.5 text-[11px]" suppressHydrationWarning>
                                                                    {t('globalActivity.status.completed')}
                                                                </span>
                                                            ) : job.status === CreationJobStatus.FAILED ? (
                                                                <span className="text-destructive/80 font-medium text-[11px]" suppressHydrationWarning>
                                                                    {t('globalActivity.status.failed')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground/60 text-[11px]" suppressHydrationWarning>
                                                                    {t('globalActivity.status.stopped')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {job.status === CreationJobStatus.COMPLETED && (
                                                            <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                                                <span suppressHydrationWarning>{t('globalActivity.viewResult')}</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center mb-6 border border-border/10 shadow-inner">
                                                <Zap className="w-10 h-10 text-muted-foreground/30" />
                                            </div>
                                            <h3 className="text-base font-bold text-foreground/80 mb-2" suppressHydrationWarning>{t('globalActivity.empty.title')}</h3>
                                            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed" suppressHydrationWarning>
                                                {t('globalActivity.empty.desc')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {activeJobs.length > 0 && (
                                <div className="px-6 py-4 border-t border-border/10 bg-muted/5 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 text-[10px] h-9 font-bold gap-2 rounded-xl" onClick={() => refreshJobs()}>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span suppressHydrationWarning>{t('globalActivity.actions.updateAll')}</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="px-4 text-[10px] h-9 font-bold rounded-xl" onClick={() => refreshJobs()}>
                                        <span suppressHydrationWarning>{t('globalActivity.actions.refresh')}</span>
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="flex-1 overflow-hidden m-0 border-none outline-none flex flex-col">
                            <div className="px-6 mb-2 flex justify-end">
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 opacity-60 hover:opacity-100" onClick={fetchHistory} disabled={loadingHistory}>
                                    <RefreshCw className={cn("w-3 h-3", loadingHistory && "animate-spin")} />
                                    <span suppressHydrationWarning>{t('globalActivity.actions.refreshFeed')}</span>
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
                                            <p className="text-xs font-bold uppercase tracking-widest" suppressHydrationWarning>{t('globalActivity.empty.feedEmpty')}</p>
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
