'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center text-white group"
                    >
                        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </button>
                ) : (
                    <div className="glass rounded-2xl shadow-2xl border border-border/40 w-96 overflow-hidden flex flex-col max-h-[600px]">

                        <div className="bg-slate-700 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-white">
                                    <div className="font-semibold">AI Assistant</div>
                                    <div className="text-xs opacity-80">Always here to help</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
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
                                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === MessageRole.USER
                                                    ? 'bg-primary text-white'
                                                    : 'glass border border-border/40'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex gap-2">
                                            <div className="glass border border-border/40 rounded-lg px-3 py-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>


                        <div className="p-4 border-t border-border/40 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickSend()}
                                    placeholder="Type your question..."
                                    disabled={loading}
                                    className="flex-1 glass rounded-lg px-3 py-2 text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleQuickSend}
                                    disabled={!message.trim() || loading}
                                    className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <Button
                                onClick={handleOpenFullChat}
                                variant="ghost"
                                className="w-full"
                                size="sm"
                            >
                                Open Full Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
