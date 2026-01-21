import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { useSocketConnection } from '@/lib/hooks/use-socket-connection';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDebounce } from '../useDebounce';
import type { CreationJob } from '@/lib/types/creation-job';
import { DateRange } from 'react-day-picker';

export const jobKeys = {
    all: ['my-products'] as const,
    list: (params: any) => [...jobKeys.all, params] as const,
};

export function useCreationJobs(initialParams: {
    page?: number;
    pageSize?: number;
    dateRange?: DateRange;
    statusFilter?: string[];
    searchFilter?: string;
} = {}) {
    const [page, setPage] = useState(initialParams.page || 1);
    const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(initialParams.dateRange);
    const [statusFilter, setStatusFilter] = useState<string[]>(initialParams.statusFilter || []);
    const [searchFilter, setSearchFilter] = useState<string>(initialParams.searchFilter || "");

    const queryClient = useQueryClient();
    const { user, accessToken } = useAuth();

    const debouncedSearch = useDebounce(searchFilter, 500);

    // Reset to page 1 when search changes
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [debouncedSearch, page]);

    const queryParams = {
        page,
        limit: pageSize,
        sort: 'createdAt:desc',
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        status: statusFilter,
        search: debouncedSearch,
    };

    const { data: jobsData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: jobKeys.list(queryParams),
        queryFn: () => creationJobsApi.findAll(queryParams),
        placeholderData: keepPreviousData,
        staleTime: 30000,
    });

    // Handle real-time updates via socket
    const { on, isConnected } = useSocketConnection({
        namespace: 'notifications',
        enabled: !!user?.id && !!accessToken,
        auth: { token: accessToken },
        query: { userId: user?.id },
    });

    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = on('new_notification', (notification: any) => {
            if (notification.type === 'job_progress') {
                const updatedJobData = notification.data;
                if (!updatedJobData || !updatedJobData.jobId) return;

                // Update ALL lists that might contain this job
                queryClient.setQueriesData({ queryKey: jobKeys.all }, (oldData: any) => {
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

                    return { ...oldData, data: newJobs };
                });
            } else if (notification.type === 'job_created' || notification.type === 'success' || notification.type === 'error') {
                // Invalidate all product queries to get fresh data/statuses
                queryClient.invalidateQueries({ queryKey: jobKeys.all });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isConnected, on, queryClient]);

    const deleteJob = useCallback(async (id: string) => {
        try {
            await creationJobsApi.remove(id);
            queryClient.invalidateQueries({ queryKey: jobKeys.all });
            return true;
        } catch (err) {
            console.error('Failed to delete job:', err);
            return false;
        }
    }, [queryClient]);

    return {
        jobs: jobsData?.data || [],
        total: jobsData?.total || 0,
        hasNextPage: jobsData?.hasNextPage || false,
        isLoading,
        isRefetching,
        page,
        pageSize,
        dateRange,
        statusFilter,
        searchFilter,
        setPage,
        setPageSize,
        setDateRange,
        setStatusFilter,
        setSearchFilter,
        refresh: refetch,
        deleteJob,
    };
}
