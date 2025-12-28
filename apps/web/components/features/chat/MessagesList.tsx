'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';
import { MessageSkeleton } from './MessageSkeleton';
import { MessageBubble } from './MessageBubble';


interface MessagesListProps {
    messages: any[];
    botName?: string;
    customerName?: string;
    currentUserName: string;
    isChannelConversation?: boolean;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    className?: string;
}

export function MessagesList({
    messages,
    botName = 'AI Assistant',
    customerName = 'Customer',
    currentUserName,
    isChannelConversation = false,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    className
}: MessagesListProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isInitialLoadRef = useRef(true);

    // Intersection observer for load more
    const { ref: loadMoreTriggerRef, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    // Scroll to bottom function
    const scrollToBottom = useCallback((smooth = true) => {
        requestAnimationFrame(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'end'
                });
            }
        });
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        // Only auto-scroll if this is a new message and not initially loading
        if (!isInitialLoadRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
        } else {
            // Initial load
            setTimeout(() => scrollToBottom(false), 50);
            isInitialLoadRef.current = false;
        }
    }, [messages, scrollToBottom]);

    // Handle infinite scroll
    useEffect(() => {
        if (inView && hasMore && !loadingMore) {
            onLoadMore();
        }
    }, [inView, hasMore, loadingMore, onLoadMore]);

    if (loading) {
        return (
            <ScrollArea className={cn('flex-1 px-4', className)}>
                <div className="space-y-4 py-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <MessageSkeleton key={i} isAgent={i % 2 === 0} />
                    ))}
                </div>
            </ScrollArea>
        );
    }

    return (
        <div ref={scrollAreaRef} className={cn('flex-1 min-h-0', className)}>
            <ScrollArea className="h-full px-2 sm:px-4">
                <div className="space-y-4 py-4">
                    {/* Load more trigger */}
                    {hasMore && messages.length > 0 && !loadingMore && (
                        <div
                            ref={loadMoreTriggerRef}
                            className="h-20 w-full flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-primary/20"
                        >
                            <div className="text-center">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Scroll up to load more</span>
                            </div>
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {loadingMore && (
                        <div className="space-y-4 py-4">
                            {[1, 2].map((i) => (
                                <MessageSkeleton key={`loading-${i}`} isAgent={i % 2 === 0} />
                            ))}
                        </div>
                    )}

                    {/* No more messages indicator */}
                    {!hasMore && messages.length > 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            Beginning of conversation
                        </div>
                    )}

                    {/* Empty state */}
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Start a conversation with {botName}
                            </p>
                        </div>
                    ) : (
                        /* Messages list */
                        messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                botName={botName}
                                customerName={customerName}
                                currentUserName={currentUserName}
                                isChannelConversation={isChannelConversation}
                            />
                        ))
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
        </div>
    );
}

