'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
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
import { handleApiError } from '@/lib/utils/api-error'

export default function ChatWithAIPage() {
    const { t } = useTranslation()
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
            const data = await getKnowledgeBases({ workspaceId: currentWorkspace.id, limit: 100 } as any)
            const items = Array.isArray(data) ? data : data.items || []
            return items
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
                title: t('chat.newChat', { defaultValue: 'New Chat' }),
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
            id: `temp-${Date.now()}`,
            conversationId: conversationId || 'temp',
            role: MessageRole.USER,
            content: input,
            sentAt: new Date().toISOString(),
            metadata: {}
        }

        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setLoading(true)

        try {
            let responseText = ''
            let sources: unknown[] = []
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
                const res = await chatWithKB({
                    message: input,
                    model: modelName,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    knowledgeBaseIds: config.useKnowledgeBase ? config.knowledgeBaseIds : undefined
                })
                responseText = res.answer || (res as any).response || 'No response'
            }

            const assistantMessage: AiMessage = {
                id: `temp-${Date.now() + 1}`,
                conversationId: conversationId || 'temp',
                role: MessageRole.ASSISTANT,
                content: responseText,
                sentAt: new Date().toISOString(),
                metadata: {
                    bot: config.botId !== 'none' ? bots.find((b: Bot) => b.id === config.botId)?.name : undefined,
                    model: modelName,
                },
                sources: sources.length > 0 ? sources as any : undefined,
            }

            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            if (conversationId) {
                // Ensure messages match the expected type for updateConversation based on your API definition
                // If updateConversation expects a specific payload, cast or transform here
                await updateConversation({ id: conversationId, data: { messages: finalMessages } })
            }
        } catch (error) {
            const errorMessage = handleApiError(error)
            toast.error(errorMessage)

            const errorAssistantMessage: AiMessage = {
                id: `error-${Date.now()}`,
                conversationId: conversationId || 'temp',
                role: MessageRole.ASSISTANT,
                content: `❌ **AI Configuration Error:** ${errorMessage}\n\nPlease ensure you have configured an AI provider for this bot or workspace in the Settings.`,
                sentAt: new Date().toISOString(),
                metadata: {},
                isError: true,
            }
            setMessages(prev => [...prev, errorAssistantMessage])
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
                    botId: config.botId !== 'none' ? config.botId : null as unknown as string,
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
        toast.success(t('chat.readyForNewChat', { defaultValue: 'Ready for new chat' }))
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('chat.date.recently', { defaultValue: 'Recently' })
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return t('chat.date.recently', { defaultValue: 'Recently' })
            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            if (days === 0) return t('chat.date.today', { defaultValue: 'Today' })
            if (days === 1) return t('chat.date.yesterday', { defaultValue: 'Yesterday' })
            if (days < 7) return t('chat.date.daysAgo', { count: days, defaultValue: `${days} days ago` })
            return date.toLocaleDateString()
        } catch { return t('chat.date.recently', { defaultValue: 'Recently' }) }
    }

    return (
        <div className="h-full w-full flex overflow-hidden relative isolate">
            {/* Ambient Background - Shared across the whole page to ensure continuity */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />

            {/* Sidebar - Glass Panel */}
            <div className="w-80 glass border-r border-border/40 flex flex-col shrink-0 h-full overflow-hidden relative z-10">
                <div className="p-4 border-b border-border/40">
                    <Button
                        onClick={() => {
                            setEditingConversationId(null)
                            setEditingTitle('')
                            setCreatingState(true)
                            createConversation({ title: t('chat.newChat', { defaultValue: 'New Conversation' }) }, {
                                onSuccess: (data) => {
                                    setCurrentConversation(data)
                                    setMessages([])
                                    setCreatingState(false)
                                    setConfig({
                                        botId: 'none',
                                        useKnowledgeBase: false,
                                        knowledgeBaseIds: []
                                    })
                                }
                            })
                        }}
                        className="w-full shadow-md shadow-primary/10"
                        size="lg"
                        loading={creatingState}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {t('chat.newChat', { defaultValue: 'New Chat' })}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {loadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Spinner size="lg" className="text-primary" />
                            <p className="text-sm text-muted-foreground">{t('chat.syncingHistory', { defaultValue: 'Syncing history...' })}</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-4 italic text-muted-foreground text-sm">
                            {t('chat.noConversations', { defaultValue: 'No active conversations.' })}
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={cn(
                                    "group relative rounded-lg p-3 cursor-pointer transition-all duration-200 border border-transparent",
                                    currentConversation?.id === conv.id
                                        ? "glass-card border-primary/20 bg-primary/5" // Active state
                                        : "hover:bg-muted/30 hover:backdrop-blur-sm" // Hover state
                                )}
                                onClick={() => {
                                    setCurrentConversation(conv)
                                    setConfig({
                                        botId: conv.botId || 'none',
                                        useKnowledgeBase: conv.useKnowledgeBase || false,
                                        knowledgeBaseIds: (conv.metadata?.knowledgeBaseIds as string[]) || []
                                    })
                                }}
                            >
                                {editingConversationId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => {
                                            if (editingConversationId) {
                                                updateConversation({ id: editingConversationId, data: { title: editingTitle } })
                                                setEditingConversationId(null)
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editingConversationId) {
                                                updateConversation({ id: editingConversationId, data: { title: editingTitle } })
                                                setEditingConversationId(null)
                                            }
                                        }}
                                        className="glass-input w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary outline-none"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate text-foreground/90">{conv.title}</h3>
                                            <p className="text-[10px] text-muted-foreground/80 mt-1 uppercase font-bold tracking-wider">
                                                {new Date(conv.updatedAt).toLocaleDateString()}
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
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <AiChatInterface
                    messages={messages}
                    loading={loading}
                    botName={bots.find((b: Bot) => b.id === config.botId)?.name || t('chat.aiAssistant', { defaultValue: 'AI Assistant' })}
                    modelName={bots.find((b: Bot) => b.id === config.botId)?.aiModelName || undefined}
                    className="flex-1"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showSettings ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                                className={cn(showSettings ? "" : "glass")}
                            >
                                <Settings className="w-3.5 h-3.5 mr-2" />
                                {t('chat.settings', { defaultValue: 'Settings' })}
                            </Button>
                            {currentConversation && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingConversationId(null)
                                        setEditingTitle('')
                                        setCreatingState(true)
                                        createConversation({ title: t('chat.newChat', { defaultValue: 'New Conversation' }) }, {
                                            onSuccess: (data) => {
                                                setCurrentConversation(data)
                                                setMessages([])
                                                setCreatingState(false)
                                                setConfig({
                                                    botId: 'none',
                                                    useKnowledgeBase: false,
                                                    knowledgeBaseIds: []
                                                })
                                            }
                                        })
                                    }}
                                    className="glass"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-2" /> {t('chat.newChat', { defaultValue: 'New Chat' })}
                                </Button>
                            )}
                        </div>
                    }
                    title={currentConversation?.title || t('chat.newChat', { defaultValue: 'New Chat' })}
                    subtitle={currentConversation ? `${messages.length} ${t('chat.interactions', { defaultValue: 'interactions' })}` : t('chat.quantumEngineActive', { defaultValue: 'Quantum intelligence engine active' })}
                    onSendMessage={handleSend}
                />
            </div>

            {/* Config Sidebar - Glass Panel */}
            {showSettings && (
                <div
                    className="w-96 glass border-l border-border/40 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-300"
                >
                    <div className="p-6 border-b border-border/40 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                        <h3 className="font-bold flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            {t('chat.intelligenceConfig', { defaultValue: 'Intelligence Config' })}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-8 overflow-y-auto scrollbar-thin">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground">{t('chat.syncStatus', { defaultValue: 'Sync Status' })}</span>
                            <div className="flex items-center gap-2 text-primary">
                                {savingSettings ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {savingSettings ? t('chat.syncing', { defaultValue: 'Syncing...' }) : t('chat.synced', { defaultValue: 'Encrypted & Synced' })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary" /> {t('chat.modelRouting', { defaultValue: 'Model Routing' })}
                            </label>
                            <Tabs defaultValue={config.botId === 'none' ? 'system' : 'user'} onValueChange={(v) => v === 'system' && setConfig(p => ({ ...p, botId: 'none' }))} className="w-full">
                                <TabsList variant="pills" className="w-full">
                                    <TabsTrigger value="system" variant="pills" className="flex-1">{t('chat.pureAi', { defaultValue: 'Pure AI' })}</TabsTrigger>
                                    <TabsTrigger value="user" variant="pills" className="flex-1">{t('chat.myBots', { defaultValue: 'My Bots' })}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="user" className="space-y-2 pt-2">
                                    {bots.map((bot: Bot) => (
                                        <Card
                                            key={bot.id}
                                            className={cn("glass-card p-3 cursor-pointer border transition-all", config.botId === bot.id ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/30")}
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
                                    <Book className="w-3.5 h-3.5 text-primary" /> {t('chat.knowledgeRag', { defaultValue: 'Knowledge RAG' })}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={config.useKnowledgeBase}
                                    onChange={e => setConfig(p => ({ ...p, useKnowledgeBase: e.target.checked }))}
                                    className="accent-primary h-4 w-4"
                                />
                            </div>
                            {config.useKnowledgeBase && (
                                <div className="space-y-2">
                                    {knowledgeBases.map((kb: KnowledgeBase) => (
                                        <Card
                                            key={kb.id}
                                            className={cn("glass-card p-2 cursor-pointer border transition-all", config.knowledgeBaseIds.includes(kb.id) ? "border-primary bg-primary/10" : "border-border/30 hover:border-primary/30")}
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

                        <div className="pt-4 mt-4 border-t border-border/40">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={async () => {
                                    if (!currentConversation) return
                                    setSavingSettings(true)
                                    try {
                                        await updateConversation({
                                            id: currentConversation.id,
                                            data: {
                                                botId: config.botId === 'none' ? undefined : config.botId,
                                                useKnowledgeBase: config.useKnowledgeBase,
                                                metadata: {
                                                    ...currentConversation.metadata,
                                                    knowledgeBaseIds: config.knowledgeBaseIds
                                                }
                                            }
                                        })
                                        toast.success('Chat settings saved')
                                        const updatedConv = {
                                            ...currentConversation,
                                            botId: config.botId === 'none' ? undefined : config.botId,
                                            useKnowledgeBase: config.useKnowledgeBase,
                                            metadata: {
                                                ...currentConversation.metadata,
                                                knowledgeBaseIds: config.knowledgeBaseIds
                                            }
                                        }
                                        setCurrentConversation(updatedConv as AiConversation)
                                    } catch (error) {
                                        const msg = handleApiError(error)
                                        toast.error(msg || 'Failed to save settings')
                                    } finally {
                                        setSavingSettings(false)
                                    }
                                }}
                                disabled={!isConfigDirty && !savingSettings}
                                loading={savingSettings}
                            >
                                {isConfigDirty ? t('chat.saveChanges', { defaultValue: 'Save Changes' }) : t('chat.upToDate', { defaultValue: 'Up to Date' })}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialogConfirm
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={t('chat.eraseMemory', { defaultValue: 'Erase Memory' })}
                description={t('chat.deleteConfirmDesc', { defaultValue: 'This protocol will permanently delete this conversation history. Reconstitution is impossible.' })}
                onConfirm={() => {
                    if (conversationToDelete) {
                        deleteConversation(conversationToDelete)
                        if (currentConversation?.id === conversationToDelete) {
                            setCurrentConversation(null)
                            setMessages([])
                        }
                        setConversationToDelete(null)
                    }
                }}
                variant="destructive"
            />
        </div>
    )
}
