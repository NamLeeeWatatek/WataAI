import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api/workflows';
import { toast } from 'sonner';

export const workflowKeys = {
    all: ['workflows'] as const,
    lists: () => [...workflowKeys.all, 'list'] as const,
    details: () => [...workflowKeys.all, 'detail'] as const,
    detail: (id: string) => [...workflowKeys.details(), id] as const,
};

export function useWorkflows(params?: any) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: workflowKeys.lists(),
        queryFn: () => workflowsApi.getAll(params),
    });

    return query;
}

export function useWorkflow(id: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: workflowKeys.detail(id),
        queryFn: () => workflowsApi.getOne(id),
        enabled: !!id,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => workflowsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workflowKeys.detail(id) });
            toast.success('Workflow saved');
        },
        onError: () => {
            toast.error('Failed to save workflow');
        }
    });

    return {
        ...query,
        update: updateMutation.mutateAsync,
        isSaving: updateMutation.isPending
    };
}
