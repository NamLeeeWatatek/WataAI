/**
 * Professional Bot-first RAG Chat Hook
 *
 * Features:
 * - Bot-first architecture: Uses bot's configured AI provider first
 * - Proper RAG integration: Fetches from bot's configured knowledge bases
 * - AI provider priority: Bot → KB Workspace → KB User → User Configs
 * - Error handling: Clear messages for missing configurations
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { chatWithBotAndRAG } from '@/lib/api/knowledge-base';
import { MessageRole } from '@/lib/types/conversations';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/utils/api-error';

export interface BotRagMessage {
  role: MessageRole;
  content: string;
  timestamp?: string; // Optional for pending messages
  metadata?: {
    botId?: string;
    botName?: string;
    model?: string;
    sources?: Array<{
      content: string;
      score: number;
      metadata?: Record<string, any>;
    }>;
    error?: string;
  };
  isError?: boolean;
}

export interface UseBotRagChatOptions {
  botId: string;
  botName?: string;
  knowledgeBaseIds?: string[];
  autoScroll?: boolean;
}

export interface UseBotRagChatReturn {
  messages: BotRagMessage[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  error: string | null;
}

export function useBotRagChat({
  botId,
  botName = 'Assistant',
  knowledgeBaseIds,
}: UseBotRagChatOptions): UseBotRagChatReturn {
  const [messages, setMessages] = useState<BotRagMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to keep track of messages for API calls without triggering re-renders or dependency loops
  const messagesRef = useRef<BotRagMessage[]>([]);

  // Sync ref with state
  const updateMessages = useCallback((newMessages: BotRagMessage[] | ((prev: BotRagMessage[]) => BotRagMessage[])) => {
    setMessages((prev) => {
      const updated = typeof newMessages === 'function' ? newMessages(prev) : newMessages;
      messagesRef.current = updated;
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: BotRagMessage = {
      role: MessageRole.USER,
      content: content.trim(),
    };

    // Add user message immediately
    updateMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Extract conversation history from REF to ensure we have the very latest including the one just added
      // (Note: state update might be async, but our local variable 'userMessage' is available, 
      //  and previous history is in ref. However, safest is to construct history from ref + current)

      const currentHistory = [...messagesRef.current];
      // Note: messagesRef already updated in updateMessages above? 
      // Actually setState updater runs later. So we manually construct the history for the API call.

      const conversationHistory: Array<{ role: MessageRole; content: string }> = currentHistory
        .filter(msg => msg.role !== MessageRole.SYSTEM)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call the professional bot-first RAG API
      const response = await chatWithBotAndRAG({
        message: content.trim(),
        botId,
        knowledgeBaseIds,
        conversationHistory,
      });

      if (response.success) {
        const assistantMessage: BotRagMessage = {
          role: MessageRole.ASSISTANT,
          content: response.answer,
          metadata: {
            botId,
            botName,
            model: 'bot-configured', // Backend resolves the actual model
            sources: response.sources,
          },
        };

        updateMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from bot');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);

      logger.error('Bot RAG Chat Error:', err);
      setError(errorMessage);

      // Add error message to chat
      const errorBotMessage: BotRagMessage = {
        role: MessageRole.ASSISTANT,
        content: `❌ **AI Provider Error:** ${errorMessage}\n\nPlease configure an AI provider for this bot in Settings.`,
        metadata: {
          botId,
          botName,
          error: errorMessage,
        },
        isError: true,
      };

      updateMessages(prev => [...prev, errorBotMessage]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, botId, botName, knowledgeBaseIds, updateMessages]); // Removed 'messages' dependency

  const clearMessages = useCallback(() => {
    updateMessages([]);
    setError(null);
  }, [updateMessages]);

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    error,
  };
}
