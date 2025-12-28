import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { handleFormError } from '@/lib/utils/form-errors'

const folderFormSchema = z.object({
    name: z.string().min(1, 'Folder name is required'),
    description: z.string().optional(),
})

interface KBFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: { name: string; description: string }) => Promise<void>
}

export function KBFolderDialog({ open, onOpenChange, onSubmit }: KBFolderDialogProps) {
    const form = useForm<z.infer<typeof folderFormSchema>>({
        resolver: zodResolver(folderFormSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    })

    const handleSubmit = async (values: z.infer<typeof folderFormSchema>) => {
        try {
            await onSubmit({
                name: values.name,
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
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
                                        <Input placeholder="Folder name" {...field} />
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
                                            placeholder="Optional description"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={form.formState.isSubmitting}>
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

