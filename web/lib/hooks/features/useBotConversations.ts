import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBotConversations,
    getBotConversation,
    getBotConversationMessages,
    addBotConversationMessage,
    syncFacebookConversations,
    syncInstagramConversations,
    takeoverConversation as takeoverApi,
    handbackConversation as handbackApi,
    archiveBotConversation,
    deleteBotConversation,
    GetConversationsParams
} from '@/lib/api/conversations';
import toast from '@/lib/toast';

export const botConversationKeys = {
    all: ['bot-conversations'] as const,
    lists: () => [...botConversationKeys.all, 'list'] as const,
    list: (params: GetConversationsParams) => [...botConversationKeys.lists(), params] as const,
    details: () => [...botConversationKeys.all, 'detail'] as const,
    detail: (id: string) => [...botConversationKeys.details(), id] as const,
    messages: (id: string) => [...botConversationKeys.detail(id), 'messages'] as const,
};

export function useBotConversations(params?: GetConversationsParams) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: botConversationKeys.list(params || {}),
        queryFn: () => getBotConversations(params),
        enabled: !!params?.botId || params?.source === 'widget',
    });

    const syncMutation = useMutation({
        mutationFn: ({ channelId, channelType, syncParams }: { channelId: string; channelType?: string; syncParams: any }) => {
            if (channelType === 'instagram') {
                return syncInstagramConversations(channelId, syncParams);
            }
            return syncFacebookConversations(channelId, syncParams);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.lists() });
            toast.success('Conversations synchronized');
        },
        onError: () => {
            toast.error('Failed to sync conversations');
        }
    });

    return {
        conversations: query.data?.items || [],
        total: query.data?.total || 0,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
        syncConversations: syncMutation.mutateAsync,
        isSyncing: syncMutation.isPending,
    };
}

export function useBotConversation(id: string) {
    const queryClient = useQueryClient();

    const detailQuery = useQuery({
        queryKey: botConversationKeys.detail(id),
        queryFn: () => getBotConversation(id),
        enabled: !!id,
    });

    const messagesQuery = useQuery({
        queryKey: botConversationKeys.messages(id),
        queryFn: () => getBotConversationMessages(id),
        enabled: !!id,
    });

    const sendMessageMutation = useMutation({
        mutationFn: (data: any) => addBotConversationMessage(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.messages(id) });
        },
        onError: () => {
            toast.error('Failed to send message');
        }
    });

    const takeoverMutation = useMutation({
        mutationFn: () => takeoverApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
            toast.success('Conversation taken over');
        }
    });

    const handbackMutation = useMutation({
        mutationFn: () => handbackApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
            toast.success('Handed back to bot');
        }
    });

    const archiveMutation = useMutation({
        mutationFn: () => archiveBotConversation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: botConversationKeys.lists() });
            toast.success('Conversation archived');
        },
        onError: () => {
            toast.error('Failed to archive conversation');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteBotConversation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botConversationKeys.lists() });
            toast.success('Conversation deleted');
        },
        onError: () => {
            toast.error('Failed to delete conversation');
        }
    });

    return {
        conversation: detailQuery.data,
        messages: messagesQuery.data?.messages || [],
        isLoading: detailQuery.isLoading || messagesQuery.isLoading,
        isError: detailQuery.isError || messagesQuery.isError,
        refetch: () => {
            detailQuery.refetch();
            messagesQuery.refetch();
        },
        sendMessage: sendMessageMutation.mutateAsync,
        isSending: sendMessageMutation.isPending,
        takeoverConversation: takeoverMutation.mutateAsync,
        isTakingOver: takeoverMutation.isPending,
        handbackConversation: handbackMutation.mutateAsync,
        isHandingBack: handbackMutation.isPending,
        archiveConversation: archiveMutation.mutateAsync,
        isArchiving: archiveMutation.isPending,
        deleteConversation: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
