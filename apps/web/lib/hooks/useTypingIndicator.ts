/**
 * Typing Indicator Hook
 * Shows "User is typing..." like Slack, WhatsApp, Messenger
 */

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface TypingUser {
    conversationId: string;
    userName: string;
    timestamp: number;
}

interface UseTypingIndicatorReturn {
    typingUsers: Map<string, TypingUser>;
    isTyping: (conversationId: string) => boolean;
    getTypingText: (conversationId: string) => string | null;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
}

const TYPING_TIMEOUT = 3000; // 3 seconds

export function useTypingIndicator(socket?: Socket | null): UseTypingIndicatorReturn {
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());

    useEffect(() => {
        if (!socket) return;

        // Listen for typing events from other users
        socket.on('user:typing', (data: TypingUser) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(data.conversationId, data);
                return newMap;
            });

            // Auto-remove after timeout
            setTimeout(() => {
                setTypingUsers((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(data.conversationId);

                    // Only remove if it's the same typing instance
                    if (existing && existing.timestamp === data.timestamp) {
                        newMap.delete(data.conversationId);
                    }

                    return newMap;
                });
            }, TYPING_TIMEOUT);
        });

        socket.on('user:stop-typing', (data: { conversationId: string }) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(data.conversationId);
                return newMap;
            });
        });

        return () => {
            socket.off('user:typing');
            socket.off('user:stop-typing');
        };
    }, [socket]);

    const isTyping = useCallback((conversationId: string): boolean => {
        return typingUsers.has(conversationId);
    }, [typingUsers]);

    const getTypingText = useCallback((conversationId: string): string | null => {
        const typing = typingUsers.get(conversationId);
        if (!typing) return null;

        return `${typing.userName} is typing...`;
    }, [typingUsers]);

    const startTyping = useCallback((conversationId: string) => {
        if (!socket) return;

        socket.emit('typing:start', { conversationId });
    }, [socket]);

    const stopTyping = useCallback((conversationId: string) => {
        if (!socket) return;

        socket.emit('typing:stop', { conversationId });
    }, [socket]);

    return {
        typingUsers,
        isTyping,
        getTypingText,
        startTyping,
        stopTyping,
    };
}

