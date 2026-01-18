'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/store/slices/messagesSlice';
import { MessageRole } from '@/lib/types/conversations';

interface MessageBubbleProps {
    message: Message;
    botName: string;
    customerName: string;
    currentUserName: string;
    isChannelConversation: boolean;
}

// ✅ Memoize MessageBubble to prevent unnecessary re-renders
export const MessageBubble = React.memo(function MessageBubble({
    message,
    botName,
    customerName,
    currentUserName,
    isChannelConversation
}: MessageBubbleProps) {
    // ✅ CORRECT LOGIC:
    // In channel conversations:
    // - 'user' = Customer (from Facebook/Instagram) → LEFT side
    // - 'assistant' = Agent/Bot (our response) → RIGHT side
    const isCustomer = message.role === MessageRole.USER;
    const isAgent = message.role === MessageRole.ASSISTANT;

    // ✅ FIX: Safe date formatting - memoize
    const formattedTime = React.useMemo(() => {
        try {
            const date = new Date(message.createdAt);
            if (isNaN(date.getTime())) {
                return '';
            }
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }, [message.createdAt]);

    // ✅ Display names
    const displayName = isCustomer ? customerName : currentUserName;

    // ✅ Show "You" badge for agent messages
    const roleLabel = isAgent ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-medium">
            You
        </span>
    ) : null;

    return (
        <div className={cn('flex gap-3', isAgent && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(
                    isCustomer
                        ? 'bg-gradient-to-br from-purple-500/30 to-purple-500/10'
                        : 'bg-gradient-to-br from-green-500/30 to-green-500/10'
                )}>
                    {isCustomer ? <User className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-green-600" />}
                </AvatarFallback>
            </Avatar>

            <div className={cn('flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]', isAgent && 'items-end')}>
                <div className={cn('flex items-center gap-1.5 sm:gap-2 flex-wrap', isAgent && 'flex-row-reverse')}>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                        {displayName}
                    </span>
                    {roleLabel}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formattedTime}
                    </span>
                </div>
                <div
                    className={cn(
                        'rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5',
                        isCustomer
                            ? 'bg-muted text-foreground rounded-tl-sm'
                            : 'bg-primary text-primary-foreground rounded-tr-sm'
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
});
