'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Activity,
    History,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    RefreshCw,
    Loader2,
    FileText,
    Globe,
    Zap,
    Cpu,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { auditApi, AuditLog } from '@/lib/api/audit';
import { useAuth } from '@/lib/hooks/useAuth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export default function ActivityPage() {
    const { workspace } = useAuth();
    const { ref, inView } = useInView();

    const [search, setSearch] = useState('');
    const [querySearch, setQuerySearch] = useState('');
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        }
    }, []);

    const {
        data: infiniteData,
        isLoading: loading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['activity-logs', workspace?.id, querySearch],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            if (!workspace?.id) return { items: [], total: 0 };
            const { data } = await auditApi.getMyActivity(workspace.id, {
                page: pageParam as number,
                limit: 20,
                ...(querySearch ? { search: querySearch } : {})
            });
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            const currentTotal = allPages.reduce((acc, p) => acc + (p.items?.length || 0), 0);
            if (currentTotal < lastPage.total) {
                return allPages.length + 1;
            }
            return undefined;
        },
        enabled: !!workspace?.id,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const logs = infiniteData?.pages.flatMap(page => page.items || []) || [];

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'JOB_STARTED': return <Play className="w-4 h-4 text-blue-500" />;
            case 'JOB_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'JOB_FAILED': return <XCircle className="w-4 h-4 text-destructive" />;
            case 'CRAWL_STARTED': return <Globe className="w-4 h-4 text-indigo-500" />;
            case 'CRAWL_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'DOCUMENT_PROCESSING': return <Cpu className="w-4 h-4 text-amber-500" />;
            case 'CREATE': return <Zap className="w-4 h-4 text-yellow-500" />;
            default: return <Activity className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="page-container space-y-6">
            <PageHeader
                title="Activity Feed"
                description="Track your jobs, crawls, and system interactions in real-time."
                onRefresh={refetch}
                refreshing={loading}
            />
            <div className="space-y-6">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter activities..."
                            className="pl-9 bg-card/50"
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);

                                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                                searchTimerRef.current = setTimeout(() => {
                                    setQuerySearch(val);
                                }, 500);
                            }}
                        />
                    </div>
                    <Button variant="secondary" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="border-border/40 p-4">
                                <div className="flex gap-4 items-center">
                                    <Skeleton className="w-10 h-10 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </Card>
                        ))
                    ) : logs.length > 0 ? (
                        logs.map((log) => (
                            <Card key={log.id} className="border-border/40 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border shrink-0">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm tracking-tight">{formatAction(log.action)}</span>
                                            <Badge variant="outline" className="text-[10px] h-4 bg-muted/30">
                                                {log.resourceType}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium">
                                            {log.resourceId !== 'n/a' ? `Resource ID: ${log.resourceId}` : log.details?.url || 'System Action'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10">
                            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="font-bold text-lg mb-1">No activities found</h3>
                            <p className="text-muted-foreground text-sm">Activities you perform will appear here.</p>
                        </div>
                    )}
                </div>

                {/* Intersection Observer Target */}
                <div ref={ref} className="h-10 flex items-center justify-center">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-300">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-medium">Loading more activities...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
