'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import {
    getAIConversations,
    createAIConversation,
    updateAIConversation,
    deleteAIConversation,
} from '@/lib/api/conversations'
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
    ChevronDown,
    Sparkles,
} from 'lucide-react'
import { AiChatInterface } from '@/components/features/chat/AiChatInterface'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Badge } from '@/components/ui/Badge'
import { MessageRole } from '@/lib/types/conversations'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'

export default function ChatWithAIPage() {
    const { currentWorkspace } = useWorkspace()
    const [conversations, setConversations] = useState<AiConversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null)
    const [messages, setMessages] = useState<AiMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [bots, setBots] = useState<Bot[]>([])
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
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
    const [creatingConversation, setCreatingConversation] = useState(false)
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
            updateConversationSettings();
        }, 1000); // 1s auto-save delay

        return () => clearTimeout(timer);
    }, [config, isConfigDirty, currentConversation]);


    useEffect(() => {
        if (currentWorkspace?.id) {
            loadBots()
            loadKnowledgeBases()
        }
    }, [currentWorkspace?.id])

    useEffect(() => {
        loadConversations()
    }, [])



    const loadBots = async () => {
        try {
            if (!currentWorkspace) return
            const response: any = await botsApi.getAll(currentWorkspace.id, { status: 'active' })
            const botsData = Array.isArray(response) ? response : (response?.data || [])
            const activeBots = botsData.filter((b: Bot) => b.status === 'active')
            setBots(activeBots)
        } catch {
            toast.error('Failed to load bots')
        }
    }

    const loadKnowledgeBases = async () => {
        try {
            if (!currentWorkspace) {
                return
            }
            const data: any = await getKnowledgeBases({ workspaceId: currentWorkspace.id, limit: 100 })
            const kbList = Array.isArray(data) ? data : (data?.data || [])
            setKnowledgeBases(kbList)
        } catch {
            setKnowledgeBases([])
        }
    }

    const handleRefresh = async () => {
        await Promise.all([
            loadConversations(),
            loadBots(),
            loadKnowledgeBases()
        ])
    }

    const loadConversations = async () => {
        try {
            setLoadingConversations(true)
            const data = await getAIConversations()
            const convList = Array.isArray(data)
                ? data.filter((c: any) => c && c.id)
                : []
            setConversations(convList)
        } catch {
            setConversations([])
        } finally {
            setLoadingConversations(false)
        }
    }

    const createNewConversation = async () => {
        if (creatingConversation) return

        try {
            setCreatingConversation(true)
            const newConv = await createAIConversation({
                title: 'New Chat',
                botId: config.botId !== 'none' ? config.botId : undefined,
                useKnowledgeBase: config.useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: config.knowledgeBaseIds,
                },
            })

            setConversations((prev) => [newConv, ...prev])
            setCurrentConversation(newConv)
            setMessages([])

            toast.success('New conversation created')
        } catch {
            toast.error('Failed to create conversation')
        } finally {
            setCreatingConversation(false)
        }
    }

    const selectConversation = (conv: AiConversation) => {
        // Prevent re-selecting the same conversation
        if (currentConversation?.id === conv.id) {
            return;
        }

        console.log('[Select Conversation]', {
            id: conv.id,
            botId: conv.botId,
            useKnowledgeBase: conv.useKnowledgeBase,
            metadata: conv.metadata,
        });

        // Batch all state updates together
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

    const updateConversationTitle = async (id: string, title: string) => {
        if (!title.trim()) {
            setEditingConversationId(null)
            return
        }

        const oldConversations = [...conversations]
        const oldCurrentConversation = currentConversation

        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
        )
        if (currentConversation?.id === id) {
            setCurrentConversation({ ...currentConversation, title })
        }
        setEditingConversationId(null)

        try {
            await updateAIConversation(id, { title })
            toast.success('Title updated')
        } catch {
            setConversations(oldConversations)
            setCurrentConversation(oldCurrentConversation)
            toast.error('Failed to update title')
        }
    }

    const openDeleteDialog = (id: string) => {
        setConversationToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!conversationToDelete) return

        const id = conversationToDelete

        const oldConversations = [...conversations]
        const oldCurrentConversation = currentConversation
        const oldMessages = [...messages]

        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentConversation?.id === id) {
            setCurrentConversation(null)
            setMessages([])
        }

        try {
            await deleteAIConversation(id)
            toast.success('Conversation deleted')
        } catch {
            setConversations(oldConversations)
            setCurrentConversation(oldCurrentConversation)
            setMessages(oldMessages)
            toast.error('Failed to delete conversation')
        } finally {
            setConversationToDelete(null)
        }
    }

    const handleSend = async (input: string) => {
        if (!input.trim() || loading) return

        let conversationId = currentConversation?.id
        let newConversation: AiConversation | null = null

        if (!conversationId) {
            try {
                setCreatingConversation(true)
                const newConv = await createAIConversation({
                    title: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
                    botId: config.botId !== 'none' ? config.botId : undefined,
                    useKnowledgeBase: config.useKnowledgeBase,
                    metadata: {
                        knowledgeBaseIds: config.knowledgeBaseIds,
                    },
                })
                newConversation = newConv
                conversationId = newConv.id

                setConversations((prev) => [newConv, ...prev])
                setCurrentConversation(newConv)
                setCreatingConversation(false)
            } catch {
                toast.error('Failed to create conversation')
                setCreatingConversation(false)
                throw new Error('Failed to create conversation')
            }
        }

        const userMessage: AiMessage = {
            role: MessageRole.USER,
            content: input,
            timestamp: new Date().toISOString(),
        }

        const currentMessages = newConversation ? [] : messages
        const updatedMessages = [...currentMessages, userMessage]
        setMessages(updatedMessages)
        setLoading(true)

        try {
            let responseText = ''
            let sources: any[] = []
            let modelName = config.botId !== 'none'
                ? bots.find(b => b.id === config.botId)?.aiModelName || 'gemini-2.5-flash'
                : 'gemini-2.5-flash'

            if (config.botId !== 'none') {
                const bot = bots.find((b) => b.id === config.botId)
                modelName = bot?.aiModelName || modelName

                const res = await botsApi.chat(
                    config.botId,
                    input,
                    updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    config.useKnowledgeBase ? config.knowledgeBaseIds : undefined
                )
                responseText = res.response
                sources = res.sources || []
            } else {
                const res: any = await axiosClient.post('/knowledge-bases/chat', {
                    message: input,
                    model: modelName,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    knowledgeBaseIds: config.useKnowledgeBase ? config.knowledgeBaseIds : undefined
                })
                const data = res.data || res
                responseText = data.answer || data.response || 'No response'
            }

            const assistantMessage: AiMessage = {
                role: MessageRole.ASSISTANT,
                content: responseText,
                timestamp: new Date().toISOString(),
                metadata: {
                    bot: config.botId !== 'none' ? bots.find(b => b.id === config.botId)?.name : undefined,
                    model: modelName,
                    sources: sources.length > 0 ? sources : undefined,
                },
            }

            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            if (conversationId) {
                await updateConversationMessages(conversationId, finalMessages)
            }

        } catch (error) {
            toast.error('Failed to get AI response')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const updateConversationMessages = async (id: string, messages: AiMessage[]) => {
        try {
            await updateAIConversation(id, { messages })
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, messages, updatedAt: new Date().toISOString() } : c))
            )
        } catch {
        }
    }

    const updateConversationSettings = async () => {
        if (!currentConversation) {
            toast.error('Please create a conversation first')
            return
        }

        try {
            setSavingSettings(true)

            await updateAIConversation(currentConversation.id, {
                botId: config.botId !== 'none' ? config.botId : null,
                useKnowledgeBase: config.useKnowledgeBase,
                metadata: {
                    ...currentConversation.metadata,
                    knowledgeBaseIds: config.knowledgeBaseIds,
                },
            })

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === currentConversation.id
                        ? {
                            ...c,
                            botId: config.botId !== 'none' ? config.botId : null,
                            useKnowledgeBase: config.useKnowledgeBase,
                            metadata: {
                                ...c.metadata,
                                knowledgeBaseIds: config.knowledgeBaseIds,
                            },
                        }
                        : c
                )
            )

            setCurrentConversation((prev) =>
                prev
                    ? {
                        ...prev,
                        botId: config.botId !== 'none' ? config.botId : null,
                        useKnowledgeBase: config.useKnowledgeBase,
                        metadata: {
                            ...prev.metadata,
                            knowledgeBaseIds: config.knowledgeBaseIds,
                        },
                    }
                    : null
            )

            toast.success('Settings saved successfully')
        } catch {
            toast.error('Failed to save settings')
        } finally {
            setSavingSettings(false)
        }
    }

    const clearChat = () => {
        setCurrentConversation(null)
        setMessages([])
        toast.success('Ready for new chat')
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                return 'Recently'
            }

            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))

            if (days === 0) return 'Today'
            if (days === 1) return 'Yesterday'
            if (days < 7) return `${days} days ago`
            return date.toLocaleDateString()
        } catch {
            return 'Recently'
        }
    }


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full flex bg-background overflow-hidden relative"
        >
            {/* Left Sidebar: Conversation History */}
            <aside className="w-80 border-r border-border/40 flex flex-col bg-muted/20 shrink-0 h-full overflow-hidden">
                { }
                <div className="p-4 border-b border-border/40">
                    <Button
                        onClick={createNewConversation}
                        className="w-full rounded-xl shadow-md shadow-primary/10"
                        size="lg"
                        loading={creatingConversation}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Chat
                    </Button>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Spinner size="lg" className="text-primary" />
                            <p className="text-sm text-muted-foreground">Loading conversations...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-1">No conversations yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start a new chat to begin your AI conversation
                            </p>
                            <Button
                                onClick={createNewConversation}
                                size="sm"
                                disabled={creatingConversation}
                                className="rounded-lg"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Chat
                            </Button>
                        </div>
                    ) : (
                        conversations.filter(conv => conv && conv.id).map((conv) => (
                            <div
                                key={conv.id}
                                className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${currentConversation?.id === conv.id
                                    ? 'bg-primary/10 border border-primary/40 shadow-sm'
                                    : 'hover:bg-muted/50 border border-transparent hover:shadow-sm'
                                    }`}
                                onClick={() => selectConversation(conv)}
                            >
                                {editingConversationId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => updateConversationTitle(conv.id, editingTitle)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateConversationTitle(conv.id, editingTitle)
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingConversationId(null)
                                            }
                                        }}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm truncate">
                                                    {conv.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(conv.updatedAt)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingConversationId(conv.id)
                                                        setEditingTitle(conv.title)
                                                    }}
                                                    title="Edit title"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openDeleteDialog(conv.id)
                                                    }}
                                                    title="Delete conversation"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {conv.messages && conv.messages.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                {conv.messages[conv.messages.length - 1]?.content}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            { }
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-md">
                <div className="flex-1 relative overflow-hidden flex flex-col items-center w-full">
                    <div className="w-full h-full flex flex-col overflow-hidden px-4 md:px-0">
                        {/* ✅ PROFESSIONAL: Unified Interface with integrated controls (Rộng thoải mái) */}
                        <AiChatInterface
                            messages={messages}
                            onSendMessage={handleSend}
                            loading={loading}
                            botName={bots.find(b => b.id === config.botId)?.name || 'AI Assistant'}
                            modelName={bots.find(b => b.id === config.botId)?.aiModelName || undefined}
                            className="flex-1"
                            headerActions={
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={showSettings ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="rounded-xl h-9 px-4 transition-all"
                                    >
                                        <Settings className={cn("w-3.5 h-3.5 mr-2", showSettings && "animate-spin-slow")} />
                                        {showSettings ? 'Hide Settings' : 'Settings'}
                                    </Button>
                                    {currentConversation && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearChat}
                                            className="rounded-xl h-9 px-4 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            Clear
                                        </Button>
                                    )}
                                    {!currentConversation && messages.length > 0 && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={createNewConversation}
                                            loading={creatingConversation}
                                            className="rounded-xl h-9 px-4 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                            Save Chat
                                        </Button>
                                    )}
                                </div>
                            }
                            title={currentConversation?.title || 'New Chat'}
                            subtitle={currentConversation ? `${messages.length} messages` : 'Ready for assistance'}
                        />
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Configuration (Intelligent Control) */}
            {showSettings && (
                <motion.aside
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="w-96 border-l border-border/40 flex flex-col bg-background shrink-0 shadow-2xl z-20 h-full overflow-hidden"
                >
                    <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/10">
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-lg">Control Panel</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setShowSettings(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">
                                {savingSettings ? 'Saving changes...' : 'Changes auto-save'}
                            </p>
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                savingSettings ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground opacity-50"
                            )}>
                                {savingSettings ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {savingSettings ? 'Saving...' : 'Synced'}
                            </div>
                        </div>

                        {/* Bot Selection Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                                <Zap className="w-4 h-4 text-primary" />
                                Bot Selection
                            </div>

                            <Tabs
                                defaultValue={config.botId === 'none' ? 'system' : 'user'}
                                onValueChange={(val) => {
                                    if (val === 'system') setConfig(prev => ({ ...prev, botId: 'none' }));
                                }}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl">
                                    <TabsTrigger value="system" className="rounded-lg text-xs">System AI</TabsTrigger>
                                    <TabsTrigger value="user" className="rounded-lg text-xs">My My Bots</TabsTrigger>
                                </TabsList>

                                <TabsContent value="system" className="animate-in fade-in slide-in-from-bottom-2">
                                    <Card
                                        className={cn(
                                            "p-4 cursor-pointer transition-all border-2 rounded-2xl",
                                            config.botId === 'none' ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-muted/30 opacity-70 hover:opacity-100"
                                        )}
                                        onClick={() => setConfig(prev => ({ ...prev, botId: 'none' }))}
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                                <Zap className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm">Direct Agent</p>
                                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">Standard high-performance model</p>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="user" className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    {bots.length > 0 ? (
                                        <div className="grid gap-2">
                                            {bots.map((bot) => (
                                                <Card
                                                    key={bot.id}
                                                    className={cn(
                                                        "p-3 cursor-pointer transition-all border-2 rounded-xl flex items-center gap-3",
                                                        config.botId === bot.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/40 hover:bg-muted/60"
                                                    )}
                                                    onClick={() => setConfig(prev => ({ ...prev, botId: bot.id }))}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                                        <MessageCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-xs truncate">{bot.name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{bot.aiModelName || 'Model V1'}</p>
                                                    </div>
                                                    {config.botId === bot.id && <Check className="w-4 h-4 text-primary" />}
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border">
                                            <p className="text-xs text-muted-foreground">No bots found</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Knowledge Source Section */}
                        {config.botId === 'none' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                                        <Book className="w-4 h-4 text-primary" />
                                        Knowledge Base
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="enable-kb-right"
                                            checked={config.useKnowledgeBase}
                                            onChange={(e) => setConfig(prev => ({
                                                ...prev,
                                                useKnowledgeBase: e.target.checked,
                                                knowledgeBaseIds: e.target.checked ? prev.knowledgeBaseIds : []
                                            }))}
                                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {config.useKnowledgeBase && (
                                    <div className="grid gap-2">
                                        {knowledgeBases.length > 0 ? (
                                            knowledgeBases.map((kb) => {
                                                const isSelected = config.knowledgeBaseIds.includes(kb.id);
                                                return (
                                                    <div
                                                        key={kb.id}
                                                        onClick={() => setConfig(prev => ({
                                                            ...prev,
                                                            knowledgeBaseIds: isSelected
                                                                ? prev.knowledgeBaseIds.filter(id => id !== kb.id)
                                                                : [...prev.knowledgeBaseIds, kb.id]
                                                        }))}
                                                        className={cn(
                                                            "p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/40 hover:bg-muted/60"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                                            isSelected ? "bg-emerald-600" : "bg-amber-600"
                                                        )}>
                                                            <Book className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-xs truncate">{kb.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{kb.totalDocuments || 0} docs</p>
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-xs text-muted-foreground italic">No sources found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary Info */}
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-[10px] leading-relaxed text-muted-foreground">
                            <p className="font-bold text-foreground/60 mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> NOTE
                            </p>
                            Configuration updates will take effect for the current conversation immediately after saving. System AI allows multiple knowledge sources, while custom bots use their internal settings.
                        </div>
                    </div>
                </motion.aside>
            )}

            { }
            <AlertDialogConfirm
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Conversation"
                description="Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently deleted."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </motion.div >
    )
}
