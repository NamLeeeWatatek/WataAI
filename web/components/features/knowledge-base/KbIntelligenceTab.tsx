import { UseFormReturn } from 'react-hook-form'
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Cpu, BrainCircuit, Sparkles, Thermometer, Zap, Database } from 'lucide-react'
import { KbFormValues } from './schema'
import { AiModel } from '@/lib/types/ai-provider'

export interface AiProviderOption {
    configId: string
    providerName: string
    providerKey: string
    ownerType: 'user' | 'workspace'
}

interface KbIntelligenceTabProps {
    form: UseFormReturn<KbFormValues>
    availableProviders: AiProviderOption[]
    ragModels: AiModel[]
    loadingRagModels: boolean
    embeddingModels: AiModel[]
    loadingEmbeddingModels: boolean
    isManualRag: boolean
    setIsManualRag: (val: boolean) => void
    isManualEmbedding: boolean
    setIsManualEmbedding: (val: boolean) => void
}

import { useTranslation } from 'react-i18next'

export function KbIntelligenceTab({
    form,
    availableProviders,
    ragModels,
    loadingRagModels,
    embeddingModels,
    loadingEmbeddingModels,
    isManualRag,
    setIsManualRag,
    isManualEmbedding,
    setIsManualEmbedding
}: KbIntelligenceTabProps) {
    const { t } = useTranslation()
    const aiConfigId = form.watch('aiConfigId')
    const embeddingConfigId = form.watch('embeddingConfigId')

    return (
        <div className="space-y-8 mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <FormField
                control={form.control}
                name="useSystemAI"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/30 space-y-0 border-indigo-500/10">
                        <div className="space-y-1">
                            <FormLabel className="text-sm font-bold flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-500" />
                                {t('knowledgeBase.systemAIOptimization', { defaultValue: 'Use System Default AI' })}
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground font-medium pr-4">
                                {t('knowledgeBase.systemAIDesc', { defaultValue: 'Automatically use the system-wide AI settings. Highly recommended for most users.' })}
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
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t('knowledgeBase.genIntelligence', { defaultValue: 'Generation Intelligence' })}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="aiConfigId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.aiProvider', { defaultValue: 'AI Provider' })}</FormLabel>
                                        <Select
                                            value={field.value || ''}
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                form.setValue('ragModel', '')
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all">
                                                    <SelectValue placeholder={t('knowledgeBase.selectProvider', { defaultValue: 'Select Provider' })} />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.modelName', { defaultValue: 'Model Name' })}</FormLabel>
                                            <div className="flex items-center gap-2 mr-1">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">{t('knowledgeBase.manual', { defaultValue: 'Manual' })}</span>
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
                                                            <SelectValue placeholder={loadingRagModels ? t('common.loading') : t('knowledgeBase.selectModel', { defaultValue: 'Select Model' })} />
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
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{t('knowledgeBase.temperature', { defaultValue: 'Temperature' })}</FormLabel>
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
                                            <span>{t('bot_config.precise', { defaultValue: 'Precise' })}</span>
                                            <span>{t('bot_config.creative', { defaultValue: 'Creative' })}</span>
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
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">{t('knowledgeBase.maxTokens', { defaultValue: 'Max Tokens' })}</FormLabel>
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
                                            <span>{t('bot_config.short', { defaultValue: 'Short' })}</span>
                                            <span>{t('bot_config.long', { defaultValue: 'Long' })}</span>
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
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t('knowledgeBase.vectorIntelligence', { defaultValue: 'Vector Intelligence' })}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="embeddingConfigId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.embeddingProvider', { defaultValue: 'Embedding Provider' })}</FormLabel>
                                        <Select
                                            value={field.value || ''}
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                form.setValue('embeddingModel', '')
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-background/50 border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                                    <SelectValue placeholder={t('knowledgeBase.selectProvider', { defaultValue: 'Select Provider' })} />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.vectorModel', { defaultValue: 'Vector Model' })}</FormLabel>
                                            <div className="flex items-center gap-2 mr-1">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">{t('knowledgeBase.manual', { defaultValue: 'Manual' })}</span>
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
                                                            <SelectValue placeholder={loadingEmbeddingModels ? t('common.loading') : t('knowledgeBase.selectModel', { defaultValue: 'Select Model' })} />
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
                    <h3 className="text-lg font-black text-foreground mb-2">{t('knowledgeBase.systemActive', { defaultValue: 'System Intelligence Active' })}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {t('knowledgeBase.systemActiveDesc', { defaultValue: 'This engine is utilizing the global WataAI brain. Settings are optimized automatically for maximum performance and accuracy.' })}
                    </p>
                </div>
            )}
        </div>
    )
}
