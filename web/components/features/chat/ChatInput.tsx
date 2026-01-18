'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    onSend: (content: string) => Promise<void>;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function ChatInput({
    onSend,
    placeholder = 'Type your message here...',
    disabled = false,
    className
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || sending || disabled) return;

        setSending(true);
        try {
            await onSend(message.trim());
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn('border-t p-4 bg-background', className)}>
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || sending}
                        className="min-h-[60px] max-h-[200px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled || sending}
                    size="icon"
                    className="h-[60px] w-[60px] shrink-0"
                >
                    {sending ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </Button>
            </div>
        </div>
    );
}

