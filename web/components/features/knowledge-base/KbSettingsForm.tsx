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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { aiProvidersApi } from '@/lib/api/ai-providers'
import type { AiModel } from '@/lib/types/ai-provider'
import { handleFormError } from '@/lib/utils/form-errors'
import { AlertCircle, BrainCircuit, ScanFace, Sliders, Database, Save, X } from 'lucide-react'

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
    // AI Provider Configurations
    const [availableProviders, setAvailableProviders] = useState<{ configId: string, providerName: string, providerKey: string, ownerType: 'user' | 'workspace' }[]>([])
    const [loadingProviders, setLoadingProviders] = useState(false)

    // Filtered Model Lists
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

    const { formState: { errors } } = form
    const hasEssentialsError = !!errors.name || !!errors.color || !!errors.description
    const hasAiError = !!errors.aiConfigId || !!errors.ragModel || !!errors.embeddingConfigId || !!errors.embeddingModel
    const hasProcessingError = !!errors.chunkSize || !!errors.chunkOverlap

    // Sync form data
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
    }, [initialData, form])

    // Load Providers Logic
    useEffect(() => {
        const loadProviders = async () => {
            setLoadingProviders(true)
            try {
                const userConfigs = await aiProvidersApi.getUserConfigs()
                const configs: any[] = userConfigs.map((c: any) => ({
                    configId: c.id,
                    providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                    providerKey: (c.provider as any)?.key || '',
                    ownerType: 'user'
                }))

                const targetWorkspaceId = workspaceId || initialData?.workspaceId || undefined
                if (targetWorkspaceId) {
                    try {
                        const workspaceConfigs = await aiProvidersApi.getWorkspaceConfigs(targetWorkspaceId)
                        configs.push(...workspaceConfigs.map((c: any) => ({
                            configId: c.id,
                            providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                            providerKey: (c.provider as any)?.key || '',
                            ownerType: 'workspace'
                        })))
                    } catch (err) { console.warn('Failed to load workspace configs', err) }
                }

                if (initialData) {
                    // Logic to ensure current configs are in the list even if missing/archived
                    const knownIds = new Set(configs.map(c => c.configId))
                    const ensureConfig = async (id?: string) => {
                        if (id && !knownIds.has(id)) {
                            try {
                                const details = await aiProvidersApi.getConfigDetails(id, targetWorkspaceId)
                                if (details) {
                                    configs.push({
                                        configId: details.id,
                                        providerName: (details.displayName || (details as any).provider?.label || details.providerId) + ' (Archived)',
                                        providerKey: (details as any).provider?.key || '',
                                        ownerType: 'user' // Default fallback
                                    })
                                }
                            } catch (e) { console.warn('Missing config', id) }
                        }
                    }
                    await Promise.all([
                        ensureConfig(initialData.aiConfigId || undefined),
                        ensureConfig(initialData.embeddingConfigId || undefined)
                    ])
                }
                setAvailableProviders(configs)
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

    // Fetch Chat Models
    useEffect(() => {
        const fetchModels = async () => {
            if (!aiConfigId) { setRagModels([]); return }
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
            } catch (error) { console.error('Failed to fetch chat models:', error) }
            finally { setLoadingRagModels(false) }
        }
        if (aiConfigId) fetchModels()
    }, [aiConfigId, availableProviders, workspaceId, initialData?.workspaceId])

    // Fetch Embedding Models
    useEffect(() => {
        const fetchModels = async () => {
            if (!embeddingConfigId) { setEmbeddingModels([]); return }
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
            } catch (error) { console.error('Failed to fetch embedding models:', error) }
            finally { setLoadingEmbeddingModels(false) }
        }
        if (embeddingConfigId) fetchModels()
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
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <Tabs defaultValue="essentials" className="w-full flex flex-col min-h-full">
                        <div className="px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 sticky top-0">
                            <TabsList className="grid w-full grid-cols-3 h-9">
                                <TabsTrigger value="essentials" className="text-xs font-bold uppercase tracking-wider relative">
                                    <ScanFace className="w-4 h-4 mr-2 opacity-70" />
                                    Identity
                                    {hasEssentialsError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                                <TabsTrigger value="intelligence" className="text-xs font-bold uppercase tracking-wider relative">
                                    <BrainCircuit className="w-4 h-4 mr-2 opacity-70" />
                                    Brain
                                    {hasAiError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                                <TabsTrigger value="processing" className="text-xs font-bold uppercase tracking-wider relative">
                                    <Sliders className="w-4 h-4 mr-2 opacity-70" />
                                    Index
                                    {hasProcessingError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 space-y-6 flex-1">
                            {/* TAB 1: ESSENTIALS */}
                            <TabsContent value="essentials" className="space-y-6 mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Knowledge Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="E.g., Engineering Docs" {...field} className="h-11 font-bold" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <FormField
                                                control={form.control}
                                                name="color"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Theme</FormLabel>
                                                        <div className="flex relative">
                                                            <Input
                                                                type="color"
                                                                {...field}
                                                                className="w-full h-11 p-1 cursor-pointer absolute opacity-0"
                                                            />
                                                            <div
                                                                className="w-full h-11 rounded-md border shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                                                                style={{ backgroundColor: field.value }}
                                                            >
                                                                <span className="text-[10px] font-mono mix-blend-difference text-white/80">{field.value}</span>
                                                            </div>
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
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="What knowledge does this engine contain?"
                                                        className="resize-none min-h-[120px] leading-relaxed"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isPublic"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/30 space-y-0">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-sm font-bold">Public Access</FormLabel>
                                                    <p className="text-[11px] text-muted-foreground font-medium pr-4">
                                                        Allow this knowledge base to be queried by other workspaces or public agents.
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-primary"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* TAB 2: INTELLIGENCE */}
                            <TabsContent value="intelligence" className="space-y-8 mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                {/* RAG Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                            <BrainCircuit className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Generation Model</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Powering the "Chat" capability</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 p-4 border rounded-xl bg-background/50 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 font-black text-6xl text-indigo-500 pointer-events-none select-none">RAG</div>

                                        <FormField
                                            control={form.control}
                                            name="aiConfigId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Provider</FormLabel>
                                                    <Select value={field.value || ""} onValueChange={(val) => {
                                                        const currentVal = form.getValues('aiConfigId');
                                                        field.onChange(val);
                                                        if (val !== currentVal && currentVal) form.setValue('ragModel', '');
                                                    }}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/80">
                                                                <SelectValue>{getProviderName(field.value)}</SelectValue>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availableProviders.map((p) => (
                                                                <SelectItem key={p.configId} value={p.configId || ''}>{p.providerName}</SelectItem>
                                                            ))}
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
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chat Model</FormLabel>
                                                    <Select value={field.value || ""} onValueChange={field.onChange} disabled={!aiConfigId}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/80 disabled:opacity-50">
                                                                <SelectValue>{field.value || (loadingRagModels ? "Loading..." : "Select Model")}</SelectValue>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {ragModels.map((m) => (
                                                                <SelectItem key={m.id || m.name} value={m.name}>{m.displayName || m.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Embedding Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Embedding Model</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Converting text to vectors</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 p-4 border rounded-xl bg-background/50 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 font-black text-6xl text-emerald-500 pointer-events-none select-none">VEC</div>

                                        <FormField
                                            control={form.control}
                                            name="embeddingConfigId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Embedding Provider</FormLabel>
                                                    <Select value={field.value || ""} onValueChange={(val) => {
                                                        const currentVal = form.getValues('embeddingConfigId');
                                                        field.onChange(val);
                                                        if (val !== currentVal && currentVal) form.setValue('embeddingModel', '');
                                                    }}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/80">
                                                                <SelectValue>{getProviderName(field.value)}</SelectValue>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availableProviders.map((p) => (
                                                                <SelectItem key={p.configId} value={p.configId || ''}>{p.providerName}</SelectItem>
                                                            ))}
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
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vector Model</FormLabel>
                                                    <Select value={field.value || ""} onValueChange={field.onChange} disabled={!embeddingConfigId}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background/80 disabled:opacity-50">
                                                                <SelectValue>{field.value || (loadingEmbeddingModels ? "Loading..." : "Select Model")}</SelectValue>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {embeddingModels.map((m) => (
                                                                <SelectItem key={m.id || m.name} value={m.name}>{m.displayName || m.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 3: PROCESSING */}
                            <TabsContent value="processing" className="space-y-6 mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wide">Advance Configuration</p>
                                        <p className="text-[11px] opacity-90 leading-relaxed">
                                            Adjusting these settings after creation will require re-indexing all documents. Leave as default if unsure.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="chunkSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-2">
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chunk Size (Tokens)</FormLabel>
                                                    <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded">{field.value}</span>
                                                </div>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                                            className="font-mono bg-background/50"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    Maximum number of tokens per document segment.
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
                                                <div className="flex items-center justify-between mb-2">
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chunk Overlap</FormLabel>
                                                    <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded">{field.value}</span>
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                                                        className="font-mono bg-background/50"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">
                                                    Number of tokens to repeat between chunks to maintain context.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="p-6 border-t bg-background/95 backdrop-blur z-20 flex items-center justify-between gap-4">
                    <div className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                        {hasEssentialsError || hasAiError || hasProcessingError ? (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Fix errors before saving
                            </span>
                        ) : (
                            <span className="opacity-70">Review all settings before creating.</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            disabled={form.formState.isSubmitting}
                            className="text-xs font-bold uppercase tracking-wider"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={form.formState.isSubmitting}
                            className="text-xs font-bold uppercase tracking-wider px-6 shadow-lg shadow-primary/20"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}


