'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { useMessages } from '@/lib/hooks/useMessages';
import { useAppDispatch } from '@/lib/store/hooks';
import { appendMessage, removeMessage } from '@/lib/store/slices/messagesSlice';
import { MessagesList } from './MessagesList';
import { MessageInput } from './MessageInput';
import { MessageRole } from '@/lib/types/conversations';


interface ChatInterfaceProps {
    conversationId: string;
    botName?: string;
    customerName?: string;
    isChannelConversation?: boolean;
    onSendMessage: (content: string) => Promise<void>;
    className?: string;
    senderRole?: MessageRole;
}

export function ChatInterface({
    conversationId,
    botName = 'AI Assistant',
    customerName = 'Customer',
    isChannelConversation = false,
    onSendMessage,
    className,
    senderRole = MessageRole.ASSISTANT,
}: ChatInterfaceProps) {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const currentUserName = session?.user?.name || session?.user?.email || t('chat.you', { defaultValue: 'You' });
    const dispatch = useAppDispatch();

    // Track current conversation to prevent unnecessary joins/leaves
    const currentConversationRef = useRef<string | null>(null);

    // Use custom hook for messages management
    const {
        messages,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMoreMessages,
        loadInitialMessages
    } = useMessages(conversationId);

    // Socket for real-time messages - use stable callbacks
    const onNewMessageCallback = useCallback((message: any) => {
        // Only add if it's for this conversation
        if (message.conversationId === conversationId) {
            dispatch(appendMessage({
                conversationId,
                message: {
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    conversationId: message.conversationId,
                    createdAt: message.sentAt || message.createdAt || new Date().toISOString()
                }
            }));
        }
    }, [conversationId, dispatch]);

    const { joinConversation, leaveConversation } = useConversationsSocket({
        onNewMessage: onNewMessageCallback,
        enabled: true
    });

    // Join/leave socket room - only when conversationId actually changes
    useEffect(() => {
        // Ensure conversationId is valid
        if (!conversationId || typeof conversationId !== 'string' || conversationId.trim() === '') {
            console.warn('[ChatInterface] Invalid conversationId:', conversationId);
            return;
        }

        if (currentConversationRef.current === conversationId) {
            // Same conversation, no need to rejoin
            return;
        }

        // Leave previous conversation if exists
        if (currentConversationRef.current && leaveConversation) {
            leaveConversation(currentConversationRef.current);
        }

        // Join new conversation
        if (conversationId && joinConversation) {
            joinConversation(conversationId);
            currentConversationRef.current = conversationId;
        }

        return () => {
            // Cleanup on unmount
            if (currentConversationRef.current && leaveConversation) {
                leaveConversation(currentConversationRef.current);
                currentConversationRef.current = null;
            }
        };
    }, [conversationId]); // Only depend on conversationId, not the join/leave functions

    // Handle sending messages
    const handleSendMessage = useCallback(async (content: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            role: senderRole,
            content: content.trim(),
            conversationId,
            createdAt: new Date().toISOString(),
        };

        dispatch(appendMessage({ conversationId, message: tempMessage }));

        try {
            await onSendMessage(content.trim());
        } catch (err) {
            toast.error(t('chat.failedToSend', { defaultValue: 'Failed to send message' }));
            dispatch(removeMessage({ conversationId, messageId: tempId }));
            throw err;
        }
    }, [conversationId, senderRole, onSendMessage, dispatch]);

    if (error) {
        return (
            <div className={cn('flex flex-col items-center justify-center h-full', className)}>
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={loadInitialMessages} variant="outline" className="mt-4">
                    {t('chat.retry', { defaultValue: 'Retry' })}
                </Button>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            <MessagesList
                messages={messages}
                botName={botName || t('chat.aiAssistant', { defaultValue: 'AI Assistant' })}
                customerName={customerName || t('chat.customer', { defaultValue: 'Customer' })}
                currentUserName={currentUserName}
                isChannelConversation={isChannelConversation}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMoreMessages}
            />

            <MessageInput
                conversationId={conversationId}
                onSendMessage={handleSendMessage}
                senderRole={senderRole}
            />
        </div>
    );
}
