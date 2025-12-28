'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { MessageRole } from '@/lib/types/conversations'

interface Message {
    role: MessageRole
    content: string
    timestamp: string
    metadata?: any
}

interface BotConfig {
    botId: string
    name: string
    description?: string
    avatarUrl?: string
    welcomeMessage: string
    placeholderText: string
    theme: {
        primaryColor: string
        position: string
        buttonSize: string
        showAvatar: boolean
        showTimestamp: boolean
    }
}

interface ChatWidgetProps {
    botId: string
    apiUrl?: string
}

export function ChatWidget({ botId, apiUrl = '/api/v1' }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<BotConfig | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadConfig()
    }, [botId])

    useEffect(() => {
        if (isOpen && !conversationId) {
            createConversation()
        }
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConfig = async () => {
        try {
            const response = await fetch(`${apiUrl}/public/bots/${botId}/config`)
            if (response.ok) {
                const data = await response.json()
                setConfig(data)
            }
        } catch {
        }
    }

    const createConversation = async () => {
        try {
            const response = await fetch(`${apiUrl}/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    metadata: {
                        url: window.location.href,
                        referrer: document.referrer,
                    },
                }),
            })
            if (response.ok) {
                const data = await response.json()
                setConversationId(data.conversationId)

                if (config?.welcomeMessage) {
                    setMessages([{
                        role: MessageRole.ASSISTANT,
                        content: config.welcomeMessage,
                        timestamp: new Date().toISOString(),
                    }])
                }
            }
        } catch {
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return

        const userMessage: Message = {
            role: MessageRole.USER,
            content: input,
            timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, userMessage])
        const messageText = input
        setInput('')
        setLoading(true)

        try {
            const response = await fetch(`${apiUrl}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            })

            if (response.ok) {
                const data = await response.json()
                const assistantMessage: Message = {
                    role: MessageRole.ASSISTANT,
                    content: data.content,
                    timestamp: data.timestamp,
                    metadata: data.metadata,
                }
                setMessages(prev => [...prev, assistantMessage])
            } else {
                throw new Error('Failed to send message')
            }
        } catch {
            setMessages(prev => [...prev, {
                role: MessageRole.ASSISTANT,
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    if (!config) return null

    const primaryColor = config.theme.primaryColor || '#3B82F6'
    const position = config.theme.position || 'bottom-right'

    return (
        <>
            { }
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed z-50 rounded-full shadow-lg transition-all hover:scale-110"
                style={{
                    backgroundColor: primaryColor,
                    [position.includes('right') ? 'right' : 'left']: '20px',
                    [position.includes('bottom') ? 'bottom' : 'top']: '20px',
                    width: config.theme.buttonSize === 'large' ? '64px' : config.theme.buttonSize === 'small' ? '48px' : '56px',
                    height: config.theme.buttonSize === 'large' ? '64px' : config.theme.buttonSize === 'small' ? '48px' : '56px',
                }}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white mx-auto" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white mx-auto" />
                )}
            </button>

            { }
            {isOpen && (
                <div
                    className="fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col"
                    style={{
                        [position.includes('right') ? 'right' : 'left']: '20px',
                        [position.includes('bottom') ? 'bottom' : 'top']: '100px',
                        width: '380px',
                        height: '600px',
                        maxHeight: 'calc(100vh - 120px)',
                    }}
                >
                    { }
                    <div
                        className="p-4 rounded-t-lg text-white flex items-center gap-3"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {config.theme.showAvatar && (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                {config.avatarUrl ? (
                                    <img src={config.avatarUrl} alt={config.name} className="w-full h-full rounded-full" />
                                ) : (
                                    <MessageCircle className="w-5 h-5" />
                                )}
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold">{config.name}</h3>
                            {config.description && (
                                <p className="text-xs opacity-90">{config.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 rounded p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    { }
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${msg.role === MessageRole.USER
                                        ? 'text-white'
                                        : 'bg-white border'
                                        }`}
                                    style={msg.role === MessageRole.USER ? { backgroundColor: primaryColor } : {}}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    {config.theme.showTimestamp && (
                                        <p className="text-xs opacity-70 mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border rounded-lg p-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    { }
                    <div className="p-4 border-t bg-white rounded-b-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder={config.placeholderText}
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

