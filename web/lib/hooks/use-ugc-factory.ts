'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ugcApi, RunUgcDto, Execution, ExecutionArtifact } from '@/lib/api/ugc';
import toast from '@/lib/toast';
import { useUiStore } from '@/lib/store/zustand/ui-store';

export const ugcKeys = {
    all: ['ugc'] as const,
    executions: (flowId: string) => [...ugcKeys.all, 'executions', flowId] as const,
    artifacts: (executionId: string) => [...ugcKeys.all, 'artifacts', executionId] as const,
};

export function useUgcFactory(flowId?: string) {
    const queryClient = useQueryClient();
    const { setGlobalLoading } = useUiStore();

    const executionsQuery = useQuery({
        queryKey: ugcKeys.executions(flowId || ''),
        queryFn: () => ugcApi.getExecutions(flowId || ''),
        enabled: !!flowId,
    });

    const generateMutation = useMutation({
        onMutate: () => setGlobalLoading('ugc-generate', true, 'Generating content...'),
        mutationFn: (data: RunUgcDto) => ugcApi.generate(data),
        onSuccess: () => {
            if (flowId) {
                queryClient.invalidateQueries({ queryKey: ugcKeys.executions(flowId) });
            }
            toast.success('Generation started');
        },
        onSettled: () => setGlobalLoading('ugc-generate', false),
    });

    return {
        executions: executionsQuery.data || [],
        isLoading: executionsQuery.isLoading,
        generate: generateMutation.mutateAsync,
        isGenerating: generateMutation.isPending,
        refreshExecutions: executionsQuery.refetch,
    };
}

export function useExecutionArtifacts(executionId?: string) {
    const queryClient = useQueryClient();
    const { setGlobalLoading } = useUiStore();

    const artifactsQuery = useQuery({
        queryKey: ugcKeys.artifacts(executionId || ''),
        queryFn: () => ugcApi.getExecutionArtifacts(executionId || ''),
        enabled: !!executionId,
    });

    const deleteArtifactMutation = useMutation({
        onMutate: () => setGlobalLoading('delete-artifact', true, 'Deleting artifact...'),
        mutationFn: (artifactId: string) => ugcApi.deleteArtifact(artifactId),
        onSuccess: () => {
            if (executionId) {
                queryClient.invalidateQueries({ queryKey: ugcKeys.artifacts(executionId) });
            }
            toast.success('Artifact deleted');
        },
        onSettled: () => setGlobalLoading('delete-artifact', false),
    });

    return {
        artifacts: artifactsQuery.data || [],
        isLoading: artifactsQuery.isLoading,
        deleteArtifact: deleteArtifactMutation.mutateAsync,
        isDeleting: deleteArtifactMutation.isPending,
        refreshArtifacts: artifactsQuery.refetch,
    };
}
