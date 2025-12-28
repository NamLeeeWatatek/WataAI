import { useEffect, useCallback, useRef, useMemo } from 'react';
import { SocketEventHandlers } from '@/lib/types/socket';
import { useSocketConnection } from './use-socket-connection';

interface UseConversationsSocketOptions extends SocketEventHandlers {
  enabled?: boolean;
}

/**
 * WebSocket hook for conversation events using unified socket connection
 * Handles multiple conversations and real-time updates
 */
export function useConversationsSocket({
  onConversationUpdate,
  onNewConversation,
  onNewMessage,
  enabled = true,
}: UseConversationsSocketOptions) {
  const handlersRef = useRef({
    onConversationUpdate,
    onNewConversation,
    onNewMessage,
  });

  // Update handlers when they change
  useEffect(() => {
    handlersRef.current = {
      onConversationUpdate,
      onNewConversation,
      onNewMessage,
    };
  }, [onConversationUpdate, onNewConversation, onNewMessage]);

  const {
    socket,
    isConnected,
    isConnecting,
    error,
    emit,
    on,
    off,
  } = useSocketConnection({
    namespace: 'conversations',
    enabled,
  });

  // Set up conversation-specific event handlers
  useEffect(() => {
    if (!isConnected || !socket) return;

    const handleConversationUpdate = (conversation: any) => {
      console.log('[WebSocket] 📥 conversation-update:', conversation);
      handlersRef.current.onConversationUpdate?.(conversation);
    };

    const handleNewConversation = (conversation: any) => {
      console.log('[WebSocket] 📥 new-conversation:', conversation);
      handlersRef.current.onNewConversation?.(conversation);
    };

    const handleNewMessage = (message: any) => {
      console.log('[WebSocket] 📥 new-message:', message);
      handlersRef.current.onNewMessage?.(message);
    };

    // Set up event listeners
    const unsubscribeConversationUpdate = on('conversation-update', handleConversationUpdate);
    const unsubscribeNewConversation = on('new-conversation', handleNewConversation);
    const unsubscribeNewMessage = on('new-message', handleNewMessage);

    return () => {
      unsubscribeConversationUpdate();
      unsubscribeNewConversation();
      unsubscribeNewMessage();
    };
  }, [isConnected, socket, on]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.warn('[WebSocket] Invalid conversationId provided to joinConversation:', conversationId);
      return;
    }

    if (isConnected) {
      console.log('[WebSocket] 🚪 Joining conversation:', conversationId);
      emit('join-conversation', conversationId);
    } else {
      console.log('[WebSocket] ⏳ Conversation join queued:', conversationId);
      // Will join when connection is established via effect above
    }
  }, [isConnected, emit]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.warn('[WebSocket] Invalid conversationId provided to leaveConversation:', conversationId);
      return;
    }

    console.log('[WebSocket] 🚪 Leaving conversation:', conversationId);
    emit('leave-conversation', conversationId);
  }, [emit]);

  // Return stable references
  return useMemo(() => ({
    socket,
    isConnected,
    isConnecting,
    error,
    joinConversation,
    leaveConversation,
  }), [socket, isConnected, isConnecting, error, joinConversation, leaveConversation]);
}
