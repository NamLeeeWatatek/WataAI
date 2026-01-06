'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import type { Message } from '@/lib/types'
import { MessageRole } from '@/lib/types/conversations'
import { useAIModels } from '@/lib/hooks/useAIModels'

export function AIFloatingButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const { getDefaultModel, loading: modelsLoading } = useAIModels()
    const [model, setModel] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (!modelsLoading && !model) {
            setModel(getDefaultModel())
        }
    }, [modelsLoading, getDefaultModel, model])

    const handleOpenFullChat = () => {
        router.push('/ai-assistant' as any)
        setIsOpen(false)
    }

    const handleQuickSend = async () => {
        if (!message.trim() || loading) return

        const userMessage = message
        setMessage('')
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: MessageRole.USER,
            content: userMessage,
            timestamp: new Date().toISOString()
        }])
        setLoading(true)

        try {
            const response: any = await axiosClient.post('',)

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: MessageRole.ASSISTANT,
                content: response.response,
                timestamp: new Date().toISOString()
            }])
        } catch {
            toast.error('Failed to get response: ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>

            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen ? (
                    <Button
                        onClick={() => setIsOpen(true)}
                        size="icon"
                        className="w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-500 overflow-visible group"
                    >
                        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(var(--success),0.5)]" />
                    </Button>
                ) : (
                    <Card className="rounded-2xl shadow-2xl border border-border/40 w-[400px] overflow-hidden flex flex-col max-h-[600px] bg-background/80 backdrop-blur-2xl">
                        <div className="bg-primary p-5 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-white">
                                    <div className="font-black text-sm uppercase tracking-wider">AI Assistant</div>
                                    <div className="text-[10px] font-bold opacity-70 flex items-center gap-1.5">
                                        <div className="size-1.5 rounded-full bg-success animate-pulse" />
                                        Always here to help
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>


                        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
                            {messages.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Quick questions:
                                    </p>
                                    <button
                                        onClick={() => setMessage('How do I create a workflow?')}
                                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                    >
                                        How do I create a workflow?
                                    </button>
                                    <button
                                        onClick={() => setMessage('Help me with automation')}
                                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                    >
                                        Help me with automation
                                    </button>
                                    <button
                                        onClick={() => setMessage('Explain AI nodes')}
                                        className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                    >
                                        Explain AI nodes
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm",
                                                    msg.role === MessageRole.USER
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-muted/50 border border-border/40 rounded-tl-none'
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex gap-2">
                                            <div className="glass border border-border/40 rounded-lg px-3 py-2">
                                                <Loader2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>


                        <div className="p-5 border-t border-border/20 space-y-3 bg-muted/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickSend()}
                                    placeholder="Type your question..."
                                    disabled={loading}
                                    className="flex-1 bg-background/50 rounded-xl px-4 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all font-medium"
                                />
                                <Button
                                    onClick={handleQuickSend}
                                    disabled={!message.trim() || loading}
                                    className="shadow-md"
                                    size="icon"
                                >
                                    {loading ? <Loader2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                            <Button
                                onClick={handleOpenFullChat}
                                variant="outline"
                                className="w-full text-[10px] font-black uppercase tracking-widest border-none h-8 opacity-60 hover:opacity-100"
                                size="sm"
                            >
                                Open Full Intelligence Suite
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </>
    )
}
