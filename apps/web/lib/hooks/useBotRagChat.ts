/**
 * Professional Bot-first RAG Chat Hook
 *
 * Features:
 * - Bot-first architecture: Uses bot's configured AI provider first
 * - Proper RAG integration: Fetches from bot's configured knowledge bases
 * - AI provider priority: Bot → KB Workspace → KB User → User Configs
 * - Error handling: Clear messages for missing configurations
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { chatWithBotAndRAG } from '@/lib/api/knowledge-base';
import { MessageRole } from '@/lib/types/conversations';

export interface BotRagMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
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

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: BotRagMessage = {
      role: MessageRole.USER,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Extract conversation history (exclude system messages)
      const conversationHistory: Array<{ role: MessageRole; content: string }> = messages
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
          timestamp: new Date().toISOString(),
          metadata: {
            botId,
            botName,
            model: 'bot-configured', // Backend resolves the actual model
            sources: response.sources,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from bot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
        err.message ||
        'Failed to communicate with bot';

      setError(errorMessage);

      // Add error message to chat
      const errorBotMessage: BotRagMessage = {
        role: MessageRole.ASSISTANT,
        content: `❌ **AI Provider Error:** ${errorMessage}\n\nPlease configure an AI provider for this bot in Settings.`,
        timestamp: new Date().toISOString(),
        metadata: {
          botId,
          botName,
          error: errorMessage,
        },
      };

      setMessages(prev => [...prev, errorBotMessage]);

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, botId, botName, knowledgeBaseIds]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    error,
  };
}
