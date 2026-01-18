'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getKnowledgeBases,
    createKnowledgeBase,
    deleteKnowledgeBase,
    updateKnowledgeBase
} from '@/lib/api/knowledge-base';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import toast from '@/lib/toast';

export const kbKeys = {
    all: ['knowledge-bases'] as const,
    lists: () => [...kbKeys.all, 'list'] as const,
    list: (workspaceId: string, params: any) => [...kbKeys.lists(), workspaceId, params] as const,
    details: () => [...kbKeys.all, 'detail'] as const,
    detail: (id: string) => [...kbKeys.details(), id] as const,
};

export function useKnowledgeBases(workspaceId?: string, params: any = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: kbKeys.list(workspaceId || '', params),
        queryFn: async () => {
            if (!workspaceId) return { data: [], total: 0 };
            const data: any = await getKnowledgeBases({
                ...params,
                workspaceId,
            });

            if (Array.isArray(data)) {
                return { data, total: data.length };
            }
            return { data: data.data || [], total: data.total || 0 };
        },
        enabled: !!workspaceId,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => createKnowledgeBase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            toast.success('Knowledge Base created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateKnowledgeBase(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(variables.id) });
            toast.success('Knowledge Base updated successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteKnowledgeBase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            toast.success('Knowledge Base deleted successfully');
        },
    });

    return {
        ...query,
        knowledgeBases: query.data?.data || [],
        total: query.data?.total || 0,
        createKB: createMutation.mutateAsync,
        updateKB: updateMutation.mutateAsync,
        deleteKB: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}
