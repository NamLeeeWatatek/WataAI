import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { aiProvidersApi } from '@/lib/api/ai-providers'
import type { AiModel } from '@/lib/types/ai-provider'
import { handleFormError } from '@/lib/utils/form-errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Info, Settings2, Sparkles, Layout } from 'lucide-react'

const kbFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isPublic: z.boolean(),
    aiConfigId: z.string().optional(),
    ragModel: z.string().optional(),
    embeddingConfigId: z.string().optional(),
    embeddingModel: z.string().optional(),
    chunkSize: z.number().min(100, 'Chunk size must be at least 100').max(10000),
    chunkOverlap: z.number().min(0, 'Overlap cannot be negative').max(1000),
})

export type KbFormValues = z.infer<typeof kbFormSchema>

interface KbSettingsFormProps {
    initialData?: KnowledgeBase | null
    workspaceId?: string
    onSubmit: (values: KbFormValues) => Promise<void>
    onCancel: () => void
    submitLabel?: string
}

export function KbSettingsForm({
    initialData,
    workspaceId,
    onSubmit,
    onCancel,
    submitLabel = 'Save Changes'
}: KbSettingsFormProps) {
    // AI Provider Configurations (Simplified)
    const [availableProviders, setAvailableProviders] = useState<{ configId: string, providerName: string, providerKey: string, ownerType: 'user' | 'workspace' }[]>([])
    const [loadingProviders, setLoadingProviders] = useState(false)

    // Filtered Model Lists (Fetched on demand)
    const [ragModels, setRagModels] = useState<AiModel[]>([])
    const [loadingRagModels, setLoadingRagModels] = useState(false)
    const [embeddingModels, setEmbeddingModels] = useState<AiModel[]>([])
    const [loadingEmbeddingModels, setLoadingEmbeddingModels] = useState(false)

    const form = useForm<KbFormValues>({
        resolver: zodResolver(kbFormSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            color: initialData?.color || '#3B82F6',
            isPublic: !!initialData?.isPublic,
            aiConfigId: initialData?.aiConfigId || '',
            ragModel: initialData?.ragModel || '',
            embeddingConfigId: initialData?.embeddingConfigId || '',
            embeddingModel: initialData?.embeddingModel || '',
            chunkSize: initialData?.chunkSize ?? 1000,
            chunkOverlap: initialData?.chunkOverlap ?? 200,
        },
    })

    // Sync form data when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || '',
                description: initialData.description || '',
                color: initialData.color || '#3B82F6',
                isPublic: !!initialData.isPublic,
                aiConfigId: initialData.aiConfigId || '',
                ragModel: initialData.ragModel || '',
                embeddingConfigId: initialData.embeddingConfigId || '',
                embeddingModel: initialData.embeddingModel || '',
                chunkSize: initialData.chunkSize ?? 1000,
                chunkOverlap: initialData.chunkOverlap ?? 200,
            })
        }
    }, [initialData]) // Only depend on initialData

    // 1. Load available Provider Configurations
    useEffect(() => {
        const loadProviders = async () => {
            setLoadingProviders(true)
            try {
                // Load User Configs (Include inactive ones to resolve references)
                const userConfigs = await aiProvidersApi.getUserConfigs()
                const configs: any[] = userConfigs
                    .map((c: any) => ({
                        configId: c.id,
                        providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                        providerKey: (c.provider as any)?.key || '',
                        ownerType: 'user'
                    }))

                const targetWorkspaceId = workspaceId || initialData?.workspaceId || undefined
                if (targetWorkspaceId) {
                    try {
                        const workspaceConfigs = await aiProvidersApi.getWorkspaceConfigs(targetWorkspaceId)
                        const wConfigs = workspaceConfigs
                            .map((c: any) => ({
                                configId: c.id,
                                providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                                providerKey: (c.provider as any)?.key || '',
                                ownerType: 'workspace'
                            }))
                        configs.push(...wConfigs)
                    } catch (err) {
                        console.warn('Failed to load workspace configs', err)
                    }
                }

                // Check if initialData configs are missing and fetch them
                if (initialData) {
                    // Method A: Use nested relations (Best robustness)
                    const addFromRelation = (config: any) => {
                        if (!config) return
                        if (!configs.find(c => c.configId === config.id)) {
                            configs.push({
                                configId: config.id,
                                providerName: (config.displayName || config.provider?.label || config.providerId), // + ' (Linked)',
                                providerKey: config.provider?.key || '',
                                ownerType: config.ownerType || 'user'
                            })
                        }
                    }

                    if (initialData.aiConfig) addFromRelation(initialData.aiConfig)
                    if (initialData.embeddingConfig) addFromRelation(initialData.embeddingConfig)

                    // Method B: Fetch by ID if relational data missing (Legacy fallback)
                    const fetchMissing = async (id?: string) => {
                        if (id && !configs.find(c => c.configId === id)) {
                            try {
                                const details = await aiProvidersApi.getConfigDetails(id, targetWorkspaceId)
                                if (details) {
                                    const isWorkspace = 'workspaceId' in details
                                    configs.push({
                                        configId: details.id,
                                        providerName: (details.displayName || (details as any).provider?.label || details.providerId) + ' (Archived/Missing)',
                                        providerKey: (details as any).provider?.key || '',
                                        ownerType: isWorkspace ? 'workspace' : 'user'
                                    })
                                }
                            } catch (e) {
                                console.warn('Could not recover missing config', id, e)
                            }
                        }
                    }

                    // Only fetch if we didn't already add them via relations
                    const missingAiId = initialData.aiConfig ? undefined : initialData.aiConfigId
                    const missingEmbId = initialData.embeddingConfig ? undefined : initialData.embeddingConfigId

                    if (missingAiId || missingEmbId) {
                        await Promise.all([
                            fetchMissing(missingAiId || undefined),
                            fetchMissing(missingEmbId || undefined)
                        ])
                    }
                }

                setAvailableProviders(configs)
                console.log('Final Available Providers:', configs)
            } catch (error) {
                console.error('Failed to load AI providers:', error)
            } finally {
                setLoadingProviders(false)
            }
        }
        loadProviders()
    }, [workspaceId, initialData])

    const aiConfigId = form.watch('aiConfigId')
    const embeddingConfigId = form.watch('embeddingConfigId')

    // 2. Fetch Chat Models when aiConfigId changes
    useEffect(() => {
        const fetchModels = async () => {
            if (!aiConfigId) {
                setRagModels([])
                return
            }
            setLoadingRagModels(true)
            try {
                const provider = availableProviders.find(p => p.configId === aiConfigId)
                const targetWorkspaceId = workspaceId || initialData?.workspaceId || undefined

                let models = []
                if (provider?.ownerType === 'workspace' && targetWorkspaceId) {
                    models = await aiProvidersApi.getWorkspaceModelsByConfig(targetWorkspaceId, aiConfigId, 'chat')
                } else {
                    models = await aiProvidersApi.getUserModelsByConfig(aiConfigId, 'chat')
                }
                setRagModels(models)

                // IMPORTANT: Ensure the saved model is still valid, or at least visible
                // We don't auto-clear here because "Unknown" handling is done in the Select component
            } catch (error) {
                console.error('Failed to fetch chat models:', error)
            } finally {
                setLoadingRagModels(false)
            }
        }

        // Only fetch if we have a config ID
        if (aiConfigId) {
            fetchModels()
        }
    }, [aiConfigId, availableProviders, workspaceId, initialData?.workspaceId])

    // 3. Fetch Embedding Models when embeddingConfigId changes
    useEffect(() => {
        const fetchModels = async () => {
            if (!embeddingConfigId) {
                setEmbeddingModels([])
                return
            }
            setLoadingEmbeddingModels(true)
            try {
                const provider = availableProviders.find(p => p.configId === embeddingConfigId)
                const targetWorkspaceId = workspaceId || initialData?.workspaceId || undefined

                let models = []
                if (provider?.ownerType === 'workspace' && targetWorkspaceId) {
                    models = await aiProvidersApi.getWorkspaceModelsByConfig(targetWorkspaceId, embeddingConfigId, 'embedding')
                } else {
                    models = await aiProvidersApi.getUserModelsByConfig(embeddingConfigId, 'embedding')
                }
                setEmbeddingModels(models)
            } catch (error) {
                console.error('Failed to fetch embedding models:', error)
            } finally {
                setLoadingEmbeddingModels(false)
            }
        }
        fetchModels()
    }, [embeddingConfigId, availableProviders, workspaceId, initialData?.workspaceId])

    const getProviderName = (configId?: string) => {
        if (!configId) return 'Select Provider'
        const p = availableProviders.find(p => p.configId === configId)
        if (p) return p.providerName
        if (loadingProviders) return 'Loading...'
        return configId ? `Unknown (${configId.substring(0, 8)}...)` : 'Unknown Provider'
    }

    const handleFormSubmit = async (values: KbFormValues) => {
        try {
            const sanitized = {
                ...values,
                description: values.description || null,
                aiConfigId: values.aiConfigId || null,
                ragModel: values.ragModel || null,
                embeddingConfigId: values.embeddingConfigId || null,
                embeddingModel: values.embeddingModel || null,
            }
            await onSubmit(sanitized as any)
        } catch (error: any) {
            handleFormError(error, form)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Section: General */}
                <Card className="bg-muted/30 border-none shadow-none overflow-visible">
                    <CardHeader className="pb-3 pt-4 px-6">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Layout className="w-4 h-4" /> General Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-12">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Knowledge Base Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Sales Documentation" {...field} className="h-11 bg-background font-bold pl-4 border-white/5" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-7">
                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Theme Color</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input
                                                            type="color"
                                                            {...field}
                                                            className="w-12 h-11 p-1 cursor-pointer bg-background border-white/5"
                                                        />
                                                        <div className="absolute inset-0 rounded-md pointer-events-none group-hover:ring-2 ring-primary/20 transition-all" />
                                                    </div>
                                                </FormControl>
                                                <FormControl>
                                                    <Input {...field} placeholder="#3B82F6" className="h-11 font-mono uppercase text-xs bg-background border-white/5" maxLength={7} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-5 flex flex-col justify-end">
                                <FormField
                                    control={form.control}
                                    name="isPublic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Visibility</FormLabel>
                                            <div className="flex items-center justify-between h-11 px-4 rounded-lg border border-white/5 bg-background/50 hover:bg-background/80 transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {field.value ? 'Public' : 'Private'}
                                                </span>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-primary"
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What is this knowledge base about?"
                                            className="resize-none min-h-[100px] bg-background border-white/5 font-medium leading-relaxed"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Section: AI Engine */}
                <Card className="bg-muted/30 border-none shadow-none overflow-visible">
                    <CardHeader className="pb-3 pt-4 px-6">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> AI & Retrieval
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 px-6 pb-6 pt-2">
                        {/* RAG Configuration */}
                        <div className="space-y-4">
                            <div className="border-l-2 border-indigo-500 pl-4 py-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">Retrieval logic (RAG)</h4>
                                <p className="text-[10px] text-muted-foreground">Provider and Model for generating responses.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="aiConfigId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">AI Service Provider</FormLabel>
                                            <Select value={field.value || ""} onValueChange={(val) => {
                                                const currentVal = form.getValues('aiConfigId');
                                                field.onChange(val);
                                                // Only reset model if provider actually changes (and it's not the initial set)
                                                if (val !== currentVal && currentVal) {
                                                    form.setValue('ragModel', '');
                                                }
                                            }}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-background border-white/5">
                                                        <SelectValue>
                                                            {getProviderName(field.value)}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableProviders.map((p) => (
                                                        <SelectItem key={p.configId} value={p.configId || ''}>{p.providerName}</SelectItem>
                                                    ))}
                                                    {field.value && !availableProviders.find(p => p.configId === field.value) && (
                                                        <SelectItem key="saved-provider-ai" value={field.value}>
                                                            Unknown Provider ({field.value.substring(0, 8)}...)
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ragModel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Chat Model</FormLabel>
                                            <Select value={field.value || ""} onValueChange={field.onChange} disabled={!aiConfigId}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-background border-white/5 disabled:opacity-50">
                                                        <SelectValue>
                                                            {field.value || (loadingRagModels ? "Searching models..." : "Select Model")}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ragModels.length > 0 && ragModels.map((m) => (
                                                        <SelectItem key={m.id || m.name} value={m.name}>
                                                            {m.displayName || m.name}
                                                        </SelectItem>
                                                    ))}
                                                    {field.value && !ragModels.find(m => m.name === field.value) && (
                                                        <SelectItem key="saved-model" value={field.value}>{field.value} (Currently Selected)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-[9px] opacity-60">Specific model identifier to use for response generation.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator className="bg-border/30" />

                        {/* Embedding Configuration */}
                        <div className="space-y-4">
                            <div className="border-l-2 border-cyan-500 pl-4 py-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500">Embedding Settings</h4>
                                <p className="text-[10px] text-muted-foreground">Provider and Model for semantic indexing.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="embeddingConfigId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Embedding Provider</FormLabel>
                                            <Select value={field.value || ""} onValueChange={(val) => {
                                                const currentVal = form.getValues('embeddingConfigId');
                                                field.onChange(val);
                                                if (val !== currentVal && currentVal) {
                                                    form.setValue('embeddingModel', '');
                                                }
                                            }}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-background border-white/5">
                                                        <SelectValue>
                                                            {getProviderName(field.value)}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableProviders.map((p) => (
                                                        <SelectItem key={p.configId} value={p.configId || ''}>{p.providerName}</SelectItem>
                                                    ))}
                                                    {field.value && !availableProviders.find(p => p.configId === field.value) && (
                                                        <SelectItem key="saved-provider-emb" value={field.value}>
                                                            Unknown Provider ({field.value.substring(0, 8)}...)
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="embeddingModel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Embedding Model</FormLabel>
                                            <Select value={field.value || ""} onValueChange={field.onChange} disabled={!embeddingConfigId}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10 bg-background border-white/5 disabled:opacity-50">
                                                        <SelectValue>
                                                            {field.value || (loadingEmbeddingModels ? "Searching models..." : "Select Model")}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {embeddingModels.length > 0 && embeddingModels.map((m) => (
                                                        <SelectItem key={m.id || m.name} value={m.name}>
                                                            {m.displayName || m.name}
                                                        </SelectItem>
                                                    ))}
                                                    {field.value && !embeddingModels.find(m => m.name === field.value) && (
                                                        <SelectItem key="saved-embedding" value={field.value}>{field.value} (Currently Selected)</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-[9px] opacity-60">Model used for generating semantic vectors.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section: Optimization */}
                <Card className="bg-muted/30 border-none shadow-none overflow-visible">
                    <CardHeader className="pb-3 pt-4 px-6">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> Processing Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <FormField
                                control={form.control}
                                name="chunkSize"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">
                                            Chunk Size <Info className="w-3 h-3 opacity-40" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                                className="h-10 bg-background border-white/5 font-mono"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] leading-tight opacity-70">
                                            Determines the unit scale for retrieval segments.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="chunkOverlap"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">
                                            Overlap Size <Info className="w-3 h-3 opacity-40" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                                                className="h-10 bg-background border-white/5 font-mono"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] leading-tight opacity-70">
                                            Semantic overlap between neighboring chunks.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5 bg-background/20 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                        className="font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={form.formState.isSubmitting} className="min-w-[140px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
