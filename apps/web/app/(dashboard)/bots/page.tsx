'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { PageLoading } from '@/components/ui/PageLoading'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { IconPicker } from '@/components/ui/IconPicker'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'

import axiosClient from '@/lib/axios-client'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
    Plus,
    Edit2,
    Trash2,
    MessageSquare,
    Activity,
    RefreshCw,
    Settings,
    Bot as BotIcon,
    Search,
    LayoutGrid,
    MoreHorizontal
} from 'lucide-react'
import { botsApi, type Bot } from '@/lib/api/bots'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Badge } from '@/components/ui/Badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import * as LucideIcons from 'lucide-react'

const botFormSchema = z.object({
    name: z.string().min(1, 'Bot name is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
})

type BotFormValues = z.infer<typeof botFormSchema>

export default function BotsPage() {
    const router = useRouter()
    const [bots, setBots] = useState<Bot[]>([])
    const { workspace, workspaceId, isLoading: isWorkspaceLoading } = useWorkspace()
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | null>(null)

    useEffect(() => {
        if (!isWorkspaceLoading && !workspaceId) {
            setLoading(false)
        }
    }, [isWorkspaceLoading, workspaceId])

    const form = useForm<BotFormValues>({
        resolver: zodResolver(botFormSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: 'Bot',
        },
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)

    const [totalItems, setTotalItems] = useState(0)

    const loadBots = useCallback(async () => {
        if (!workspaceId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response: any = await botsApi.getAll(workspaceId, {
                page: currentPage,
                limit: pageSize,
                status: undefined // We can add status filter support later if needed
            })

            const botsData = response.data || []
            const total = response.total || botsData.length

            setBots(botsData)
            setTotalItems(total)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load bots')
        } finally {
            setLoading(false)
        }
    }, [workspaceId, currentPage, pageSize])

    useEffect(() => {
        if (workspaceId) {
            loadBots()
        }
    }, [workspaceId, loadBots])



    const openModal = (bot?: Bot) => {
        if (bot) {
            setEditingBot(bot)
            form.reset({
                name: bot.name,
                description: bot.description || '',
                icon: bot.icon || 'Bot'
            })
        } else {
            setEditingBot(null)
            form.reset({
                name: '',
                description: '',
                icon: 'Bot'
            })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingBot(null)
        form.reset()
    }

    const onSubmit = async (values: BotFormValues) => {
        try {
            if (editingBot) {
                await botsApi.update(editingBot.id, values)
                toast.success('Bot updated')
            } else {
                await botsApi.create({
                    ...values,
                    workspaceId: workspaceId!
                })
                toast.success('Bot created')
            }
            closeModal()
            loadBots()
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to save bot'
            toast.error(message)
        }
    }

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const deleteBot = async (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            await botsApi.delete(deleteId)
            toast.success('Bot deleted')
            loadBots()
        } catch {
            toast.error('Failed to delete bot')
        }
    }

    const toggleStatus = async (bot: Bot) => {
        try {
            if (bot.status === 'active') {
                await botsApi.pause(bot.id)
            } else {
                await botsApi.activate(bot.id)
            }
            toast.success('Bot status updated')
            loadBots()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Bots"
                description="Build and manage your custom AI agents"
                onRefresh={loadBots}
                refreshing={loading}
            >
                <Button rounded="xl" onClick={() => openModal()} className="px-6 font-bold h-10">
                    <Plus className="w-4 h-4 mr-2" />
                    New Bot
                </Button>
            </PageHeader>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search bots..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="pl-9 bg-card/40 border-border/40 rounded-xl h-10"
                    />
                </div>
            </div>

            {loading && bots.length === 0 ? (
                <PageLoading message="Loading agents" />
            ) : bots.length === 0 ? (
                <Card variant="flat" rounded="2xl" className="flex flex-col items-center justify-center py-20 border-border/40 border-dashed">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                        <BotIcon className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        {searchQuery ? 'No results found' : 'No bots yet'}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-xs text-center text-sm">
                        {searchQuery
                            ? `We couldn't find any bots matching "${searchQuery}"`
                            : 'Create your first custom AI bot to start automating your tasks.'
                        }
                    </p>
                    <Button rounded="full" onClick={() => openModal()} variant={searchQuery ? "outline" : "default"} className="px-8">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bots.map((bot) => {
                            const Icon = (LucideIcons as any)[bot.icon || 'Bot'] || (LucideIcons as any)['BotIcon'] || BotIcon
                            return (
                                <Card
                                    key={bot.id}
                                    variant="premium"
                                    className="group relative flex flex-col overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/icon">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center border border-primary/20 transition-transform duration-300 group-hover:scale-110">
                                                        <Icon className="w-7 h-7 text-primary" />
                                                    </div>
                                                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center overflow-hidden">
                                                        <IconPicker
                                                            value={bot.icon || 'Bot'}
                                                            onChange={async (icon) => {
                                                                try {
                                                                    await axiosClient.patch(`/bots/${bot.id}`, { icon })
                                                                    toast.success('Icon updated!')
                                                                    loadBots()
                                                                } catch {
                                                                    toast.error('Failed to update icon')
                                                                }
                                                            }}
                                                            className="w-full h-full border-none bg-transparent hover:bg-transparent text-transparent"
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 border-background",
                                                            bot.status === 'active' ? "bg-green-500" : "bg-amber-500"
                                                        )} />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg leading-tight truncate">{bot.name}</h3>
                                                    <Badge
                                                        variant={bot.status === 'active' ? "success" : "secondary"}
                                                        className="mt-1.5"
                                                    >
                                                        {bot.status === 'active' ? 'Active' : 'Paused'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" rounded="full" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openModal(bot)} className="rounded-lg">
                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                        Edit Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleStatus(bot)} className="rounded-lg">
                                                        <Activity className="w-4 h-4 mr-2" />
                                                        {bot.status === 'active' ? 'Pause Bot' : 'Activate Bot'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => deleteBot(bot.id)}
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Bot
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                                            {bot.description || 'Smart AI assistant tailor-made to automate your workflows and enhance productivity.'}
                                        </p>
                                    </div>

                                    <div className="mt-auto p-4 bg-muted/10 border-t border-border/40 flex items-center justify-between">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            rounded="xl"
                                            className="w-full font-bold transition-all h-10 group/btn"
                                            onClick={() => router.push(`/bots/${bot.id}`)}
                                        >
                                            <Settings className="w-4 h-4 mr-2 transition-transform duration-500 group-hover/btn:rotate-90" />
                                            Configure Agent
                                        </Button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {bots.length > 0 && (
                        <Pagination
                            pagination={{
                                page: currentPage,
                                limit: pageSize,
                                total: totalItems,
                                totalPages: Math.ceil(totalItems / pageSize),
                                hasNextPage: currentPage < Math.ceil(totalItems / pageSize)
                            }}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size: number) => {
                                setPageSize(size)
                                setCurrentPage(1)
                            }}
                            pageSizeOptions={[6, 9, 12, 24, 48]}
                        />
                    )}
                </div>
            )}

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus className="w-4 h-4 text-primary" />
                            </div>
                            {editingBot ? 'Edit Agent Profile' : 'Create New AI Agent'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bot Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Customer Support Hero" {...field} className="bg-muted/50 border-border/50 h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose & Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={4}
                                                    placeholder="Explain what this bot will help you with..."
                                                    {...field}
                                                    className="bg-muted/50 border-border/50 resize-none pt-3"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={closeModal} className="font-bold">
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={form.formState.isSubmitting} className="font-bold px-8">
                                        {editingBot ? 'Save Changes' : 'Launch Agent'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialogConfirm
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Bot"
                description="Are you sure you want to delete this bot? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
