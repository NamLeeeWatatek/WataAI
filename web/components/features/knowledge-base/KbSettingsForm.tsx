import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { aiProvidersApi } from '@/lib/api/ai-providers'
import type { AiModel } from '@/lib/types/ai-provider'
import { handleFormError } from '@/lib/utils/form-errors'
import { AlertCircle, BrainCircuit, ScanFace, Sliders, Save, X } from 'lucide-react'
import { kbFormSchema, type KbFormValues } from './schema'
export type { KbFormValues } from './schema'
import { KbEssentialsTab } from './KbEssentialsTab'
import { KbIntelligenceTab, AiProviderOption } from './KbIntelligenceTab'
import { KbProcessingTab } from './KbProcessingTab'

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
    const { t } = useTranslation()
    // AI Provider Configurations
    const [availableProviders, setAvailableProviders] = useState<AiProviderOption[]>([])
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
            aiConfigId: initialData?.aiConfigId || initialData?.aiConfig?.id || '',
            ragModel: initialData?.ragModel || '',
            embeddingConfigId: initialData?.embeddingConfigId || initialData?.embeddingConfig?.id || '',
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
                aiConfigId: initialData.aiConfigId || initialData.aiConfig?.id || '',
                ragModel: initialData.ragModel || '',
                embeddingConfigId: initialData.embeddingConfigId || initialData.embeddingConfig?.id || '',
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
                const configs: AiProviderOption[] = userConfigs.map((c: any) => ({
                    configId: c.id,
                    providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                    providerKey: (c.provider as any)?.key || '',
                    ownerType: 'user' as const
                }))

                const targetWorkspaceId = workspaceId || initialData?.workspaceId || undefined
                if (targetWorkspaceId) {
                    try {
                        const workspaceConfigs = await aiProvidersApi.getWorkspaceConfigs(targetWorkspaceId)
                        configs.push(...workspaceConfigs.map((c: any) => ({
                            configId: c.id,
                            providerName: c.displayName || (c.provider as any)?.label || c.providerId + (c.isActive ? '' : ' (Inactive)'),
                            providerKey: (c.provider as any)?.key || '',
                            ownerType: 'workspace' as const
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
                                        ownerType: 'user' as const // Default fallback
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
                                    {t('knowledgeBase.identity', { defaultValue: 'Identity' })}
                                    {hasEssentialsError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                                <TabsTrigger value="intelligence" className="text-xs font-bold uppercase tracking-wider relative">
                                    <BrainCircuit className="w-4 h-4 mr-2 opacity-70" />
                                    {t('knowledgeBase.brain', { defaultValue: 'Brain' })}
                                    {hasAiError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                                <TabsTrigger value="processing" className="text-xs font-bold uppercase tracking-wider relative">
                                    <Sliders className="w-4 h-4 mr-2 opacity-70" />
                                    {t('knowledgeBase.index', { defaultValue: 'Index' })}
                                    {hasProcessingError && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 space-y-6 flex-1">
                            {/* TAB 1: ESSENTIALS */}
                            <TabsContent value="essentials" className="h-full">
                                <KbEssentialsTab form={form} />
                            </TabsContent>

                            {/* TAB 2: INTELLIGENCE */}
                            <TabsContent value="intelligence" className="h-full">
                                <KbIntelligenceTab
                                    form={form}
                                    availableProviders={availableProviders}
                                    ragModels={ragModels}
                                    loadingRagModels={loadingRagModels}
                                    embeddingModels={embeddingModels}
                                    loadingEmbeddingModels={loadingEmbeddingModels}
                                    isManualRag={isManualRag}
                                    setIsManualRag={setIsManualRag}
                                    isManualEmbedding={isManualEmbedding}
                                    setIsManualEmbedding={setIsManualEmbedding}
                                />
                            </TabsContent>

                            {/* TAB 3: PROCESSING */}
                            <TabsContent value="processing" className="h-full">
                                <KbProcessingTab form={form} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="p-6 border-t bg-background/95 backdrop-blur z-20 flex items-center justify-between gap-4">
                    <div className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                        {hasEssentialsError || hasAiError || hasProcessingError ? (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {t('knowledgeBase.fixErrors', { defaultValue: 'Fix errors before saving' })}
                            </span>
                        ) : (
                            <span className="opacity-70">{t('knowledgeBase.reviewSettings', { defaultValue: 'Review all settings before creating.' })}</span>
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
                            {t('knowledgeBase.cancel', { defaultValue: 'Cancel' })}
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
