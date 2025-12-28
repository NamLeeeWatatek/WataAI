import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { MessageSquare, Trash2, Send } from 'lucide-react'
import { createAIConversation, getAIConversation, addAIConversationMessage } from '@/lib/api/conversations'
import toast from '@/lib/toast'
import { MessageRole } from '@/lib/types/conversations'

interface KBChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBaseId: string
    knowledgeBaseName: string
}

interface Message {
    id: string
    role: MessageRole
    content: string
    createdAt: string
}

export function KBChatDialog({ open, onOpenChange, knowledgeBaseId, knowledgeBaseName }: KBChatDialogProps) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)

    useEffect(() => {
        if (open && !conversationId) {
            initConversation()
        }
    }, [open])

    const initConversation = async () => {
        try {
            setLoadingMessages(true)

            const conversation = await createAIConversation({
                title: `Chat with ${knowledgeBaseName}`,
                useKnowledgeBase: true,
            })

            setConversationId(conversation.id)

            const fullConversation = await getAIConversation(conversation.id)
            setMessages((fullConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as MessageRole,
                content: m.content,
                createdAt: m.createdAt,
            })))
        } catch {

            toast.error('Failed to start conversation')
        } finally {
            setLoadingMessages(false)
        }
    }

    const handleChat = async () => {
        if (!message.trim() || !conversationId) return

        const userMessage = message
        setMessage('')
        setLoading(true)

        const tempUserMsg: Message = {
            id: 'temp-' + Date.now(),
            role: MessageRole.USER,
            content: userMessage,
            createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, tempUserMsg])

        try {
            const updatedConversation = await addAIConversationMessage(conversationId, {
                content: userMessage,
                role: MessageRole.USER,
                timestamp: new Date().toISOString(),
                metadata: {
                    knowledgeBaseId,
                    useKnowledgeBase: true,
                },
            })

            const userMessages = (updatedConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as MessageRole,
                content: m.content,
                createdAt: m.createdAt || m.timestamp,
            }))
            setMessages(userMessages)

            const { generateKBAnswer } = await import('@/lib/api/knowledge-base')
            const answerResponse = await generateKBAnswer({
                question: userMessage,
                knowledgeBaseId,
                conversationHistory: userMessages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            })

            const finalConversation = await addAIConversationMessage(conversationId, {
                content: answerResponse.answer,
                role: MessageRole.ASSISTANT,
                timestamp: new Date().toISOString(),
                metadata: {
                    sources: answerResponse.sources,
                },
            })

            setMessages((finalConversation.messages || []).map((m: any) => ({
                id: m.id,
                role: m.role as MessageRole,
                content: m.content,
                createdAt: m.createdAt || m.timestamp,
            })))
        } catch {

            toast.error('Failed to send message')
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
        } finally {
            setLoading(false)
        }
    }

    const handleClear = async () => {
        if (!conversationId) return

        try {
            await initConversation()
            toast.success('Conversation cleared')
        } catch {
            toast.error('Failed to clear conversation')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Chat with AI</DialogTitle>
                        {messages.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClear} className="rounded-full text-xs hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                New Chat
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-4">
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <LoadingLogo size="md" text="Loading conversation..." />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/5">
                                <MessageSquare className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <p className="font-bold text-foreground">Intelligence Interface</p>
                            <p className="text-sm mt-1">Ask questions about your knowledge base</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    className={`p-4 ${msg.role === MessageRole.USER
                                        ? 'bg-muted ml-8'
                                        : 'bg-primary/5 border-primary/20 mr-8'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="font-medium text-xs text-muted-foreground uppercase">
                                            {msg.role === MessageRole.USER ? 'You' : 'AI'}
                                        </div>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap mt-1">{msg.content}</p>
                                </Card>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <LoadingLogo size="sm" text="Thinking..." />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleChat()}
                        disabled={loading}
                    />
                    <Button onClick={handleChat} loading={loading} disabled={!message.trim()} className="rounded-xl h-12 w-12 p-0">
                        {!loading && <Send className="w-5 h-5" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

