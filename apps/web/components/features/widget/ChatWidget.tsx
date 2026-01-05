'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react'
import { MessageRole } from '@/lib/types/conversations'
import { Media } from '@/components/ui/Media'
import { AnimatePresence, motion } from 'framer-motion'
import { BotWidgetConfig } from '@/lib/types/bots'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown' // Assuming you have this or similar for rendering markdown

interface Message {
    role: MessageRole
    content: string
    timestamp: string
    metadata?: Record<string, unknown>
    isError?: boolean
}

interface ChatWidgetProps {
    botId: string
    apiUrl?: string
}

export function ChatWidget({ botId, apiUrl = '/api/v1' }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<BotWidgetConfig | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isInitializing, setIsInitializing] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const hasInitialized = useRef(false)

    // Load Bot Config on Mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch(`${apiUrl}/public/bots/${botId}/config`)
                if (!response.ok) throw new Error('Failed to load bot configuration')
                const data = await response.json()
                setConfig(data)
            } catch (err) {
                console.error("Widget Config Error:", err)
                setError("Unable to load chat widget")
            }
        }
        loadConfig()
    }, [botId, apiUrl])

    // Initialize Conversation when opened
    useEffect(() => {
        if (isOpen && !conversationId && !isInitializing && !hasInitialized.current) {
            createConversation()
        }
        // Focus input on open
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const createConversation = async () => {
        setIsInitializing(true)
        setError(null)
        try {
            const response = await fetch(`${apiUrl}/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    metadata: {
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        referrer: typeof document !== 'undefined' ? document.referrer : '',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                }),
            })

            if (!response.ok) {
                const errorData = await response.json() // Try to get detailed error from backend
                throw new Error(errorData.message || 'Failed to start conversation')
            }

            const data = await response.json()
            setConversationId(data.conversationId)
            hasInitialized.current = true

            // Add welcome message if configured
            if (config?.welcomeMessage) {
                setMessages([{
                    role: MessageRole.ASSISTANT,
                    content: config.welcomeMessage,
                    timestamp: new Date().toISOString(),
                }])
            }
        } catch (err) {
            console.error("Init Error:", err)
            setError("Failed to connect to the assistant")
        } finally {
            setIsInitializing(false)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return

        const messageText = input.trim()
        setInput('')

        // Optimistic UI update
        const userMessage: Message = {
            role: MessageRole.USER,
            content: messageText,
            timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, userMessage])
        setLoading(true)

        try {
            const response = await fetch(`${apiUrl}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            })

            if (!response.ok) throw new Error('Failed to send message')

            const data = await response.json()
            const assistantMessage: Message = {
                role: MessageRole.ASSISTANT,
                content: data.content,
                timestamp: data.timestamp,
                metadata: data.metadata,
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: MessageRole.ASSISTANT,
                content: "I'm having trouble connecting right now. Please try again.",
                timestamp: new Date().toISOString(),
                isError: true
            }])
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch {
            return ''
        }
    }

    if (error && !isOpen) return null // Hide if broken and closed
    if (!config) return null // Loading state implicitly handled by having nothing

    const primaryColor = config.theme.primaryColor || '#3B82F6'

    // safe positioning logic
    const pos = config.theme.position || 'bottom-right'
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
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="rounded-full shadow-xl flex items-center justify-center text-white transition-shadow hover:shadow-2xl"
                        style={{
                            ...positionStyles,
                            backgroundColor: primaryColor,
                            width: config.theme.buttonSize === 'large' ? '64px' : '56px',
                            height: config.theme.buttonSize === 'large' ? '64px' : '56px',
                        }}
                    >
                        <MessageCircle className="w-7 h-7" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "fixed z-50 flex flex-col bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 font-sans",
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

                            {config.theme.showAvatar && (
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
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-zinc-900/50 scroll-smooth">
                            {messages.length === 0 && !loading && !error && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                                    <MessageCircle className="w-8 h-8" />
                                    <p className="text-sm">Start a conversation</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isUser = msg.role === MessageRole.USER;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
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
                                            style={isUser ? { backgroundColor: primaryColor } : {}}
                                        >
                                            {msg.isError ? (
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{msg.content}</span>
                                                </div>
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            )}

                                            {config.theme.showTimestamp && (
                                                <p className={cn(
                                                    "text-[10px] mt-1.5 opacity-60 text-right font-medium",
                                                    isUser ? "text-white/80" : "text-muted-foreground"
                                                )}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl rounded-bl-none p-4 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: primaryColor }} />
                                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: primaryColor }} />
                                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ backgroundColor: primaryColor }} />
                                        </div>
                                    </div>
                                </motion.div>
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
                            <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1.5 px-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder={config.placeholderText || "Type a message..."}
                                    disabled={loading || Boolean(error)}
                                    className="flex-1 bg-transparent border-none focus:outline-none p-2 min-h-[44px] max-h-[120px] text-sm resize-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading || Boolean(error)}
                                    className="p-2 rounded-lg text-white transition-all disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95 shrink-0 mb-0.5"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <a href="https://wata.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-muted-foreground/40 hover:text-primary transition-colors">
                                    Powered by WataAI
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

