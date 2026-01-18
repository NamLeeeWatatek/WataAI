'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function usePublicBot(botId: string) {
    const configQuery = useQuery({
        queryKey: ['public-bot', botId, 'config'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/public/bots/${botId}/config`);
            if (!response.ok) throw new Error('Failed to load bot');
            return response.json();
        },
        enabled: !!botId,
    });

    const createConversationMutation = useMutation({
        mutationFn: async (metadata: any) => {
            const response = await fetch(`${API_URL}/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metadata }),
            });
            if (!response.ok) throw new Error('Failed to create conversation');
            return response.json();
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
            const response = await fetch(`${API_URL}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (!response.ok) throw new Error('Failed to send message');
            return response.json();
        },
    });

    return {
        bot: configQuery.data,
        isBotLoading: configQuery.isLoading,
        createConversation: createConversationMutation.mutateAsync,
        isCreatingConversation: createConversationMutation.isPending,
        sendMessage: sendMessageMutation.mutateAsync,
        isSendingMessage: sendMessageMutation.isPending,
    };
}
