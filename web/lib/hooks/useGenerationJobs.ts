import { useQuery } from '@tanstack/react-query';
import { generationJobsApi } from '@/lib/api/generation-jobs';
import { GenerationJob } from '@/lib/types/generation-job';

export const generationJobKeys = {
    all: ['generation-jobs'] as const,
    lists: () => [...generationJobKeys.all, 'list'] as const,
    list: (params?: any) => [...generationJobKeys.lists(), params] as const,
    details: () => [...generationJobKeys.all, 'detail'] as const,
    detail: (id: string) => [...generationJobKeys.details(), id] as const,
};

export function useGenerationJobs(params?: any) {
    const {
        data: result,
        isLoading: loading,
        error,
        refetch: refresh
    } = useQuery({
        queryKey: generationJobKeys.list(params),
        queryFn: () => generationJobsApi.findAll(params),
    });

    return {
        jobs: result?.data || [],
        hasNextPage: result?.hasNextPage || false,
        loading,
        error,
        refresh,
    };
}

export function useGenerationJob(id: string) {
    return useQuery({
        queryKey: generationJobKeys.detail(id),
        queryFn: () => generationJobsApi.findOne(id),
        enabled: !!id,
    });
}
