'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { Card } from '@/components/ui/Card'
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
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/ScrollArea'

export default function ChatWithAIPage() {
    const { currentWorkspace } = useWorkspace()
    const [conversations, setConversations] = useState<AiConversation[]>([])
    const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null)
    const [messages, setMessages] = useState<AiMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [bots, setBots] = useState<Bot[]>([])
    const [selectedBot, setSelectedBot] = useState<string>('none')
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([])
    const [useKnowledgeBase, setUseKnowledgeBase] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
    const [creatingConversation, setCreatingConversation] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)

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
            const data = await getKnowledgeBases(currentWorkspace.id)
            const kbList = Array.isArray(data) ? data : []
            setKnowledgeBases(kbList)
            if (kbList.length === 0) {
            }
        } catch {
            setKnowledgeBases([])
        }
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
                botId: selectedBot !== 'none' ? selectedBot : undefined,
                useKnowledgeBase: useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: selectedKnowledgeBases,
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

        if (conv.botId) {
            setSelectedBot(conv.botId)
        } else {
            setSelectedBot('none')
        }

        if (conv.useKnowledgeBase !== undefined) {
            setUseKnowledgeBase(conv.useKnowledgeBase)
        }

        if (conv.metadata?.knowledgeBaseIds && Array.isArray(conv.metadata.knowledgeBaseIds)) {
            setSelectedKnowledgeBases(conv.metadata.knowledgeBaseIds)
        } else {
            setSelectedKnowledgeBases([])
        }
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
                    botId: selectedBot !== 'none' ? selectedBot : undefined,
                    useKnowledgeBase: useKnowledgeBase,
                    metadata: {
                        knowledgeBaseIds: selectedKnowledgeBases,
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
            let modelName = selectedBot !== 'none'
                ? bots.find(b => b.id === selectedBot)?.aiModelName || 'gemini-2.5-flash'
                : 'gemini-2.5-flash'

            console.log('[Sending Message]', {
                selectedBot,
                useKnowledgeBase,
                knowledgeBaseIds: selectedKnowledgeBases,
            });

            if (selectedBot !== 'none') {
                const bot = bots.find((b) => b.id === selectedBot)
                modelName = bot?.aiModelName || modelName

                const res = await botsApi.chat(
                    selectedBot,
                    input,
                    updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    useKnowledgeBase ? selectedKnowledgeBases : undefined
                )
                responseText = res.response
                sources = res.sources || []
            } else {
                const res: any = await axiosClient.post('/knowledge-bases/chat', {
                    message: input,
                    model: modelName,
                    conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                })
                const data = res.data || res
                responseText = data.answer || data.response || 'No response'
            }

            const assistantMessage: AiMessage = {
                role: MessageRole.ASSISTANT,
                content: responseText,
                timestamp: new Date().toISOString(),
                metadata: {
                    bot: selectedBot !== 'none' ? bots.find(b => b.id === selectedBot)?.name : undefined,
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
            console.log('[Updating Settings]', {
                botId: selectedBot !== 'none' ? selectedBot : null,
                useKnowledgeBase,
                knowledgeBaseIds: selectedKnowledgeBases,
            });

            await updateAIConversation(currentConversation.id, {
                botId: selectedBot !== 'none' ? selectedBot : undefined,
                useKnowledgeBase,
                metadata: {
                    knowledgeBaseIds: selectedKnowledgeBases,
                },
            })

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === currentConversation.id
                        ? {
                            ...c,
                            botId: selectedBot !== 'none' ? selectedBot : null,
                            useKnowledgeBase,
                            metadata: {
                                ...c.metadata,
                                knowledgeBaseIds: selectedKnowledgeBases,
                            },
                        }
                        : c
                )
            )

            setCurrentConversation((prev) =>
                prev
                    ? {
                        ...prev,
                        botId: selectedBot !== 'none' ? selectedBot : null,
                        useKnowledgeBase,
                        metadata: {
                            ...prev.metadata,
                            knowledgeBaseIds: selectedKnowledgeBases,
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

    const selectedBotData = bots.find((b) => b.id === selectedBot)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex bg-grid-pattern"
        >
            { }
            <aside className="w-80 border-r border-border/40 flex flex-col bg-background">
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
                            <LoadingLogo size="md" text="Loading conversations..." />
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
            <div className="flex-1 flex flex-col">
                { }
                <PageHeader
                    title={currentConversation?.title || 'Chat with AI'}
                    description={currentConversation ? `${messages.length} messages` : 'Start a new conversation'}
                    onRefresh={loadConversations}
                    refreshing={loadingConversations}
                    premium
                    className="px-6 py-6 border-b border-border/40 bg-background mb-0"
                >
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                            className="rounded-lg h-10 px-4"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                        {currentConversation && (
                            <Button variant="outline" size="sm" onClick={clearChat} className="rounded-lg h-10 px-4">
                                <Plus className="w-4 h-4 mr-2" />
                                New Chat
                            </Button>
                        )}
                    </div>
                </PageHeader>

                { }
                {showSettings && (
                    <div className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/10">
                        <div className="max-w-6xl mx-auto p-6 space-y-6">
                            { }
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Chat Configuration
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Customize your AI chat experience
                                    </p>
                                </div>
                                <Button
                                    onClick={updateConversationSettings}
                                    loading={savingSettings}
                                    disabled={!currentConversation}
                                    size="sm"
                                    className="rounded-lg"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Settings
                                </Button>
                            </div>

                            { }
                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-primary" />
                                    Select Bot
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    { }
                                    <Card
                                        className={`p-4 cursor-pointer transition-all duration-200 rounded-xl ${selectedBot === 'none'
                                            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                            : 'hover:border-primary/40 hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedBot('none')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                <Zap className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm">Direct AI</h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Chat directly with AI without bot configuration
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    { }
                                    {bots.map((bot) => (
                                        <Card
                                            key={bot.id}
                                            className={`p-4 cursor-pointer transition-all duration-200 rounded-xl ${selectedBot === bot.id
                                                ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                                : 'hover:border-primary/40 hover:shadow-sm'
                                                }`}
                                            onClick={() => setSelectedBot(bot.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                                    <MessageCircle className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate">{bot.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {bot.description || 'No description'}
                                                    </p>
                                                    {bot.aiModelName && (
                                                        <Badge variant="secondary" className="text-[10px] mt-2 font-bold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                                            <Zap className="w-3 h-3 mr-1" />
                                                            {bot.aiModelName}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            { }
                            {selectedBot === 'none' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold flex items-center gap-2">
                                            <Book className="w-4 h-4 text-primary" />
                                            Knowledge Sources
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="enable-kb"
                                                checked={useKnowledgeBase}
                                                onChange={(e) => {
                                                    setUseKnowledgeBase(e.target.checked)
                                                    if (!e.target.checked) {
                                                        setSelectedKnowledgeBases([])
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <label
                                                htmlFor="enable-kb"
                                                className="text-sm cursor-pointer"
                                            >
                                                Enable Knowledge Base
                                            </label>
                                        </div>
                                    </div>

                                    {useKnowledgeBase && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {knowledgeBases.length === 0 ? (
                                                <div className="col-span-full text-center py-8 px-4 border border-dashed border-border/40 rounded-xl">
                                                    <Book className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        No knowledge bases available
                                                    </p>
                                                </div>
                                            ) : (
                                                knowledgeBases.map((kb) => {
                                                    const isSelected = selectedKnowledgeBases.includes(kb.id)
                                                    return (
                                                        <Card
                                                            key={kb.id}
                                                            className={`p-4 cursor-pointer transition-all duration-200 rounded-xl ${isSelected
                                                                ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                                                : 'hover:border-primary/40 hover:shadow-sm'
                                                                }`}
                                                            onClick={() => {
                                                                setSelectedKnowledgeBases((prev) =>
                                                                    isSelected
                                                                        ? prev.filter((id) => id !== kb.id)
                                                                        : [...prev, kb.id]
                                                                )
                                                            }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${isSelected
                                                                    ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                                                                    : 'bg-gradient-to-br from-amber-600 to-orange-700'
                                                                    }`}>
                                                                    {isSelected ? (
                                                                        <Check className="w-5 h-5 text-white" />
                                                                    ) : (
                                                                        <Book className="w-5 h-5 text-white" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-sm truncate">{kb.name}</h4>
                                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                                        {kb.description || 'No description'}
                                                                    </p>
                                                                    {kb.totalDocuments !== undefined && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {kb.totalDocuments} documents
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )}

                                    {selectedKnowledgeBases.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                                            <Check className="w-4 h-4 text-primary" />
                                            <span>
                                                {selectedKnowledgeBases.length} knowledge source{selectedKnowledgeBases.length > 1 ? 's' : ''} selected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedBot !== 'none' && selectedBotData && (
                                <div className="bg-muted/50 rounded-xl p-4 border border-border/40">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        Current Configuration
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Bot</p>
                                            <p className="font-medium">{selectedBotData.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">AI Model</p>
                                            <p className="font-medium">{selectedBotData.aiModelName || 'Default'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Knowledge Base</p>
                                            <p className="font-medium">
                                                Configured in bot settings
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        <p>Knowledge bases are configured in the bot's Knowledge Base tab and will be used automatically during conversations.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* ✅ PROFESSIONAL: Use dedicated AI Chat Interface */}
                <AiChatInterface
                    messages={messages}
                    onSendMessage={handleSend}
                    loading={loading}
                    botName={selectedBotData?.name || 'AI Assistant'}
                    modelName={selectedBotData?.aiModelName || undefined}
                />
            </div>

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
