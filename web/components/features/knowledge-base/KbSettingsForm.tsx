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
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { Slider } from '@/components/ui/Slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { Separator } from '@/components/ui/Separator'
import { Spinner } from '@/components/ui/Spinner'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { aiProvidersApi } from '@/lib/api/ai-providers'
import type { AiModel } from '@/lib/types/ai-provider'
import { handleFormError } from '@/lib/utils/form-errors'
import { AlertCircle, BrainCircuit, ScanFace, Sliders, Database, Save, X, Cpu, Info, Sparkles, Thermometer, Zap } from 'lucide-react'

const kbFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isPublic: z.boolean(),
    aiConfigId: z.string().optional(),
    ragModel: z.string().optional(),
    embeddingConfigId: z.string().optional(),
    embeddingModel: z.string().optional(),
    useSystemAI: z.boolean().optional(),
    chunkSize: z.number().min(100, 'Chunk size must be at least 100').max(10000),
    chunkOverlap: z.number().min(0, 'Overlap cannot be negative').max(1000),
    aiParameters: z.object({
        temperature: z.number().min(0).max(2),
        maxTokens: z.number().min(1).max(128000),
    }),
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
    const [isManualRag, setIsManualRag] = useState(false)
    const [isManualEmbedding, setIsManualEmbedding] = useState(false)

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
            useSystemAI: initialData?.useSystemAI || false,
            chunkSize: initialData?.chunkSize ?? 800,
            chunkOverlap: initialData?.chunkOverlap ?? 150,
            aiParameters: {
                temperature: initialData?.aiParameters?.temperature ?? 0.7,
                maxTokens: initialData?.aiParameters?.maxTokens ?? 1000,
            },
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
                useSystemAI: initialData.useSystemAI || false,
                chunkSize: initialData.chunkSize ?? 800,
                chunkOverlap: initialData.chunkOverlap ?? 150,
                aiParameters: {
                    temperature: initialData.aiParameters?.temperature ?? 0.7,
                    maxTokens: initialData.aiParameters?.maxTokens ?? 1000,
                },
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
                useSystemAI: values.useSystemAI || false,
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
                                <FormField
                                    control={form.control}
                                    name="useSystemAI"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/30 space-y-0 border-indigo-500/10">
                                            <div className="space-y-1">
                                                <FormLabel className="text-sm font-bold flex items-center gap-2">
                                                    <Cpu className="w-4 h-4 text-indigo-500" />
                                                    Use System Default AI
                                                </FormLabel>
                                                <p className="text-[11px] text-muted-foreground font-medium pr-4">
                                                    Automatically use the system-wide AI settings. Highly recommended for most users.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-indigo-500"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {!form.watch('useSystemAI') && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                        {/* Generation Settings */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                                                <BrainCircuit className="w-4 h-4 text-primary" />
                                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Generation Intelligence</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="aiConfigId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Provider</FormLabel>
                                                            <Select
                                                                value={field.value || ''}
                                                                onValueChange={(val) => {
                                                                    field.onChange(val)
                                                                    form.setValue('ragModel', '')
                                                                }}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="h-11 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
                                                                        <SelectValue placeholder="Select Provider" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {availableProviders.map((p) => (
                                                                        <SelectItem key={p.configId} value={p.configId}>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{p.providerKey}</Badge>
                                                                                <span>{p.providerName}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="ragModel"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Model Name</FormLabel>
                                                                <div className="flex items-center gap-2 mr-1">
                                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Manual</span>
                                                                    <Switch
                                                                        checked={isManualRag}
                                                                        onCheckedChange={setIsManualRag}
                                                                        className="scale-[0.6] data-[state=checked]:bg-primary"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <FormControl>
                                                                {isManualRag ? (
                                                                    <div className="relative">
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value || ''}
                                                                            placeholder="e.g. gpt-4-turbo"
                                                                            className="h-11 bg-background/50 border-primary/10 pr-10"
                                                                        />
                                                                        <Sparkles className="w-4 h-4 text-primary/40 absolute right-3 top-3.5" />
                                                                    </div>
                                                                ) : (
                                                                    <Select
                                                                        value={field.value || ''}
                                                                        onValueChange={field.onChange}
                                                                        disabled={!aiConfigId || loadingRagModels}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-11 bg-background/50 border-primary/10">
                                                                                <SelectValue placeholder={loadingRagModels ? "Loading models..." : "Select Model"} />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {ragModels.map((m) => (
                                                                                <SelectItem key={m.id} value={m.name}>
                                                                                    {m.displayName || m.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                                                <FormField
                                                    control={form.control}
                                                    name="aiParameters.temperature"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-5">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Thermometer className="w-4 h-4 text-orange-500" />
                                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">Temperature</FormLabel>
                                                                </div>
                                                                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                                                    {field.value?.toFixed(1) ?? '0.7'}
                                                                </Badge>
                                                            </div>
                                                            <FormControl>
                                                                <Slider
                                                                    value={[field.value ?? 0.7]}
                                                                    min={0}
                                                                    max={1.2}
                                                                    step={0.1}
                                                                    onValueChange={([v]) => field.onChange(v)}
                                                                />
                                                            </FormControl>
                                                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                                                <span>Precise</span>
                                                                <span>Creative</span>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="aiParameters.maxTokens"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-5">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">Max Tokens</FormLabel>
                                                                </div>
                                                                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                                                    {field.value ?? '1000'}
                                                                </Badge>
                                                            </div>
                                                            <FormControl>
                                                                <Slider
                                                                    value={[field.value ?? 1000]}
                                                                    min={256}
                                                                    max={4096}
                                                                    step={128}
                                                                    onValueChange={([v]) => field.onChange(v)}
                                                                />
                                                            </FormControl>
                                                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                                                <span>Short</span>
                                                                <span>Long</span>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <Separator className="bg-primary/5" />

                                        {/* Vector Settings */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/10">
                                                <Database className="w-4 h-4 text-emerald-500" />
                                                <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Vector Intelligence</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="embeddingConfigId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Embedding Provider</FormLabel>
                                                            <Select
                                                                value={field.value || ''}
                                                                onValueChange={(val) => {
                                                                    field.onChange(val)
                                                                    form.setValue('embeddingModel', '')
                                                                }}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="h-11 bg-background/50 border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                                                        <SelectValue placeholder="Select Provider" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {availableProviders.map((p) => (
                                                                        <SelectItem key={p.configId} value={p.configId}>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/20 text-emerald-600">{p.providerKey}</Badge>
                                                                                <span>{p.providerName}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="embeddingModel"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vector Model</FormLabel>
                                                                <div className="flex items-center gap-2 mr-1">
                                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Manual</span>
                                                                    <Switch
                                                                        checked={isManualEmbedding}
                                                                        onCheckedChange={setIsManualEmbedding}
                                                                        className="scale-[0.6] data-[state=checked]:bg-emerald-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <FormControl>
                                                                {isManualEmbedding ? (
                                                                    <div className="relative">
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value || ''}
                                                                            placeholder="e.g. text-embedding-3-small"
                                                                            className="h-11 bg-background/50 border-emerald-500/10 pr-10"
                                                                        />
                                                                        <Database className="w-4 h-4 text-emerald-500/40 absolute right-3 top-3.5" />
                                                                    </div>
                                                                ) : (
                                                                    <Select
                                                                        value={field.value || ''}
                                                                        onValueChange={field.onChange}
                                                                        disabled={!embeddingConfigId || loadingEmbeddingModels}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-11 bg-background/50 border-emerald-500/10">
                                                                                <SelectValue placeholder={loadingEmbeddingModels ? "Loading models..." : "Select Model"} />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {embeddingModels.map((m) => (
                                                                                <SelectItem key={m.id} value={m.name}>
                                                                                    {m.displayName || m.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {form.watch('useSystemAI') && (
                                    <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-500/20 animate-in zoom-in-95 duration-500">
                                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                        <h3 className="text-lg font-black text-foreground mb-2">System Intelligence Active</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                            This engine is utilizing the global WataAI brain. Settings are optimized automatically for maximum performance and accuracy.
                                        </p>
                                    </div>
                                )}
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


