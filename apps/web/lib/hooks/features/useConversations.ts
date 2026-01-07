'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAIConversations,
    createAIConversation,
    updateAIConversation,
    deleteAIConversation,
} from '@/lib/api/conversations';
import type { AiConversation, AiMessage, CreateAiConversationDto, UpdateAiConversationDto } from '@/lib/types/conversations';
import toast from '@/lib/toast';

export const conversationKeys = {
    all: ['conversations'] as const,
    lists: () => [...conversationKeys.all, 'list'] as const,
    details: () => [...conversationKeys.all, 'detail'] as const,
    detail: (id: string) => [...conversationKeys.details(), id] as const,
};

export function useConversations() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: conversationKeys.lists(),
        queryFn: async () => {
            const data = await getAIConversations();
            return Array.isArray(data) ? data.filter((c: any) => c && c.id) : [];
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateAiConversationDto) => createAIConversation(data),
        onSuccess: (newConv) => {
            queryClient.setQueryData(conversationKeys.lists(), (old: any) => [newConv, ...(old || [])]);
            toast.success('Conversation created');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAiConversationDto }) => updateAIConversation(id, data),
        onSuccess: (updatedConv, variables) => {
            queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
            queryClient.setQueryData(conversationKeys.detail(variables.id), updatedConv);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAIConversation(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(conversationKeys.lists(), (old: any) =>
                (old || []).filter((c: any) => c.id !== id)
            );
            toast.success('Conversation deleted');
        },
    });

    return {
        conversations: query.data || [],
        isLoading: query.isLoading,
        createConversation: createMutation.mutateAsync,
        updateConversation: updateMutation.mutateAsync,
        deleteConversation: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}
