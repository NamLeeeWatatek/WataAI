import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
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
import type { UserAiProvider } from '@/lib/api/ai-providers'
import { handleFormError } from '@/lib/utils/form-errors'

const collectionFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isPublic: z.boolean(),
    aiProviderId: z.string().optional(),
    embeddingModel: z.string().min(1, 'Embedding model is required'),
    ragModel: z.string().optional(),
})

interface KBCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBase?: KnowledgeBase | null
    onSubmit: (data: {
        name: string
        description: string
        color: string
        isPublic: boolean
        aiProviderId?: string
        embeddingModel: string
        ragModel?: string
    }) => Promise<void>
}

export function KBCollectionDialog({
    open,
    onOpenChange,
    knowledgeBase,
    onSubmit
}: KBCollectionDialogProps) {
    const [providers, setProviders] = useState<UserAiProvider[]>([])

    const form = useForm<z.infer<typeof collectionFormSchema>>({
        resolver: zodResolver(collectionFormSchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3B82F6',
            isPublic: false,
            aiProviderId: undefined,
            embeddingModel: 'text-embedding-004',
            ragModel: undefined,
        },
    })

    const selectedProvider = providers.find(p => p.id === form.watch('aiProviderId'))
    const availableModels = selectedProvider?.modelList || []

    useEffect(() => {
        if (open) {
            loadProviders()
        }
    }, [open])

    useEffect(() => {
        if (knowledgeBase && open) {
            form.reset({
                name: knowledgeBase.name,
                description: knowledgeBase.description || '',
                color: knowledgeBase.color || '#3B82F6',
                isPublic: knowledgeBase.isPublic || false,
                aiProviderId: knowledgeBase.aiProviderId || undefined,
                embeddingModel: knowledgeBase.embeddingModel || 'text-embedding-004',
                ragModel: knowledgeBase.ragModel || undefined,
            })
        } else if (!open) {
            form.reset({
                name: '',
                description: '',
                color: '#3B82F6',
                isPublic: false,
                aiProviderId: undefined,
                embeddingModel: 'text-embedding-004',
                ragModel: undefined,
            })
        }
    }, [knowledgeBase, open, form])

    const loadProviders = async () => {
        try {
            const response = await aiProvidersApi.getUserProviders()
            setProviders(response)
        } catch (error) {
            console.error('Failed to load AI providers:', error)
        }
    }

    const handleSubmit = async (values: z.infer<typeof collectionFormSchema>) => {
        try {
            await onSubmit({
                ...values,
                description: values.description || '',
            })
            form.reset()
            onOpenChange(false)
        } catch (error: any) {
            handleFormError(error, form)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {knowledgeBase ? 'Edit Collection' : 'Create New Collection'}
                    </DialogTitle>
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
                                        <Input placeholder="Product Documentation" {...field} />
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
                                        <Textarea
                                            placeholder="All product docs and guides..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="aiProviderId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>AI Provider</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select AI provider" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {providers.map(provider => (
                                                    <SelectItem key={provider.id} value={provider.id}>
                                                        {provider.displayName || provider.provider}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the AI provider for this knowledge base
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="embeddingModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Embedding Model</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select embedding model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableModels.map(model => (
                                                    <SelectItem key={model} value={model}>
                                                        {model}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Model used for generating document embeddings
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ragModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RAG Model</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select RAG model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableModels.map(model => (
                                                    <SelectItem key={model} value={model}>
                                                        {model}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            AI model used for answering questions with knowledge base context
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="w-20 h-10"
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="#3B82F6"
                                                    className="flex-1"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isPublic"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end">
                                        <FormLabel>Visibility</FormLabel>
                                        <div className="flex items-center gap-2 h-10">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription className="!mt-0">
                                                Public (accessible by all bots)
                                            </FormDescription>
                                        </div>
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
                                {knowledgeBase ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
