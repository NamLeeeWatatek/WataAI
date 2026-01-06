'use client';

import { useRef, useEffect, useState } from 'react';
import { ProductsGrid } from '@/components/features/products/ProductsGrid';
import { ProductsTable } from '@/components/features/products/ProductsTable';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { CreationJob } from '@/lib/types/creation-job';
import { Package, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSocketConnection } from '@/lib/hooks/use-socket-connection';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '@/components/ui/PageHeader';

import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MyProductsPage() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [searchFilter, setSearchFilter] = useState<string>("");

    const queryClient = useQueryClient();

    const { data: jobsData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['my-products', page, pageSize, dateRange, statusFilter, searchFilter],
        queryFn: () => creationJobsApi.findAll({
            page,
            limit: pageSize,
            sort: 'createdAt:desc',
            startDate: dateRange?.from?.toISOString(),
            endDate: dateRange?.to?.toISOString(),
            status: statusFilter,
            search: searchFilter,
        }),
        placeholderData: keepPreviousData,
    });

    const jobs = jobsData?.data || [];
    const total = jobsData?.total || 0;
    const hasNextPage = jobsData?.hasNextPage || false;


    const { user, accessToken } = useAuth();

    // Use the custom hook for socket connection to ensure consistency with other components
    // and automatic reconnection/auth handling
    const { on, isConnected } = useSocketConnection({
        namespace: 'notifications',
        enabled: !!user?.id && !!accessToken,
        auth: { token: accessToken },
        query: { userId: user?.id },
    });

    useEffect(() => {
        if (!isConnected) return;

        const handleNotification = (notification: any) => {
            // We are interested in job_progress and also job_created (to add new item potentially)
            // For now, focusing on job_progress as requested
            if (notification.type === 'job_progress') {
                const updatedJobData = notification.data;
                if (!updatedJobData || !updatedJobData.jobId) return;

                console.log('Realtime update for job:', updatedJobData.jobId, updatedJobData.progress);

                queryClient.setQueryData(['my-products', page, pageSize], (oldData: any) => {
                    if (!oldData || !oldData.data) return oldData;

                    const prevJobs = oldData.data as CreationJob[];
                    const jobIndex = prevJobs.findIndex(j => j.id === updatedJobData.jobId);

                    // If job not found in current page, we might ideally want to invalidate queries 
                    // or just ignore. For now, ignore.
                    if (jobIndex === -1) return oldData;

                    const newJobs = [...prevJobs];
                    newJobs[jobIndex] = {
                        ...newJobs[jobIndex],
                        progress: updatedJobData.progress,
                        status: updatedJobData.status,
                        outputData: updatedJobData.outputData,
                        error: updatedJobData.error,
                        updatedAt: new Date().toISOString()
                    };

                    return {
                        ...oldData,
                        data: newJobs
                    };
                });
            } else if (notification.type === 'job_created') {
                // Optional: Invalidate query to fetch new job if it belongs on page 1
                // But simply refetching page 1 might disturb user if they are paginating
                // For "My Products", if we are on page 1, we might want to see it.
                if (page === 1) {
                    refetch();
                }
            }
        };

        const unsubscribe = on('new_notification', handleNotification);

        return () => {
            unsubscribe();
        };
    }, [isConnected, on, page, pageSize, queryClient, refetch]);

    const handleRefresh = () => {
        refetch();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        setPage(newPage);
    };

    const handleDelete = async (id: string) => {
        try {
            queryClient.setQueryData(['my-products', page, pageSize], (oldData: any) => {
                if (!oldData?.data) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.filter((job: CreationJob) => job.id !== id)
                };
            });

            await creationJobsApi.remove(id);
            toast.success("Job deleted");
        } catch (err) {
            toast.error("Failed to delete job");
            refetch();
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Products"
                description="Manage and view your generated content and products."
                onRefresh={handleRefresh}
                refreshing={isLoading || isRefetching}
            >
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    <div className="border border-border/40 rounded-lg p-1 flex items-center gap-1 bg-muted/20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-md transition-all",
                                viewMode === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </PageHeader>

            {viewMode === 'grid' ? (
                <>
                    <ProductsGrid
                        jobs={jobs}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onRefresh={handleRefresh}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                    <div className="mt-4">
                        <Pagination
                            pagination={{
                                page,
                                limit: pageSize,
                                total: total,
                                totalPages: Math.ceil(total / pageSize),
                                hasNextPage
                            }}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[10, 20, 30, 50]}
                            className="justify-end"
                        />
                    </div>
                </>
            ) : (
                <ProductsTable
                    jobs={jobs}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    onRefresh={handleRefresh}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    pagination={{
                        page,
                        limit: pageSize,
                        total: total,
                        totalPages: Math.ceil(total / pageSize),
                        hasNextPage
                    }}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20, 30, 50]}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    searchFilter={searchFilter}
                    onSearchChange={setSearchFilter}
                />
            )}
        </div>
    );
}
