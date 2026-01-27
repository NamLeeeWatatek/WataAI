'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { usePublicBot } from '@/lib/hooks/features/usePublicBot'
import { useTranslation } from 'react-i18next'
import { MarkdownRenderer } from '@/components/features/widget/MarkdownRenderer'
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PublicBotLanding } from '@/components/features/public-bot/PublicBotLanding'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Spinner } from '@/components/ui/Spinner'

interface GuestIdentity {
    name: string;
    phone: string;
}

export default function PublicBotPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const botId = params.id as string
    const mode = searchParams.get('mode')
    const isEmbedMode = mode === 'iframe'

    // Check if we are inside an iframe (any mode)
    const [isInsideIframe, setIsInsideIframe] = useState(false)

    useEffect(() => {
        setIsInsideIframe(window.self !== window.top)
    }, [])

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
    const [isOpen, setIsOpen] = useState(isEmbedMode)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Identity State
    const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(null)
    const [showIdentityForm, setShowIdentityForm] = useState(false)
    const [identityName, setIdentityName] = useState('')
    const [identityPhone, setIdentityPhone] = useState('')

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

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

    const { t } = useTranslation()

    const handleSend = async () => {
        if (!input.trim() || loading || !conversationId) return

        const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMessage])
        const messageText = input
        setInput('')
        setLoading(true)

        try {
            const data = await sendMessage({ conversationId, message: messageText });

            if (!data.content && (!data.metadata?.sources || data.metadata.sources.length === 0)) {
                // Empty response and no sources - treat as error or empty state
                throw new Error('Empty response from bot');
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content || t('chat.noContentGenerated', { defaultValue: 'I found some information but couldn\'t generate a text response.' }),
                timestamp: data.timestamp,
                metadata: data.metadata,
            }])
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('error.general', { defaultValue: 'Sorry, something went wrong. Please try again.' }),
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
        }
    }

    if (isBotLoading) return (
        <div className="flex items-center justify-center w-full h-screen bg-background">
            <Spinner size="lg" />
        </div>
    );

    if (!bot) return null;

    const primaryColor = bot.theme?.primaryColor || '#000000';

    return (
        <>
            <title>{bot.name}</title>

            {/* Landing Page Mode - Main View */}
            {!isInsideIframe && !isEmbedMode && (
                <div className="fixed inset-0 z-0 overflow-hidden bg-background">
                    <PublicBotLanding bot={bot} onStartChat={() => setIsOpen(true)} />
                </div>
            )}

            {/* Toggle Button (Floating) - Hidden in Embed Mode */}
            {!isEmbedMode && (
                <div
                    className={cn(
                        "fixed z-[50] transition-all duration-300 ease-in-out",
                        isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
                        bot.theme?.position?.includes('left') ? 'left-6' : 'right-6',
                        bot.theme?.position?.includes('top') ? 'top-6' : 'bottom-6'
                    )}
                >
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-transform"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => setIsOpen(true)}
                    >
                        <MessageCircle className="w-8 h-8 text-white" />
                    </Button>
                </div>
            )}

            {/* Main Chat Container */}
            <div
                className={cn(
                    "fixed z-[40] overflow-hidden flex flex-col font-sans text-foreground transition-all duration-300 shadow-2xl",
                    isEmbedMode
                        ? "inset-0 w-full h-full rounded-none"
                        : cn(
                            "bottom-6 right-6 w-[400px] max-h-[700px] h-[calc(100vh-48px)] rounded-2xl border border-border/50",
                            !isOpen && "translate-y-[120%] opacity-0 pointer-events-none"
                        ),
                    !isEmbedMode && "sm:max-w-md max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
                )}
                style={{
                    backgroundColor: bot.theme?.backgroundColor || '#ffffff',
                    color: bot.theme?.botMessageTextColor || '#000000'
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b backdrop-blur-sm z-10 shrink-0"
                    style={{
                        backgroundColor: bot.theme?.backgroundColor ? `${bot.theme.backgroundColor}F2` : 'rgba(255,255,255,0.95)', // 95% opacity
                        borderColor: 'rgba(0,0,0,0.1)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                            <AvatarImage src={bot.avatarUrl} alt={bot.name} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                <Bot className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold leading-none tracking-tight">{bot.name}</h3>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </span>
                        </div>
                    </div>

                    {!isEmbedMode && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative bg-muted/5 flex flex-col">
                    {showIdentityForm ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <Card className="w-full max-w-sm shadow-xl border-border/60">
                                <CardHeader className="text-center pb-2">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                                    </div>
                                    <CardTitle className="text-xl font-bold">{t('common.welcome', { defaultValue: 'Welcome!' })}</CardTitle>
                                    <CardDescription>
                                        {t('publicBot.identitySubtitle', { defaultValue: 'Please introduce yourself to start chatting.' })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleIdentitySubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder={t('login.name', { defaultValue: 'Your Name (Optional)' })}
                                                value={identityName}
                                                onChange={(e) => setIdentityName(e.target.value)}
                                                className="h-11 bg-background"
                                                style={{ color: '#000000' }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                type="tel"
                                                placeholder={t('login.phone', { defaultValue: 'Phone Number (Required)' })}
                                                value={identityPhone}
                                                onChange={(e) => setIdentityPhone(e.target.value)}
                                                required
                                                className="h-11 bg-background"
                                                style={{ color: '#000000' }}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-11 font-bold text-base shadow-lg transition-all active:scale-[0.98]"
                                            disabled={loading}
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('publicBot.startChatting', { defaultValue: 'Start Chatting' })}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="justify-center pt-0 pb-6 text-xs text-muted-foreground">
                                    Powered by WataAI
                                </CardFooter>
                            </Card>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 px-4">
                            <div className="flex flex-col gap-6 py-6 pb-4 max-w-3xl mx-auto min-h-full">
                                {messages.map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                                isUser ? "flex-row-reverse" : "flex-row"
                                            )}
                                        >
                                            <Avatar className="h-8 w-8 shrink-0 border mt-1">
                                                {isUser ? (
                                                    <AvatarFallback className="bg-zinc-100 text-zinc-600">
                                                        <User className="w-4 h-4" />
                                                    </AvatarFallback>
                                                ) : (
                                                    <>
                                                        <AvatarImage src={bot.avatarUrl} className="object-cover" />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            <Bot className="w-4 h-4" />
                                                        </AvatarFallback>
                                                    </>
                                                )}
                                            </Avatar>

                                            <div className={cn(
                                                "flex flex-col max-w-[85%] lg:max-w-[75%]",
                                                isUser ? "items-end" : "items-start"
                                            )}>
                                                <div className={cn(
                                                    "px-4 py-3 text-sm leading-relaxed shadow-sm",
                                                    isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm border"
                                                )}
                                                    style={{
                                                        backgroundColor: isUser ? (bot.theme?.userMessageColor || '#f4f4f5') : (bot.theme?.botMessageColor || '#ffffff'),
                                                        color: isUser ? (bot.theme?.userMessageTextColor || '#000000') : (bot.theme?.botMessageTextColor || '#000000'),
                                                        borderColor: !isUser ? '#e4e4e7' : 'transparent'
                                                    }}
                                                >
                                                    <MarkdownRenderer content={msg.content} />
                                                </div>
                                                {isUser && msg.timestamp && (
                                                    <span className="text-[10px] text-muted-foreground mt-1 mr-1 opacity-70">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                {loading && (
                                    <div className="flex w-full gap-4 animate-in fade-in">
                                        <Avatar className="h-8 w-8 shrink-0 border mt-1">
                                            <AvatarImage src={bot.avatarUrl} />
                                            <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="bg-white border text-foreground rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                            <div className="flex space-x-1.5 h-5 items-center">
                                                <div className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-px w-full" />
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Footer Input */}
                {!showIdentityForm && (
                    <div className="p-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'transparent' }}>
                        <div className="max-w-3xl mx-auto relative flex items-end gap-2">
                            <div className="relative flex-1 rounded-3xl border shadow-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                                style={{
                                    backgroundColor: bot.theme?.inputBackgroundColor || '#ffffff',
                                    borderColor: 'rgba(0,0,0,0.1)'
                                }}
                            >
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={loading}
                                    placeholder={bot.placeholderText || t('chat.typeMessage', { defaultValue: 'Message...' })}
                                    className="min-h-[44px] w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                                    rows={1}
                                    style={{
                                        color: bot.theme?.inputTextColor || '#000000'
                                    }}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className={cn(
                                        "absolute right-1.5 bottom-1.5 h-8 w-8 rounded-full transition-all",
                                        input.trim() ? "opacity-100 scale-100" : "opacity-0 scale-75"
                                    )}
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Send className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 opacity-50">
                                <Sparkles className="w-3 h-3" /> AI can make mistakes. Check important info.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
