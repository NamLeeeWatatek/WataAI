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
import { useBotForm } from '@/lib/hooks/useBotForm'

interface Bot {
    id: string
    name: string
    description?: string
    workspaceId: string
    defaultLanguage?: string
    timezone?: string
}

interface BotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bot?: Bot | null
    workspaceId: string
}

export function BotDialog({ open, onOpenChange, bot, workspaceId }: BotDialogProps) {
    const { form, handleSubmit, isSubmitting, errors } = useBotForm(workspaceId, bot || undefined)

    const onSubmit = async (data: any) => {
        await handleSubmit(data)
        form.reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{bot ? 'Edit Bot' : 'Create New Bot'}</DialogTitle>
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
                                        <Input placeholder="Customer Support Bot" {...field} />
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
                                            placeholder="Handles customer inquiries..."
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
                                name="defaultLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Language</FormLabel>
                                        <FormControl>
                                            <Input placeholder="en" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: en</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Timezone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="UTC" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: UTC</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={form.formState.isSubmitting}>
                                {bot ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
