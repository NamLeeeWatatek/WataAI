import { useCallback, useEffect } from 'react';
import { getBotConversationMessages } from '@/lib/api/conversations';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  setMessages,
  prependMessages,
  setLoading,
  setLoadingMore,
  setHasMore,
  setOldestMessageId,
  setError,
  selectMessages,
  selectMessagesLoading,
  selectMessagesHasMore,
  type Message,
} from '@/lib/store/slices/messagesSlice';
import { MessageRole } from '@/lib/types/conversations';
import { AxiosError } from 'axios';

// Re-export Message type for backward compatibility
export type { Message } from '@/lib/store/slices/messagesSlice';

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
  const dispatch = useAppDispatch();

  // Selectors
  const messages = useAppSelector(selectMessages(conversationId));
  const loading = useAppSelector(selectMessagesLoading(conversationId));
  const hasMore = useAppSelector(selectMessagesHasMore(conversationId));
  const loadingMore = useAppSelector((state) => state.messages.loadingMore[conversationId] ?? false);
  const oldestMessageId = useAppSelector((state) => state.messages.oldestMessageId[conversationId]);
  const error = useAppSelector((state) => state.messages.error[conversationId] ?? null);

  const mapApiMessageToMessage = (apiMessage: any): Message => ({
    id: apiMessage.id,
    role: apiMessage.sender === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
    content: apiMessage.content,
    conversationId: apiMessage.conversationId,
    createdAt: apiMessage.createdAt,
  });

  const loadInitialMessages = useCallback(async () => {
    try {
      dispatch(setLoading({ conversationId, loading: true }));
      const response = await getBotConversationMessages(conversationId);

      // Assume messages come in descending order (newest first) from API
      const mappedMessages = response.map(mapApiMessageToMessage);
      dispatch(setMessages({ conversationId, messages: mappedMessages.reverse() })); // Reverse to oldest first

      // Set pagination state
      dispatch(setHasMore({ conversationId, hasMore: mappedMessages.length === 50 })); // Assuming page size 50
      if (mappedMessages.length > 0) {
        dispatch(setOldestMessageId({ conversationId, id: mappedMessages[mappedMessages.length - 1].id }));
      } else {
        dispatch(setHasMore({ conversationId, hasMore: false }));
      }
    } catch (err) {
      const message = err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to load messages';
      console.error('Failed to load initial messages:', err);
      dispatch(setError({ conversationId, error: message }));
      dispatch(setHasMore({ conversationId, hasMore: false }));
    } finally {
      dispatch(setLoading({ conversationId, loading: false }));
    }
  }, [conversationId, dispatch]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      dispatch(setLoadingMore({ conversationId, loading: true }));

      if (!oldestMessageId) {
        dispatch(setHasMore({ conversationId, hasMore: false }));
        return;
      }

      // For pagination, we'd modify the API call to include before=oldestId
      // But the current API doesn't support this, so we'll simulate
      // In a real scenario, we'd need to extend the API to support pagination
      dispatch(setHasMore({ conversationId, hasMore: false })); // Set to false for now as pagination isn't implemented in API
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      dispatch(setLoadingMore({ conversationId, loading: false }));
    }
  }, [conversationId, loadingMore, hasMore, oldestMessageId, dispatch]);

  useEffect(() => {
    if (!messages.length && !loading) {
      loadInitialMessages();
    }
  }, [conversationId, messages.length, loading, loadInitialMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    loadInitialMessages,
  };
}
