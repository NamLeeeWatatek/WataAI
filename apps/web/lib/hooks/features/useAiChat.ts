'use client';

import { useMutation } from '@tanstack/react-query';
import { chatWithKBSimple, chatWithBotAndRAG } from '@/lib/api/knowledge-base';
import { botsApi } from '@/lib/api/bots';
import { MessageRole } from '@/lib/types/conversations';

export function useAiChat() {
    const kBChatMutation = useMutation({
        mutationFn: (data: {
            message: string;
            knowledgeBaseIds?: string[];
            conversationHistory?: Array<{ role: MessageRole; content: string }>;
            model?: string;
        }) => {
            // Mapping to the singular knowledgeBaseId if plural is not supported by this endpoint
            // or if the backend actually supports plural but the types are slightly off
            return chatWithKBSimple(data as any);
        },
    });

    const botChatMutation = useMutation({
        mutationFn: (data: {
            botId: string;
            message: string;
            conversationHistory?: Array<{ role: MessageRole; content: string }>;
            knowledgeBaseIds?: string[];
        }) => {
            return botsApi.chat(
                data.botId,
                data.message,
                data.conversationHistory,
                data.knowledgeBaseIds
            );
        },
    });

    return {
        chatWithKB: kBChatMutation.mutateAsync,
        isKBChatting: kBChatMutation.isPending,
        chatWithBot: botChatMutation.mutateAsync,
        isBotChatting: botChatMutation.isPending,
    };
}
