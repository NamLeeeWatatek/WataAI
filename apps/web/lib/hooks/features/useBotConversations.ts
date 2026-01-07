'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBotConversations,
    getBotConversation,
    archiveBotConversation,
    deleteBotConversation,
    takeoverConversation,
    handbackConversation,
    syncFacebookConversations,
    GetConversationsParams
} from '@/lib/api/conversations';
import toast from '@/lib/toast';

export const botConversationKeys = {
    all: ['bot-conversations'] as const,
    lists: () => [...botConversationKeys.all, 'list'] as const,
    list: (params: GetConversationsParams) => [...botConversationKeys.lists(), params] as const,
    details: () => [...botConversationKeys.all, 'detail'] as const,
    detail: (id: string) => [...botConversationKeys.details(), id] as const,
};

export function useBotConversations(params: GetConversationsParams = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: botConversationKeys.list(params),
        queryFn: async () => {
            const data: any = await getBotConversations(params);

            // Handle different response formats (paginated vs array)
            if (Array.isArray(data)) {
                return { items: data, total: data.length };
            }
            if (data?.items) {
                return { items: data.items, total: data.total || data.items.length };
            }
            if (data?.data) {
                return { items: data.data, total: data.total || data.data.length };
            }
            return { items: [], total: 0 };
        },
    });

    const syncMutation = useMutation({
        mutationFn: ({ channelId, syncParams }: { channelId: string; syncParams: any }) =>
            syncFacebookConversations(channelId, syncParams),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Synced ${data.synced} conversation(s) from Facebook`);
                queryClient.invalidateQueries({ queryKey: botConversationKeys.lists() });
            } else {
                toast.error('Failed to sync conversations');
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to sync conversations';
            toast.error(errorMessage);
        }
    });

    return {
        ...query,
        conversations: query.data?.items || [],
        total: query.data?.total || 0,
        syncConversations: syncMutation.mutateAsync,
        isSyncing: syncMutation.isPending,
    };
}

export function useBotConversation(id: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: botConversationKeys.detail(id),
        queryFn: () => getBotConversation(id),
        enabled: !!id,
    });

    const archiveMutation = useMutation({
        mutationFn: () => archiveBotConversation(id),
        onSuccess: () => {
            toast.success('Conversation archived');
            queryClient.invalidateQueries({ queryKey: botConversationKeys.all });
        },
        onError: () => toast.error('Failed to archive conversation'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteBotConversation(id),
        onSuccess: () => {
            toast.success('Conversation deleted');
            queryClient.invalidateQueries({ queryKey: botConversationKeys.all });
        },
        onError: () => toast.error('Failed to delete conversation'),
    });

    const sendMutation = useMutation({
        mutationFn: (data: { content: string; role: any }) =>
            import('@/lib/api/conversations').then(api => api.addBotConversationMessage(id, { content: data.content, sender: data.role })),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
        },
        onError: () => toast.error('Failed to send message'),
    });

    const takeoverMutation = useMutation({
        mutationFn: () => takeoverConversation(id),
        onSuccess: () => {
            toast.success('You are now handling this conversation');
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
        },
        onError: () => toast.error('Failed to take over conversation'),
    });

    const handbackMutation = useMutation({
        mutationFn: () => handbackConversation(id),
        onSuccess: () => {
            toast.success('Bot will resume auto-reply');
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
        },
        onError: () => toast.error('Failed to hand back conversation'),
    });

    return {
        ...query,
        conversation: query.data,
        archiveConversation: archiveMutation.mutateAsync,
        deleteConversation: deleteMutation.mutateAsync,
        sendMessage: sendMutation.mutateAsync,
        isArchiving: archiveMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSending: sendMutation.isPending,
        takeoverConversation: takeoverMutation.mutateAsync,
        handbackConversation: handbackMutation.mutateAsync,
        isTakingOver: takeoverMutation.isPending,
        isHandingBack: handbackMutation.isPending,
    };
}
