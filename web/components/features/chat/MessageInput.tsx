'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TiptapEditor } from '@/components/features/chat/TiptapEditor';
import { Button } from '@/components/ui/Button';
import type { Message } from '@/lib/store/slices/messagesSlice';
import { MessageRole } from '@/lib/types/conversations';

interface MessageInputProps {
    conversationId: string;
    onSendMessage: (content: string) => Promise<void>;
    senderRole?: MessageRole;
    disabled?: boolean;
}

export function MessageInput({
    conversationId,
    onSendMessage,
    senderRole = MessageRole.ASSISTANT,
    disabled = false
}: MessageInputProps) {
    const { t } = useTranslation();
    const [sending, setSending] = useState(false);

    const handleSend = async (content: string) => {
        if (sending) return;

        setSending(true);
        try {
            await onSendMessage(content);
        } catch (error) {
            // Error is handled by parent
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="border-t bg-background shrink-0">
            <div className="p-2">
                <TiptapEditor
                    onSend={handleSend}
                    placeholder={t('chat.typeMessage', { defaultValue: 'Type your message...' })}
                    disabled={disabled || sending}
                    className="max-w-full"
                />
            </div>
        </div>
    );
}

