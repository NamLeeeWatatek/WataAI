'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { botsApi, type Bot } from '@/lib/api/bots'
import { getKnowledgeBases } from '@/lib/api/knowledge-base'
import type { AiConversation, AiMessage } from '@/lib/types/conversations'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import {
    MessageCircle,
    Settings,
    Zap,
    Book,
    Check,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    X,
} from 'lucide-react'
import { AiChatInterface } from '@/components/features/chat/AiChatInterface'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { MessageRole } from '@/lib/types/conversations'

import { useConversations } from '@/lib/hooks/features/useConversations'
import { useBots } from '@/lib/hooks/features/useBots'
import { useQuery } from '@tanstack/react-query'
import { useAiChat } from '@/lib/hooks/features/useAiChat'

export default function ChatWithAIPage() {
    const { currentWorkspace } = useWorkspace()
    const {
        conversations,
        isLoading: loadingConversations,
        createConversation,
        updateConversation,
        deleteConversation
    } = useConversations()

    const { chatWithKB, chatWithBot } = useAiChat()

    const { data: botsData } = useBots(currentWorkspace?.id, { status: 'active' })
    const bots = botsData?.data || []

    const { data: knowledgeBases = [] } = useQuery({
        queryKey: ['knowledge-bases', currentWorkspace?.id],
        queryFn: async () => {
            if (!currentWorkspace?.id) return []
            const data: any = await getKnowledgeBases({ workspaceId: currentWorkspace.id, limit: 100 })
            return Array.isArray(data) ? data : (data?.data || [])
        },
        enabled: !!currentWorkspace?.id
    })

    const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null)
    const [messages, setMessages] = useState<AiMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        botId: 'none',
        useKnowledgeBase: false,
        knowledgeBaseIds: [] as string[]
    })
    const [showSettings, setShowSettings] = useState(false)
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
    const [creatingState, setCreatingState] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)

    // ✅ SENIOR: Derived state for "Dirty" check
    const isConfigDirty = useMemo(() => {
        if (!currentConversation) return false;

        const currentBotId = currentConversation.botId || 'none';
        const currentUseKB = !!currentConversation.useKnowledgeBase;
        const currentKBIds = Array.isArray(currentConversation.metadata?.knowledgeBaseIds)
            ? currentConversation.metadata.knowledgeBaseIds
            : [];

        const botChanged = config.botId !== currentBotId;
        const useKBChanged = config.useKnowledgeBase !== currentUseKB;

        // Array comparison for knowledge base selection
        const kbIdsChanged = config.knowledgeBaseIds.length !== currentKBIds.length ||
            !config.knowledgeBaseIds.every(id => currentKBIds.includes(id)) ||
            !currentKBIds.every(id => config.knowledgeBaseIds.includes(id));

        return botChanged || useKBChanged || kbIdsChanged;
    }, [config, currentConversation]);

    // ✅ SENIOR: Auto-save settings with debounce
    useEffect(() => {
        if (!currentConversation || !isConfigDirty) return;

        const timer = setTimeout(() => {
            handleUpdateConversationSettings();
        }, 1000); // 1s auto-save delay

        return () => clearTimeout(timer);
    }, [config, isConfigDirty, currentConversation]);

    const createNewConversation = async () => {
        if (creatingState) return
        try {
            setCreatingState(true)
            const newConv = await createConversation({
                title: 'New Chat',
                botId: config.botId !== 'none' ? config.botId : undefined,
                useKnowledgeBase: config.useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: config.knowledgeBaseIds,
                },
            })
            setCurrentConversation(newConv)
            setMessages([])
        } catch {
            // Toast handled in hook
        } finally {
            setCreatingState(false)
        }
    }

    const selectConversation = (conv: AiConversation) => {
        if (currentConversation?.id === conv.id) return;
        setCurrentConversation(conv)
        setMessages(conv.messages || [])
        setConfig({
            botId: conv.botId || 'none',
            useKnowledgeBase: !!conv.useKnowledgeBase,
            knowledgeBaseIds: Array.isArray(conv.metadata?.knowledgeBaseIds)
                ? conv.metadata.knowledgeBaseIds
                : []
        })
    }

    const handleUpdateTitle = async (id: string, title: string) => {
        if (!title.trim() || title === currentConversation?.title) {
            setEditingConversationId(null)
            return
        }
        try {
            await updateConversation({ id, data: { title } })
            if (currentConversation?.id === id) {
                setCurrentConversation({ ...currentConversation, title })
            }
        } catch { }
        setEditingConversationId(null)
    }

    const confirmDelete = async () => {
        if (!conversationToDelete) return
        try {
            await deleteConversation(conversationToDelete)
            if (currentConversation?.id === conversationToDelete) {
                setCurrentConversation(null)
                setMessages([])
            }
        } catch { }
        setDeleteDialogOpen(false)
        setConversationToDelete(null)
    }

    const handleSend = async (input: string) => {
        if (!input.trim() || loading) return

        let conversationId = currentConversation?.id
        let activeConv = currentConversation

        if (!conversationId) {
            try {
                setCreatingState(true)
                const newConv = await createConversation({
                    title: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
                    botId: config.botId !== 'none' ? config.botId : undefined,
                    useKnowledgeBase: config.useKnowledgeBase,
                    metadata: {
                        knowledgeBaseIds: config.knowledgeBaseIds,
                    },
                })
                conversationId = newConv.id
                activeConv = newConv
                setCurrentConversation(newConv)
                setMessages([])
            } catch (error) {
                setCreatingState(false)
                return
            } finally {
                setCreatingState(false)
            }
        }

        const userMessage: AiMessage = {
            role: MessageRole.USER,
            content: input,
            timestamp: new Date().toISOString(),
        }

        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setLoading(true)

        try {
            let responseText = ''
            let sources: any[] = []
            let modelName = config.botId !== 'none'
                ? bots.find((b: Bot) => b.id === config.botId)?.aiModelName || 'gemini-2.0-flash'
                : 'gemini-2.0-flash'

            if (config.botId !== 'none') {
                const res = await chatWithBot({
                    botId: config.botId,
                    message: input,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    knowledgeBaseIds: config.useKnowledgeBase ? config.knowledgeBaseIds : undefined
                })
                responseText = res.response
                sources = res.sources || []
            } else {
                const res: any = await chatWithKB({
                    message: input,
                    model: modelName,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    knowledgeBaseIds: config.useKnowledgeBase ? config.knowledgeBaseIds : undefined
                })
                responseText = res.answer || res.response || 'No response'
            }

            const assistantMessage: AiMessage = {
                role: MessageRole.ASSISTANT,
                content: responseText,
                timestamp: new Date().toISOString(),
                metadata: {
                    bot: config.botId !== 'none' ? bots.find((b: Bot) => b.id === config.botId)?.name : undefined,
                    model: modelName,
                    sources: sources.length > 0 ? sources : undefined,
                },
            }

            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            if (conversationId) {
                await updateConversation({ id: conversationId, data: { messages: finalMessages } })
            }
        } catch (error) {
            toast.error('Failed to get AI response')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateConversationSettings = async () => {
        if (!currentConversation) return
        try {
            setSavingSettings(true)
            const updated = await updateConversation({
                id: currentConversation.id,
                data: {
                    botId: config.botId !== 'none' ? config.botId : null as any,
                    useKnowledgeBase: config.useKnowledgeBase,
                    metadata: {
                        ...currentConversation.metadata,
                        knowledgeBaseIds: config.knowledgeBaseIds,
                    },
                }
            })
            setCurrentConversation(updated)
            toast.success('Settings auto-saved')
        } catch { }
        finally { setSavingSettings(false) }
    }

    const clearChat = () => {
        setCurrentConversation(null)
        setMessages([])
        toast.success('Ready for new chat')
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently'
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return 'Recently'
            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            if (days === 0) return 'Today'
            if (days === 1) return 'Yesterday'
            if (days < 7) return `${days} days ago`
            return date.toLocaleDateString()
        } catch { return 'Recently' }
    }

    return (
        <div className="h-full w-full flex bg-background overflow-hidden relative">
            {/* Sidebar */}
            <aside className="w-80 border-r border-border/40 flex flex-col bg-muted/20 shrink-0 h-full overflow-hidden">
                <div className="p-4 border-b border-border/40">
                    <Button
                        onClick={createNewConversation}
                        className="w-full rounded-xl shadow-md shadow-primary/10"
                        size="lg"
                        loading={creatingState}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Chat
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Spinner size="lg" className="text-primary" />
                            <p className="text-sm text-muted-foreground">Syncing history...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-4 italic text-muted-foreground text-sm">
                            No active conversations logic.
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${currentConversation?.id === conv.id
                                    ? 'bg-primary/10 border border-primary/40 shadow-sm'
                                    : 'hover:bg-muted/50 border border-transparent'
                                    }`}
                                onClick={() => selectConversation(conv)}
                            >
                                {editingConversationId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => handleUpdateTitle(conv.id, editingTitle)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle(conv.id, editingTitle)}
                                        className="w-full px-2 py-1 text-sm border rounded bg-background"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm truncate">{conv.title}</h3>
                                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                                                    {formatDate(conv.updatedAt)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingConversationId(conv.id)
                                                        setEditingTitle(conv.title)
                                                    }}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setConversationToDelete(conv.id)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AiChatInterface
                    messages={messages}
                    onSendMessage={handleSend}
                    loading={loading}
                    botName={bots.find((b: Bot) => b.id === config.botId)?.name || 'AI Assistant'}
                    modelName={bots.find((b: Bot) => b.id === config.botId)?.aiModelName || undefined}
                    className="flex-1"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showSettings ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                                className="rounded-xl"
                            >
                                <Settings className="w-3.5 h-3.5 mr-2" />
                                Settings
                            </Button>
                            {currentConversation && (
                                <Button variant="outline" size="sm" onClick={clearChat} className="rounded-xl">
                                    <Plus className="w-3.5 h-3.5 mr-2" /> New Chat
                                </Button>
                            )}
                        </div>
                    }
                    title={currentConversation?.title || 'New Chat'}
                    subtitle={currentConversation ? `${messages.length} interactions` : 'Quantum intelligence engine active'}
                />
            </div>

            {/* Config Sidebar */}
            {showSettings && (
                <aside
                    className="w-96 border-l border-border/40 bg-background flex flex-col shadow-2xl z-20"
                >
                    <div className="p-6 border-b flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            Intelligence Config
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-8 overflow-y-auto">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground">Sync Status</span>
                            <div className="flex items-center gap-2 text-primary">
                                {savingSettings ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {savingSettings ? 'Syncing...' : 'Encrypted & Synced'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary" /> Model Routing
                            </label>
                            <Tabs defaultValue={config.botId === 'none' ? 'system' : 'user'} onValueChange={(v) => v === 'system' && setConfig(p => ({ ...p, botId: 'none' }))}>
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="system">Pure AI</TabsTrigger>
                                    <TabsTrigger value="user">My Bots</TabsTrigger>
                                </TabsList>
                                <TabsContent value="user" className="space-y-2 pt-2">
                                    {bots.map((bot: Bot) => (
                                        <Card
                                            key={bot.id}
                                            className={cn("p-3 cursor-pointer border-2 transition-all", config.botId === bot.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50")}
                                            onClick={() => setConfig(p => ({ ...p, botId: bot.id }))}
                                        >
                                            <div className="text-xs font-bold">{bot.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{bot.aiModelName}</div>
                                        </Card>
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold flex items-center gap-2">
                                    <Book className="w-3.5 h-3.5 text-primary" /> Knowledge RAG
                                </label>
                                <input
                                    type="checkbox"
                                    checked={config.useKnowledgeBase}
                                    onChange={e => setConfig(p => ({ ...p, useKnowledgeBase: e.target.checked }))}
                                />
                            </div>
                            {config.useKnowledgeBase && (
                                <div className="space-y-2">
                                    {knowledgeBases.map((kb: KnowledgeBase) => (
                                        <Card
                                            key={kb.id}
                                            className={cn("p-2 cursor-pointer border-2", config.knowledgeBaseIds.includes(kb.id) ? "border-primary bg-primary/5" : "border-transparent")}
                                            onClick={() => setConfig(p => ({
                                                ...p,
                                                knowledgeBaseIds: config.knowledgeBaseIds.includes(kb.id)
                                                    ? p.knowledgeBaseIds.filter(id => id !== kb.id)
                                                    : [...p.knowledgeBaseIds, kb.id]
                                            }))}
                                        >
                                            <div className="text-xs font-bold truncate">{kb.name}</div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            <AlertDialogConfirm
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Erase Memory"
                description="This protocol will permanently delete this conversation history. Reconstitution is impossible."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
