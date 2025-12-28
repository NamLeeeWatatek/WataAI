import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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
import axiosClient from '@/lib/axios-client'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { handleFormError } from '@/lib/utils/form-errors'

const settingsFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    embeddingModel: z.string().min(1, 'Embedding model is required'),
    aiProviderId: z.string().optional(),
    ragModel: z.string().optional(),
    chunkSize: z.number().min(100, 'Chunk size must be at least 100').max(10000),
    chunkOverlap: z.number().min(0).max(1000),
})

interface AIProvider {
    id: string;
    providerId: string;
    displayName: string;
    provider?: {
        key: string;
        label: string;
        icon?: string;
    };
    modelList?: string[];
    isActive: boolean;
}

interface KBSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBase: KnowledgeBase | null
    onSave: (data: {
        name: string
        description: string
        embeddingModel: string
        aiProviderId?: string
        ragModel?: string
        chunkSize: number
        chunkOverlap: number
    }) => Promise<void>
}

export function KBSettingsDialog({ open, onOpenChange, knowledgeBase, onSave }: KBSettingsDialogProps) {
    const [aiProviders, setAiProviders] = useState<AIProvider[]>([])
    const [loadingProviders, setLoadingProviders] = useState(false)
    const [useCustomRagModel, setUseCustomRagModel] = useState(false)

    const form = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            name: '',
            description: '',
            embeddingModel: 'text-embedding-004',
            aiProviderId: '',
            ragModel: '',
            chunkSize: 1000,
            chunkOverlap: 200,
        },
    })

    const loadAiProviders = async () => {
        try {
            setLoadingProviders(true)
            const [userResponse, workspaceResponse] = await Promise.allSettled([
                axiosClient.get('/ai-providers/user/configs'),
                axiosClient.get('/ai-providers/workspace/configs'),
            ])

            const providers: AIProvider[] = []

            if (userResponse.status === 'fulfilled') {
                providers.push(...(userResponse.value as any).map((p: any) => ({
                    ...p,
                    scope: 'user' as const
                })))
            }

            if (workspaceResponse.status === 'fulfilled') {
                providers.push(...(workspaceResponse.value as any).map((p: any) => ({
                    ...p,
                    scope: 'workspace' as const
                })))
            }

            setAiProviders(providers.filter(p => p.isActive))
        } catch (error) {
            console.error('Failed to load AI providers:', error)
        } finally {
            setLoadingProviders(false)
        }
    }

    useEffect(() => {
        if (open) {
            loadAiProviders()
        }
    }, [open])

    useEffect(() => {
        if (knowledgeBase && open) {
            form.reset({
                name: knowledgeBase.name,
                description: knowledgeBase.description || '',
                embeddingModel: knowledgeBase.embeddingModel,
                aiProviderId: knowledgeBase.aiProviderId || '',
                ragModel: knowledgeBase.ragModel || '',
                chunkSize: knowledgeBase.chunkSize,
                chunkOverlap: knowledgeBase.chunkOverlap,
            })
        }
    }, [knowledgeBase, open, form])

    const handleSubmit = async (values: z.infer<typeof settingsFormSchema>) => {
        try {
            await onSave({
                ...values,
                description: values.description || '',
            })
            onOpenChange(false)
        } catch (error: any) {
            handleFormError(error, form)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Knowledge Base Settings</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {form.formState.errors.root && (
                            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                                <span className="font-medium">Error:</span>
                                {form.formState.errors.root.message}
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="aiProviderId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>AI Provider for RAG</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingProviders ? "Loading providers..." : "Select AI provider (optional)"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">None (Use default)</SelectItem>
                                                {aiProviders.map((provider) => (
                                                    <SelectItem key={provider.id} value={provider.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{provider.displayName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                ({provider.provider?.label || provider.providerId})
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        AI provider to use for RAG responses. If not set, uses bot's configured provider or fallback to default.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("aiProviderId") ? (
                            <div className="space-y-3">
                                <FormField
                                    control={form.control}
                                    name="ragModel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>RAG Model</FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    onClick={() => setUseCustomRagModel(!useCustomRagModel)}
                                                    className="p-0 h-auto text-xs text-primary underline"
                                                >
                                                    {useCustomRagModel ? 'Use recommended models' : 'Enter custom model'}
                                                </Button>
                                            </div>
                                            <FormControl>
                                                {useCustomRagModel ? (
                                                    <Input placeholder="e.g., gpt-4o-mini, claude-3.5-haiku" {...field} />
                                                ) : (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a model (recommended)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(() => {
                                                                const selectedProvider = aiProviders.find(p => p.id === form.watch("aiProviderId"));
                                                                const models = selectedProvider?.modelList || [];
                                                                return models.length > 0 ? (
                                                                    models.map((model: string) => (
                                                                        <SelectItem key={model} value={model}>
                                                                            {model}
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <SelectItem value="" disabled>
                                                                        No models configured for this provider
                                                                    </SelectItem>
                                                                );
                                                            })()}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </FormControl>
                                            <FormDescription className="space-y-1">
                                                <div>
                                                    {useCustomRagModel
                                                        ? 'Enter any model name or path supported by your AI provider.'
                                                        : 'Choose from models configured for your selected AI provider.'}
                                                </div>
                                                <div className="text-xs">
                                                    <strong>Examples:</strong> gemini-2.0-flash, gpt-4, claude-3.5-sonnet, deepseek-r1:8b
                                                </div>
                                                {useCustomRagModel && (
                                                    <div className="text-xs text-amber-600 dark:text-amber-400">
                                                        ⚠️ Custom models may not work if not supported by your provider.
                                                    </div>
                                                )}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ) : (
                            <FormField
                                control={form.control}
                                name="ragModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RAG Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., gemini-2.0-flash, gpt-4, deepseek-r1:8b" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            AI model for RAG responses when no provider is selected above.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {!form.watch("aiProviderId") && (
                            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    💡 Tip: Select an AI provider above to use your configured API keys, or leave both fields blank to use system defaults.
                                </p>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="embeddingModel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Embedding Model</FormLabel>
                                    <FormControl>
                                        <Input placeholder="text-embedding-ada-002, text-embedding-004" {...field} />
                                    </FormControl>
                                    <FormDescription className="space-y-1">
                                        <div className="font-medium">⚠️ Important: Embedding model is INDEPENDENT of RAG provider above.</div>
                                        <div className="text-xs">
                                            <strong>Examples:</strong> text-embedding-ada-002, text-embedding-3-small, text-embedding-004, all-MiniLM-L6-v2
                                        </div>
                                        <div className="text-xs text-amber-600 dark:text-amber-400">
                                            You can use ANY embedding model from ANY provider. This doesn't have to match the RAG provider selected above.
                                        </div>
                                        <div className="text-xs italic">
                                            System will try to resolve this model from your configured providers or use system defaults.
                                        </div>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="chunkSize"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chunk Size</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="chunkOverlap"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chunk Overlap</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={form.formState.isSubmitting}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
