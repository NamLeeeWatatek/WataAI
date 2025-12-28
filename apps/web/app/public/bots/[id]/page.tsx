'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function PublicBotPage() {
    const params = useParams()
    const botId = params.id as string
    const [bot, setBot] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadBot()
        createConversation()
    }, [botId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadBot = async () => {
        try {
            const response = await fetch(`${API_URL}/public/bots/${botId}/config`)
            if (!response.ok) throw new Error('Failed to load bot')
            const data = await response.json()
            setBot(data)
            
            if (data.welcomeMessage) {
                setMessages([{
                    role: 'assistant',
                    content: data.welcomeMessage,
                    timestamp: new Date().toISOString()
                }])
            }
        } catch {
        }
    }

    const createConversation = async () => {
        try {
            const response = await fetch(`${API_URL}/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    } 
                }),
            })
            if (!response.ok) throw new Error('Failed to create conversation')
            const data = await response.json()
            setConversationId(data.conversationId)
        } catch {
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return

        const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMessage])
        const messageText = input
        setInput('')
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            })
            if (!response.ok) throw new Error('Failed to send message')
            
            const data = await response.json()
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                timestamp: data.timestamp,
                metadata: data.metadata,
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    if (!bot) return null

    const primaryColor = bot.theme?.primaryColor || '#667eea'
    const position = bot.theme?.position || 'bottom-right'
    const buttonSize = bot.theme?.buttonSize === 'large' ? '64px' : 
                      bot.theme?.buttonSize === 'small' ? '48px' : '56px'

    return (
        <>
            <style jsx global>{`
                * { 
                    box-sizing: border-box; 
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    overflow: hidden;
                }
            `}</style>

            {}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    [position.includes('right') ? 'right' : 'left']: '20px',
                    [position.includes('bottom') ? 'bottom' : 'top']: '20px',
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
            >
                <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    )}
                </svg>
            </button>

            {}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    [position.includes('right') ? 'right' : 'left']: '20px',
                    [position.includes('bottom') ? 'bottom' : 'top']: `calc(20px + ${buttonSize} + 20px)`,
                    width: '380px',
                    maxWidth: 'calc(100vw - 40px)',
                    height: '600px',
                    maxHeight: 'calc(100vh - 140px)',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 999998,
                    overflow: 'hidden',
                }}>
                    {}
                    <div style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
                        color: 'white',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexShrink: 0,
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {bot.name}
                            </h3>
                            {bot.description && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {bot.description}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    {}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        background: '#f9fafb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    wordWrap: 'break-word',
                                    background: msg.role === 'user' ? primaryColor : 'white',
                                    color: msg.role === 'user' ? 'white' : '#1f2937',
                                    border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{ padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: '8px',
                                                height: '8px',
                                                background: '#9ca3af',
                                                borderRadius: '50%',
                                                animation: 'bounce 1.4s infinite ease-in-out both',
                                                animationDelay: `${-0.32 + i * 0.16}s`,
                                            }}/>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {}
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid #e5e7eb',
                        background: 'white',
                        display: 'flex',
                        gap: '8px',
                        flexShrink: 0,
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={bot.placeholderText || 'Nhập tin nhắn...'}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            style={{
                                padding: '10px 16px',
                                background: primaryColor,
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading || !input.trim() ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && input.trim()) e.currentTarget.style.opacity = '0.9'
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && input.trim()) e.currentTarget.style.opacity = '1'
                            }}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                @media (max-width: 480px) {
                    div[style*="width: 380px"] {
                        width: 100vw !important;
                        height: 100vh !important;
                        max-width: 100vw !important;
                        max-height: 100vh !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        left: 0 !important;
                        top: 0 !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </>
    )
}

function adjustColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}
