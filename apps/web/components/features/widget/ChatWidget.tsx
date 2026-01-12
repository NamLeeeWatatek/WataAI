'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, SendHorizontal, Sparkles, AlertCircle } from 'lucide-react'
import { MessageRole } from '@/lib/types/conversations'
import { Media } from '@/components/ui/Media'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'
import { usePublicChat } from '@/lib/hooks/features/usePublicChat'

interface ChatWidgetProps {
    botId: string
    apiUrl?: string
}

export function ChatWidget({ botId, apiUrl = '/api/v1' }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')

    const {
        config,
        messages,
        loading,
        conversationId,
        error,
        createConversation,
        sendMessage
    } = usePublicChat({ botId, apiUrl })

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Initialize Conversation when opened
    useEffect(() => {
        if (isOpen && !conversationId) {
            createConversation()
        }
        // Focus input on open
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen, conversationId, createConversation])

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return
        const text = input.trim()
        setInput('')
        await sendMessage(text)
    }

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch {
            return ''
        }
    }

    // Hide if broken and closed or config not loaded
    if ((error && !isOpen) || !config) return null

    const primaryColor = config.theme?.primaryColor || '#3B82F6'
    const pos = config.theme?.position || 'bottom-right'
    const isRight = pos.includes('right')
    const isBottom = pos.includes('bottom')

    const positionStyles: React.CSSProperties = {
        position: 'fixed',
        zIndex: 50,
        [isRight ? 'right' : 'left']: '24px',
        [isBottom ? 'bottom' : 'top']: '24px',
    }

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:shadow-2xl hover:scale-105 active:scale-95 animate-in zoom-in duration-300"
                    style={{
                        ...positionStyles,
                        backgroundColor: primaryColor,
                        width: config.theme?.buttonSize === 'large' ? '64px' : '56px',
                        height: config.theme?.buttonSize === 'large' ? '64px' : '56px',
                    }}
                    aria-label="Open chat"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            {isOpen && (
                <div
                    className={cn(
                        "fixed z-50 flex flex-col bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 font-sans animate-in slide-in-from-bottom-10 fade-in duration-300",
                        "w-[90vw] h-[80vh] sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-100px)]"
                    )}
                    style={{
                        ...positionStyles,
                        [isBottom ? 'bottom' : 'top']: isBottom ? '100px' : '90px',
                    }}
                >
                    {/* Header */}
                    <div
                        className="p-4 flex items-center gap-3 text-white shadow-sm shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />

                        {config.theme?.showAvatar && (
                            <div className="relative z-10 w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                                {config.avatarUrl ? (
                                    <Media
                                        src={config.avatarUrl}
                                        alt={config.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Sparkles className="w-5 h-5 text-white" />
                                )}
                            </div>
                        )}

                        <div className="flex-1 min-w-0 relative z-10">
                            <h3 className="font-bold text-base truncate">{config.name}</h3>
                            {config.description && (
                                <p className="text-xs opacity-80 truncate">{config.description}</p>
                            )}
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-zinc-900/50 scroll-smooth"
                        style={config.theme?.backgroundColor ? { backgroundColor: config.theme.backgroundColor } : undefined}
                    >
                        {messages.length === 0 && !loading && !error && (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                                <MessageCircle className="w-8 h-8" />
                                <p className="text-sm">Start a conversation</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            const isUser = msg.role === MessageRole.USER;
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-full",
                                        isUser ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm relative group",
                                            isUser
                                                ? "text-white rounded-br-none"
                                                : "bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-bl-none text-foreground"
                                        )}
                                        style={{
                                            backgroundColor: isUser
                                                ? primaryColor
                                                : (config.theme?.botMessageColor || undefined),
                                            color: isUser
                                                ? (config.theme?.userMessageTextColor || undefined)
                                                : (config.theme?.botMessageTextColor || undefined)
                                        }}
                                    >
                                        <MarkdownRenderer content={msg.content} />

                                        {config.theme?.showTimestamp && (
                                            <p className={cn(
                                                "text-[10px] mt-1.5 opacity-60 text-right font-medium",
                                                isUser ? "text-white/80" : "text-muted-foreground"
                                            )}>
                                                {formatTime(msg.sentAt || msg.timestamp || '')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="flex justify-start">
                                <div
                                    className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl rounded-bl-none p-4 shadow-sm"
                                    style={config.theme?.botMessageColor ? { backgroundColor: config.theme.botMessageColor } : undefined}
                                >
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: primaryColor }} />
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: primaryColor }} />
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ backgroundColor: primaryColor }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex justify-center py-4">
                                <div className="bg-destructive/10 text-destructive text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" />
                                    {error}
                                    <button onClick={() => createConversation()} className="underline font-bold hover:no-underline ml-1">
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/5">
                        <div
                            className="relative flex items-end gap-2 bg-secondary/30 hover:bg-secondary/50 focus-within:bg-white dark:focus-within:bg-zinc-900 rounded-xl border border-border/40 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1.5 px-2"
                            style={config.theme?.inputBackgroundColor ? { backgroundColor: config.theme.inputBackgroundColor } : undefined}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder={config.placeholderText || "Type a message..."}
                                disabled={loading || Boolean(error)}
                                className="flex-1 bg-transparent border-none focus:outline-none p-2 min-h-[44px] max-h-[120px] text-sm resize-none placeholder:text-muted-foreground/50 transition-colors"
                                style={{
                                    color: config.theme?.inputTextColor || 'inherit'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading || Boolean(error)}
                                className="p-2 rounded-lg text-white transition-all disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95 shrink-0 mb-0.5 flex items-center justify-center"
                                style={{ backgroundColor: primaryColor }}
                                aria-label="Send message"
                            >
                                <SendHorizontal className="w-4 h-4" style={{ transform: 'rotate(0deg)' }} />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <a href="https://wata.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-muted-foreground/40 hover:text-primary transition-colors">
                                Powered by WataAI
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
