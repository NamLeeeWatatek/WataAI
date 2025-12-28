import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
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
import { Switch } from '@/components/ui/Switch'
import { FiGlobe, FiAlertCircle } from 'react-icons/fi'
import { toast } from 'sonner'
import axiosClient from '@/lib/axios-client'

const websiteFormSchema = z.object({
    url: z.string().url('Please enter a valid URL'),
    maxPages: z.number().min(1).max(500),
    maxDepth: z.number().min(1).max(10),
    followLinks: z.boolean(),
})

interface CrawlerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBaseId: string
    folderId?: string | null
    onSuccess?: () => void
}

export function KBCrawlerDialog({
    open,
    onOpenChange,
    knowledgeBaseId,
    folderId,
    onSuccess
}: CrawlerDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof websiteFormSchema>>({
        resolver: zodResolver(websiteFormSchema),
        defaultValues: {
            url: '',
            maxPages: 50,
            maxDepth: 3,
            followLinks: true,
        },
    })

    const handleSubmit = async (values: z.infer<typeof websiteFormSchema>) => {
        // Close dialog immediately
        onOpenChange(false)
        form.reset()

        // Start crawling silently in background
        try {
            toast.loading(`Crawling ${values.url}...`, { id: 'crawling' })

            const result: any = await axiosClient.post('/knowledge-bases/crawl/website', {
                ...values,
                knowledgeBaseId,
                folderId,
            })

            const successCount = result.documentsCreated - (result.errors?.length || 0)

            toast.dismiss('crawling')

            if (result.errors?.length > 0) {
                toast.warning(`${result.errors.length} pages failed during crawling`)
            }

            if (successCount > 0) {
                toast.success(`Successfully crawled ${successCount} pages!`)
                toast.info('Documents are being processed in the background.', {
                    duration: 3000
                })
            } else {
                toast.error('No pages could be crawled successfully.')
            }

            onSuccess?.()
        } catch (error) {
            toast.dismiss('crawling')
            console.error('Crawling failed:', error)
            toast.error('Failed to crawl website. Please try again.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Crawl Website</DialogTitle>
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
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxPages"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Pages</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxDepth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Depth</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="followLinks"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Follow Links</FormLabel>
                                        <FormDescription>
                                            Automatically crawl linked pages
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <FiAlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                The crawler will start from the URL and follow links within the same domain.
                                This may take several minutes depending on the number of pages.
                            </p>
                        </div>

                        <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
                            Start Crawling
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
