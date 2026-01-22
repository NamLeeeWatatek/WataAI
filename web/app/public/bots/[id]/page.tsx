'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

import { usePublicBot } from '@/lib/hooks/features/usePublicBot'
import { MarkdownRenderer } from '@/components/features/widget/MarkdownRenderer'
import { MessageCircle, X, Send, User, Bot } from 'lucide-react'
import Image from 'next/image'

interface GuestIdentity {
    name: string;
    phone: string;
}

export default function PublicBotPage() {
    const params = useParams()
    const botId = params.id as string
    const {
        bot,
        isBotLoading,
        createConversation: createConv,
        sendMessage
    } = usePublicBot(botId);

    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Identity State
    const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(null)
    const [showIdentityForm, setShowIdentityForm] = useState(false)
    const [identityName, setIdentityName] = useState('')
    const [identityPhone, setIdentityPhone] = useState('')

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (bot?.welcomeMessage && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: bot.welcomeMessage,
                timestamp: new Date().toISOString()
            }])
        }
    }, [bot]);

    // Check for existing identity and resume if possible
    useEffect(() => {
        if (!isOpen) return;
        const stored = localStorage.getItem(`guest_identity_${botId}`)
        if (stored && !guestIdentity) {
            try {
                const identity = JSON.parse(stored);
                setGuestIdentity(identity);
                setShowIdentityForm(false);

                // Resume conversation silently if identity exists
                const resumeConversation = async () => {
                    try {
                        const data = await createConv({
                            url: window.location.href,
                            userAgent: navigator.userAgent,
                            guest: identity,
                            resumed: true
                        });
                        setConversationId(data.conversationId);
                    } catch (err) { }
                };
                resumeConversation();
            } catch (e) {
                setShowIdentityForm(true)
            }
        } else if (!guestIdentity) {
            setShowIdentityForm(true)
        }
    }, [isOpen, botId, guestIdentity]);

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identityPhone.trim() || loading) return;

        setLoading(true);
        const identity = {
            name: identityName,
            phone: identityPhone
        };

        try {
            // 1. Save locally for session resumption (UX)
            localStorage.setItem(`guest_identity_${botId}`, JSON.stringify(identity));

            // 2. CREATE CONVERSATION ON BACKEND IMMEDIATELY (Real storage)
            const data = await createConv({
                url: window.location.href,
                userAgent: navigator.userAgent,
                guest: identity,
                capturedAt: new Date().toISOString()
            });

            setGuestIdentity(identity);
            setConversationId(data.conversationId);
            setShowIdentityForm(false);
        } catch (err) {
            console.error('Failed to register lead:', err);
        } finally {
            setLoading(false);
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
            const data = await sendMessage({ conversationId, message: messageText });

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

    // Extended theme properties
    const borderRadius = bot.theme?.borderRadius ?? 16
    const glassmorphism = bot.theme?.glassmorphism ?? false
    const headerStyle = bot.theme?.headerStyle ?? 'solid'

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
                    background: #fdfdfd;
                }
            `}</style>


            {/* Background Preview (Marketing Website) - Clear and interactive as requested */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <iframe
                    src="/"
                    className="w-full h-full"
                    style={{ border: 'none' }}
                    title="Marketing Preview"
                />
            </div>

            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    [position.includes('right') ? 'right' : 'left']: '32px',
                    [position.includes('bottom') ? 'bottom' : 'top']: '32px',
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `0 8px 24px ${primaryColor}40`,
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'
                    e.currentTarget.style.boxShadow = `0 12px 32px ${primaryColor}60`
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${primaryColor}40`
                }}
            >
                <div className="text-white">
                    {isOpen ? (
                        <X size={28} />
                    ) : (
                        <MessageCircle size={28} />
                    )}
                </div>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    [position.includes('right') ? 'right' : 'left']: '32px',
                    [position.includes('bottom') ? 'bottom' : 'top']: `calc(32px + ${buttonSize} + 20px)`,
                    width: '400px',
                    maxWidth: 'calc(100vw - 64px)',
                    height: '650px',
                    maxHeight: 'calc(100vh - 160px)',
                    background: glassmorphism ? 'rgba(255, 255, 255, 0.85)' : 'white',
                    backdropFilter: glassmorphism ? 'blur(20px)' : 'none',
                    borderRadius: `${borderRadius}px`,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 999998,
                    overflow: 'hidden',
                    animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    {/* Header */}
                    <div style={{
                        background: headerStyle === 'minimal' ? 'white' : (headerStyle === 'gradient' ? `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, 40)})` : primaryColor),
                        color: headerStyle === 'minimal' ? '#1f2937' : 'white',
                        padding: '24px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexShrink: 0,
                        borderBottom: headerStyle === 'minimal' ? '1px solid #eee' : 'none',
                        boxShadow: headerStyle === 'minimal' ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: headerStyle === 'minimal' ? `${primaryColor}10` : 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}>
                            {bot.avatarUrl ? (
                                <Image
                                    src={bot.avatarUrl}
                                    alt={bot.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <Bot size={28} color={headerStyle === 'minimal' ? primaryColor : 'white'} />
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
                                {bot.name}
                            </h3>
                            {bot.description && (
                                <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {bot.description}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: headerStyle === 'minimal' ? '#f3f4f6' : 'rgba(0,0,0,0.1)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px',
                                cursor: 'pointer',
                                color: headerStyle === 'minimal' ? '#4b5563' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                    }}>
                        {showIdentityForm ? (
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: `${primaryColor}1a`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    color: primaryColor
                                }}>
                                    <User size={32} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>Welcome!</h4>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                                    Please enter your phone number to start chatting.
                                </p>
                                <form onSubmit={handleIdentitySubmit} style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Your Name (Optional)"
                                        value={identityName}
                                        onChange={(e) => setIdentityName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '14px',
                                            color: '#1f2937',
                                            background: '#ffffff',
                                            outline: 'none'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Required)"
                                        value={identityPhone}
                                        onChange={(e) => setIdentityPhone(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '14px',
                                            color: '#1f2937',
                                            background: '#ffffff',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: primaryColor,
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            marginTop: '8px'
                                        }}
                                    >
                                        Start Chatting
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '80%',
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            wordWrap: 'break-word',
                                            background: msg.role === 'user' ? (bot.theme?.userMessageColor || primaryColor) : (bot.theme?.botMessageColor || 'white'),
                                            color: msg.role === 'user' ? (bot.theme?.userMessageTextColor || 'white') : (bot.theme?.botMessageTextColor || '#1f2937'),
                                            border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                                        }}>
                                            <MarkdownRenderer content={msg.content} />
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <div style={{ padding: '16px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        background: primaryColor,
                                                        opacity: 0.4,
                                                        borderRadius: '50%',
                                                        animation: 'bounce 1.4s infinite ease-in-out both',
                                                        animationDelay: `${-0.32 + i * 0.16}s`,
                                                    }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Footer Input - Hide if identity form is showing */}
                    {!showIdentityForm && (
                        <div style={{
                            padding: '16px',
                            borderTop: '1px solid #e5e7eb',
                            background: 'white',
                            display: 'flex',
                            gap: '8px',
                            flexShrink: 0,
                        }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={bot.placeholderText || 'Nhập tin nhắn...'}
                                disabled={loading}
                                rows={1}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    resize: 'none',
                                    minHeight: '44px',
                                    maxHeight: '120px',
                                    fontFamily: 'inherit',
                                    color: '#1f2937',
                                    background: '#ffffff',
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
                                <Send size={20} />
                            </button>
                        </div>
                    )}
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
