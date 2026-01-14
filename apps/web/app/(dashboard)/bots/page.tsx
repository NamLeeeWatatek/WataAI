'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { PageLoading } from '@/components/ui/PageLoading'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Search } from '@/components/ui/Search'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { IconPicker } from '@/components/ui/IconPicker'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'

import { useWorkspace } from '@/lib/hooks/useWorkspace'
import {
    Plus,
    Edit2,
    Trash2,
    Activity,
    Settings,
    Bot as BotIcon,
    MoreHorizontal
} from 'lucide-react'
import { type Bot } from '@/lib/api/bots'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Badge } from '@/components/ui/Badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { iconMap } from '@/lib/icon-map'
import { useBots } from '@/lib/hooks/features/useBots'
import { useDebounce } from '@/lib/hooks/useDebounce'

const botFormSchema = z.object({
    name: z.string().min(1, 'Bot name is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
})

type BotFormValues = z.infer<typeof botFormSchema>

export default function BotsPage() {
    const router = useRouter()
    const { workspaceId } = useWorkspace()
    const [showModal, setShowModal] = useState(false)
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 500)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const {
        data: botsData,
        isLoading,
        refetch,
        createBot,
        updateBot,
        deleteBot,
        activateBot,
        pauseBot
    } = useBots(workspaceId || undefined, {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch
    })

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch])

    const bots = botsData?.data || []
    const totalItems = botsData?.total || 0

    const form = useForm<BotFormValues>({
        resolver: zodResolver(botFormSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: 'Bot',
        },
    })

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

    const onSubmit = async (values: BotFormValues) => {
        try {
            if (editingBot) {
                await updateBot({ id: editingBot.id, data: values })
            } else {
                await createBot({ ...values, workspaceId })
            }
            setShowModal(false)
        } catch { }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await deleteBot(deleteId)
            setDeleteId(null)
        } catch { }
    }

    const toggleStatus = async (bot: Bot) => {
        try {
            if (bot.status === 'active') {
                await pauseBot(bot.id)
            } else {
                await activateBot(bot.id)
            }
        } catch { }
    }

    if (isLoading && bots.length === 0) return <PageLoading message="Synchronizing agent fleet..." />

    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Agent Fleet"
                description="Manage your AI agents specialized in various tasks."
                onRefresh={refetch}
                refreshing={isLoading}
            >
                <Button onClick={() => openModal()} className="px-6 font-bold h-10 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> New Agent
                </Button>
            </PageHeader>

            <div className="flex items-center gap-2 max-w-sm">
                <Search
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e: any) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                    }}
                    onClear={() => {
                        setSearchQuery('')
                        setCurrentPage(1)
                    }}
                    className="w-full"
                />
            </div>

            {bots.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 border-border/40 border-dashed bg-muted/5">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <BotIcon className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        {searchQuery ? 'No Results' : 'No Agents Yet'}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-xs text-center text-xs font-medium">
                        {searchQuery
                            ? `No agents matching "${searchQuery}"`
                            : 'Create your first AI agent to help with tasks.'
                        }
                    </p>
                    <Button onClick={() => openModal()} variant={searchQuery ? "outline" : "default"} className="px-8 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Create First Agent
                    </Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bots.map((bot: Bot) => {
                            const Icon = iconMap[bot.icon || 'Bot'] || iconMap['Bot'] || BotIcon
                            return (
                                <Card
                                    key={bot.id}
                                    className="group relative flex flex-col overflow-hidden border-border/40 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center border border-primary/20 transition-transform duration-500 group-hover:scale-110 shadow-inner">
                                                    <Icon className="w-7 h-7 text-primary drop-shadow-md" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg leading-tight truncate">{bot.name}</h3>
                                                    <Badge
                                                        variant={bot.status === 'active' ? "default" : "secondary"}
                                                        className="mt-1.5 text-[10px] uppercase font-black tracking-widest"
                                                    >
                                                        {bot.status === 'active' ? 'ONLINE' : 'PAUSED'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openModal(bot)}>
                                                        <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleStatus(bot)}>
                                                        <Activity className="w-4 h-4 mr-2" />
                                                        {bot.status === 'active' ? 'Pause Agent' : 'Start Agent'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteId(bot.id)}
                                                        className="text-destructive focus:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-xs font-medium text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                                            {bot.description || 'Advanced neural architecture tailored for complex workflow orchestration.'}
                                        </p>
                                    </div>

                                    <div className="mt-auto p-4 bg-muted/10 border-t border-border/10 flex items-center justify-between">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full font-bold transition-all h-10 group/btn bg-primary/5 hover:bg-primary hover:text-white"
                                            onClick={() => router.push(`/bots/${bot.id}`)}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configure Interface
                                        </Button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    <Pagination
                        pagination={{
                            page: currentPage,
                            limit: pageSize,
                            total: totalItems,
                            totalPages: Math.ceil(totalItems / pageSize),
                            hasNextPage: currentPage < Math.ceil(totalItems / pageSize)
                        }}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[12, 24, 36, 48]}
                    />
                </div>
            )}

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="text-xl font-black flex items-center gap-3">
                            <BotIcon className="w-5 h-5 text-primary" />
                            {editingBot ? 'Edit Agent' : 'Create New Agent'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Agent Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Sales Assistant" {...field} className="h-11 font-bold" />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description & Instructions</FormLabel>
                                            <FormControl>
                                                <Textarea rows={4} placeholder="What should this agent do?" {...field} className="resize-none font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="font-bold">Cancel</Button>
                                    <Button type="submit" loading={form.formState.isSubmitting} className="font-bold px-8 shadow-lg shadow-primary/20">
                                        {editingBot ? 'Save Changes' : 'Create Agent'}
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
                title="Delete Agent"
                description="Are you sure you want to delete this agent? This action cannot be undone."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
