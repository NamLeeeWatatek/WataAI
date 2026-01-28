import { useCallback, useEffect } from 'react';
import { getBotConversationMessages } from '@/lib/api/conversations';
import { useMessagesStore, type Message } from '@/lib/store/zustand/messages-store';
import { MessageRole } from '@/lib/types/conversations';
import { AxiosError } from 'axios';

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMoreMessages: () => Promise<void>;
  loadInitialMessages: () => Promise<void>;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const messages = useMessagesStore((state) => state.byConversation[conversationId] || []);
  const loading = useMessagesStore((state) => state.isLoading[conversationId] || false);
  const hasMore = useMessagesStore((state) => state.hasMore[conversationId] ?? true);
  const error = useMessagesStore((state) => state.error[conversationId] || null);

  const setMessages = useMessagesStore((state) => state.setMessages);
  const setLoading = useMessagesStore((state) => state.setLoading);
  const setError = useMessagesStore((state) => state.setError);
  const setHasMore = useMessagesStore((state) => state.setHasMore);

  const mapApiMessageToMessage = (apiMessage: any): Message => ({
    id: apiMessage.id,
    role: apiMessage.sender === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
    content: apiMessage.content,
    conversationId: apiMessage.conversationId,
    createdAt: apiMessage.createdAt,
  });

  const loadInitialMessages = useCallback(async () => {
    try {
      setLoading(conversationId, true);
      const response = await getBotConversationMessages(conversationId);

      // Assume messages come in descending order (newest first) from API
      const mappedMessages = response.messages.map(mapApiMessageToMessage);
      setMessages(conversationId, mappedMessages.reverse()); // Reverse to oldest first

      // Set pagination state
      setHasMore(conversationId, mappedMessages.length === 50); // Assuming page size 50
    } catch (err) {
      const message = err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to load messages';
      console.error('Failed to load initial messages:', err);
      setError(conversationId, message);
      setHasMore(conversationId, false);
    } finally {
      setLoading(conversationId, false);
    }
  }, [conversationId, setMessages, setLoading, setError, setHasMore]);

  const loadMoreMessages = useCallback(async () => {
    // Basic load more implementation (can be extended with pagination support if API allows)
    if (loading || !hasMore) return;
    setHasMore(conversationId, false);
  }, [conversationId, loading, hasMore, setHasMore]);

  useEffect(() => {
    if (!messages.length && !loading && conversationId) {
      loadInitialMessages();
    }
  }, [conversationId, messages.length, loading, loadInitialMessages]);

  return {
    messages,
    loading,
    loadingMore: false, // Placeholder for now
    hasMore,
    error,
    loadMoreMessages,
    loadInitialMessages,
  };
}
