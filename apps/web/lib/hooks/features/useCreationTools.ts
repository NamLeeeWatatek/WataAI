'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import toast from '@/lib/toast';

export const toolKeys = {
    all: ['creation-tools'] as const,
    lists: () => [...toolKeys.all, 'list'] as const,
    list: (params: any) => [...toolKeys.lists(), params] as const,
};

export function useCreationTools(params: any = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: toolKeys.list(params),
        queryFn: () => creationToolsApi.getAll(params),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => creationToolsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: toolKeys.lists() });
            toast.success('Tool created successfully');
        },
        onError: () => toast.error('Failed to create tool'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => creationToolsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: toolKeys.all });
            toast.success('Tool updated successfully');
        },
        onError: () => toast.error('Failed to update tool'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => creationToolsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: toolKeys.lists() });
            toast.success('Tool deleted successfully');
        },
        onError: () => toast.error('Failed to delete tool'),
    });

    return {
        ...query,
        tools: responseToArray(query.data),
        total: query.data?.total || 0,
        createTool: createMutation.mutateAsync,
        updateTool: updateMutation.mutateAsync,
        deleteTool: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}

function responseToArray(response: any): CreationTool[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    return [];
}
