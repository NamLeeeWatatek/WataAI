'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { PageLoading } from '@/components/shared/PageLoading'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Search } from '@/components/shared/Search'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { IconPicker } from '@/components/shared/IconPicker'
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

export default function BotsPage() {
    const { t } = useTranslation()

    // ✅ Form schema with translations
    const botFormSchema = useMemo(() => z.object({
        name: z.string().min(1, t('bots.nameRequired', { defaultValue: 'Bot name is required' })),
        description: z.string().optional(),
        icon: z.string().optional(),
    }), [t])

    type BotFormValues = z.infer<typeof botFormSchema>

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

    if (isLoading && bots.length === 0) return <div className="page-container"><PageLoading message={t('bots.synchronizing', { defaultValue: 'Synchronizing agent fleet...' })} /></div>

    return (
        <div className="page-container h-full flex flex-col space-y-6">
            <PageHeader
                title={t('bots.title', { defaultValue: 'AI Agent Fleet' })}
                description={t('bots.description', { defaultValue: 'Manage your AI agents specialized in various tasks.' })}
                icon={BotIcon}
                onRefresh={refetch}
                refreshing={isLoading}
            >
                <Button onClick={() => openModal()} className="px-6 font-bold h-10 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> {t('bots.newAgent', { defaultValue: 'New Agent' })}
                </Button>
            </PageHeader>

            <div className="flex items-center gap-2 max-w-sm">
                <Search
                    placeholder={t('bots.searchPlaceholder', { defaultValue: 'Search neural agents...' })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => {
                        setSearchQuery('')
                        setCurrentPage(1)
                    }}
                    className="max-w-sm"
                />
            </div>

            {bots.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 border-dashed glass-card">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <BotIcon className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        {searchQuery ? t('bots.noResults', { defaultValue: 'No Results' }) : t('bots.noAgentsYet', { defaultValue: 'No Agents Yet' })}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-xs text-center text-xs font-medium">
                        {searchQuery
                            ? t('bots.noAgentsMatching', { query: searchQuery, defaultValue: `No agents matching "${searchQuery}"` })
                            : t('bots.createFirstAgentDesc', { defaultValue: 'Create your first AI agent to help with tasks.' })
                        }
                    </p>
                    <Button onClick={() => openModal()} variant={searchQuery ? "outline" : "default"} className="px-8 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> {t('bots.createFirstAgent', { defaultValue: 'Create First Agent' })}
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
                                    className="relative flex flex-col overflow-hidden border-border/50"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg leading-tight truncate">{bot.name}</h3>
                                                    <Badge
                                                        variant={bot.status === 'active' ? "default" : "secondary"}
                                                        className="mt-1.5 font-bold tracking-wider px-2"
                                                    >
                                                        {bot.status === 'active' ? t('bots.online', { defaultValue: 'ONLINE' }) : t('bots.paused', { defaultValue: 'PAUSED' })}
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
                                                        <Edit2 className="w-4 h-4 mr-2" /> {t('bots.editDetails', { defaultValue: 'Edit Details' })}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleStatus(bot)}>
                                                        <Activity className="w-4 h-4 mr-2" />
                                                        {bot.status === 'active' ? t('bots.pauseAgent', { defaultValue: 'Pause Agent' }) : t('bots.startAgent', { defaultValue: 'Start Agent' })}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteId(bot.id)}
                                                        className="text-destructive focus:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> {t('bots.delete', { defaultValue: 'Delete' })}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-xs font-medium text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                                            {bot.description || t('bots.defaultDescription', { defaultValue: 'Advanced neural architecture tailored for complex workflow orchestration.' })}
                                        </p>



                                        {bot.tags && bot.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-4">
                                                {bot.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-[9px] font-bold py-0 h-4.5 bg-primary/[0.03] border-primary/20 text-primary/80">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto p-4 bg-muted/10 border-t border-border/10 flex items-center justify-between">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full font-bold h-9 bg-primary/5 hover:bg-primary hover:text-white"
                                            onClick={() => router.push(`/bots/${bot.id}`)}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            {t('bots.configureInterface', { defaultValue: 'Configure Interface' })}
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
                            {editingBot ? t('bots.editAgent', { defaultValue: 'Edit Agent' }) : t('bots.createNewAgent', { defaultValue: 'Create New Agent' })}
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
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('bots.botName', { defaultValue: 'Bot Name' })}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('bots.botNamePlaceholder', { defaultValue: 'e.g. Sales Assistant' })}
                                                    {...field}
                                                    className="font-bold text-lg"
                                                />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('bots.descriptionLabel', { defaultValue: 'Description & Instructions' })}</FormLabel>
                                            <FormControl>
                                                <Textarea rows={4} placeholder={t('bots.descriptionPlaceholder', { defaultValue: 'What should this agent do?' })} {...field} className="resize-none font-medium" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="font-bold">{t('bots.cancel', { defaultValue: 'Cancel' })}</Button>
                                    <Button type="submit" loading={form.formState.isSubmitting} className="font-bold px-8 shadow-lg shadow-primary/20">
                                        {editingBot ? t('bots.saveChanges', { defaultValue: 'Save Changes' }) : t('bots.createAgent', { defaultValue: 'Create Agent' })}
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
                title={t('bots.deleteAgent', { defaultValue: 'Delete Agent' })}
                description={t('bots.deleteConfirm', { defaultValue: 'Are you sure you want to delete this agent? This action cannot be undone.' })}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    )
}
