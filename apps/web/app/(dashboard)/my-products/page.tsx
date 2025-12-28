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
import { wsService } from '@/lib/services/websocket-service';
import { useAuth } from '@/lib/hooks/useAuth';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '@/components/ui/PageHeader';

export default function MyProductsPage() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const { data: jobsData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['my-products', page, pageSize],
        queryFn: () => creationJobsApi.findAll({
            page,
            limit: pageSize,
            sort: 'createdAt:desc'
        }),
        placeholderData: keepPreviousData,
    });

    const jobs = jobsData?.data || [];
    const total = jobsData?.total || 0;
    const hasNextPage = jobsData?.hasNextPage || false;


    const { user, accessToken } = useAuth();
    const session = { user: { id: user?.id, ...user }, accessToken };

    useEffect(() => {
        if (!session?.user?.id || !(session as any)?.accessToken) return;

        wsService.connect('notifications', {
            token: (session as any).accessToken,
            userId: session.user.id
        });

        const unsubscribe = wsService.on('notifications', 'new_notification', (notification: any) => {
            if (notification.type === 'job_progress') {
                const updatedJobData = notification.data;

                queryClient.setQueryData(['my-products', page, pageSize], (oldData: any) => {
                    if (!oldData || !oldData.data) return oldData;

                    const prevJobs = oldData.data as CreationJob[];
                    const jobIndex = prevJobs.findIndex(j => j.id === updatedJobData.jobId);
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
            }
        });

        return () => {
            unsubscribe();
        };
    }, [session, queryClient, page, pageSize]);

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
                    <div className="border rounded-xl p-1 flex items-center gap-1 bg-muted/20">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 px-3 rounded-lg"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4 mr-1.5" />
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 px-3 rounded-lg"
                            onClick={() => setViewMode('table')}
                        >
                            <List className="w-4 h-4 mr-1.5" />
                            Table
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
                />
            )}
        </div>
    );
}
