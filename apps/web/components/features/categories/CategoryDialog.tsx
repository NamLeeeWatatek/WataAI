import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/Button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { IconPicker } from "@/components/ui/IconPicker"
import { Category, categoriesApi } from "@/lib/api/categories"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select"

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes"),
    description: z.string().optional(),
    icon: z.string().optional(),
    type: z.string().min(1, "Type is required"),
})

interface CategoryFormValues {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    type: string;
}

interface CategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: Category | null
    onSuccess: () => void
}

export function CategoryDialog({
    open,
    onOpenChange,
    category,
    onSuccess,
}: CategoryDialogProps) {
    const isEditing = !!category
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            icon: "",
            type: "system",
        },
    })

    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                icon: category.icon || "",
                type: category.type || "system",
            })
        } else {
            form.reset({
                name: "",
                slug: "",
                description: "",
                icon: "",
                type: "system",
            })
        }
    }, [category, form, open])

    // Auto-generate slug from name if slug is empty (only when creating)
    useEffect(() => {
        if (!isEditing) {
            const subscription = form.watch((value, { name }) => {
                if (name === "name" && value.name) {
                    const slug = value.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)+/g, "")

                    const currentSlug = form.getValues("slug")
                    if (!currentSlug || currentSlug === slug.substring(0, slug.length - 1)) { // rough check if user hasn't heavily modified slug
                        form.setValue("slug", slug)
                    }
                }
            })
            return () => subscription.unsubscribe()
        }
    }, [form, isEditing])

    async function onSubmit(data: CategoryFormValues) {
        setIsLoading(true)
        try {
            if (isEditing && category) {
                await categoriesApi.update(category.id, data)
                toast.success("Category updated successfully")
            } else {
                await categoriesApi.create(data)
                toast.success("Category created successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEditing ? "Failed to update category" : "Failed to create category")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the category details below."
                            : "Add a new category to organize your tools."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Productivity" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. productivity" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        URL-friendly identifier for the category.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <FormControl>
                                        <IconPicker value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="system">System (General)</SelectItem>
                                            <SelectItem value="creation-tool">Creation Tool</SelectItem>
                                            <SelectItem value="template">Template</SelectItem>
                                            <SelectItem value="bot">Bot</SelectItem>
                                            <SelectItem value="flow">Flow</SelectItem>
                                            <SelectItem value="channel">Channel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        The module this category belongs to.
                                    </FormDescription>
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
                                            placeholder="Optional description..."
                                            className="resize-none"
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
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Save Changes" : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
