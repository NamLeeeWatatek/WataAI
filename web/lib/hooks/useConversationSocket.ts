// DEPRECATED: Use useConversationsSocket instead
// This hook is replaced by the unified useConversationsSocket which uses the base socket connection hook
// for better maintainability and consistency.
//
// Migration: Replace useConversationSocket with useConversationsSocket
// Old: useConversationSocket({ conversationId, onNewMessage, enabled })
// New: useConversationsSocket({ onNewMessage, enabled }); then call joinConversation(conversationId)

import { useConversationsSocket } from './useConversationsSocket';
import { useEffect, useRef } from 'react';

interface UseConversationSocketOptions {
    conversationId: string;
    onNewMessage: (message: any) => void;
    enabled?: boolean;
}

/**
 * @deprecated Use useConversationsSocket instead
 * This hook is kept for backward compatibility but will be removed in future versions
 */
export function useConversationSocket({
    conversationId,
    onNewMessage,
    enabled = true,
}: UseConversationSocketOptions) {
    const messageHandlerRef = useRef(onNewMessage);

    useEffect(() => {
        messageHandlerRef.current = onNewMessage;
    }, [onNewMessage]);

    const {
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        isConnecting,
        error,
    } = useConversationsSocket({
        onNewMessage: (message) => messageHandlerRef.current(message),
        enabled,
    });

    // Auto join conversation
    useEffect(() => {
        if (conversationId && enabled) {
            joinConversation(conversationId);
        }

        return () => {
            if (conversationId && enabled) {
                leaveConversation(conversationId);
            }
        };
    }, [conversationId, enabled, joinConversation, leaveConversation]);

    // Legacy disconnect method
    const disconnect = () => {
        if (conversationId) {
            leaveConversation(conversationId);
        }
    };

    return {
        socket,
        isConnected,
        disconnect,
    };
}
