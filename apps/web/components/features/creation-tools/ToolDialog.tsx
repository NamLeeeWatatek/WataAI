'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreationTool, creationToolsApi } from '@/lib/api/creation-tools';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ExecutionConfig } from './ExecutionConfig';
import { ExecutionFlow, FormConfig } from '@/lib/api/creation-tools';
import { Label } from '@/components/ui/Label';

import { useCategories } from '@/lib/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconPicker } from '@/components/ui/IconPicker';
import { CoverUpload } from '@/components/ui/FileUpload';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FormBuilder } from './FormBuilder';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';

// Schema Definition
const toolFormSchema = z.object({
    name: z.string().min(1, 'Tool name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    categoryIds: z.array(z.string()),
    isActive: z.boolean(),
    formConfig: z.custom<FormConfig>((data) => {
        // Basic validation for form config if needed
        return data && typeof data === 'object' && Array.isArray((data as any).fields);
    }),
    executionFlow: z.custom<ExecutionFlow>((data) => {
        return data && typeof data === 'object' && 'type' in data;
    }),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

interface ToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool?: CreationTool | null;
    onSave: (data: Partial<CreationTool>) => Promise<void>;
}

export function ToolDialog({
    open,
    onOpenChange,
    tool,
    onSave,
}: ToolDialogProps) {
    const [activeTab, setActiveTab] = useState('general');

    // Fetch categories for selection
    const { data: categories = [], isLoading: loadingCategories } = useCategories('creation-tool');

    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            icon: '',
            categoryIds: [],
            isActive: true,
            formConfig: { fields: [], submitLabel: 'Generate' },
            executionFlow: { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' },
        },
    });

    const { reset, setValue, watch, control, handleSubmit, formState: { isSubmitting } } = form;

    // Sync form with tool data or reset when dialog opens/closes
    useEffect(() => {
        if (open) {
            if (tool) {
                // Handle both legacy single category and new multiple categories
                const cats = tool.categories?.map(c => c.id) || tool.categoryIds || [];
                // Fallback for legacy 'category' field if exists on tool (as any)
                if (cats.length === 0 && (tool as any).category?.id) {
                    cats.push((tool as any).category.id);
                }

                reset({
                    name: tool.name || '',
                    slug: tool.slug || '',
                    description: tool.description || '',
                    icon: tool.icon || '',
                    categoryIds: cats,
                    isActive: tool.isActive ?? true,
                    formConfig: tool.formConfig || { fields: [], submitLabel: 'Generate' },
                    executionFlow: tool.executionFlow || { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' },
                });
            } else {
                reset({
                    name: '',
                    slug: '',
                    description: '',
                    icon: '',
                    categoryIds: [],
                    isActive: true,
                    formConfig: { fields: [], submitLabel: 'Generate' },
                    executionFlow: { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' },
                });
            }
            setActiveTab('general');
        }
    }, [open, tool, reset]);

    const handleNameChange = (value: string) => {
        setValue('name', value);
        if (!tool) {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setValue('slug', generatedSlug);
        }
    };

    const onSubmit = async (data: ToolFormValues) => {
        try {
            await onSave({
                id: tool?.id,
                ...data
            });

            onOpenChange(false);
            reset();
        } catch (error) {
            console.error('Failed to save tool:', error);
            toast.error('Failed to save tool');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden bg-background/95 border-border/50 shadow-2xl backdrop-blur-xl max-h-[85vh] h-[85vh] flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b border-border/50 shrink-0">
                    <DialogTitle className="text-xl">{tool ? 'Edit Creation Tool' : 'Create Creation Tool'}</DialogTitle>
                    <DialogDescription>
                        {tool ? 'Update creation tool details and configuration' : 'Configure a new AI creation tool'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col min-h-0">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                                <div className="px-6 py-2 border-b bg-muted/20 shrink-0">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="general">General Info</TabsTrigger>
                                        <TabsTrigger value="form">Form Builder</TabsTrigger>
                                        <TabsTrigger value="execution">Execution Flow</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                                    <TabsContent value="general" className="mt-0 space-y-6 h-full data-[state=inactive]:hidden">
                                        <div className="space-y-4 pb-4">
                                            <FormField
                                                control={control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tool Name <span className="text-destructive">*</span></FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                onChange={(e) => handleNameChange(e.target.value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Slug</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} disabled className="bg-muted/50" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-2">
                                                <Label>Categories</Label>
                                                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto bg-muted/20">
                                                    <FormField
                                                        control={control}
                                                        name="categoryIds"
                                                        render={() => (
                                                            <>
                                                                {categories.map((c) => (
                                                                    <FormField
                                                                        key={c.id}
                                                                        control={control}
                                                                        name="categoryIds"
                                                                        render={({ field }) => {
                                                                            return (
                                                                                <FormItem
                                                                                    key={c.id}
                                                                                    className="flex items-center space-x-2 space-y-0"
                                                                                >
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={field.value?.includes(c.id)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                return checked
                                                                                                    ? field.onChange([...field.value, c.id])
                                                                                                    : field.onChange(
                                                                                                        field.value?.filter(
                                                                                                            (value) => value !== c.id
                                                                                                        )
                                                                                                    );
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel className="font-normal cursor-pointer text-sm mb-0">
                                                                                        {c.name}
                                                                                    </FormLabel>
                                                                                </FormItem>
                                                                            );
                                                                        }}
                                                                    />
                                                                ))}
                                                            </>
                                                        )}
                                                    />
                                                    {categories.length === 0 && (
                                                        <p className="text-sm text-muted-foreground italic p-2 text-center">No categories found</p>
                                                    )}
                                                </div>
                                            </div>

                                            <FormField
                                                control={control}
                                                name="icon"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Icon</FormLabel>
                                                        <FormControl>
                                                            <IconPicker value={field.value || ''} onChange={field.onChange} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />



                                            <FormField
                                                control={control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                rows={3}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 p-3 rounded-lg border bg-secondary/10 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            Active Status
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="form" className="mt-0 min-h-full data-[state=inactive]:hidden">
                                        <FormField
                                            control={control}
                                            name="formConfig"
                                            render={({ field }) => (
                                                <FormBuilder config={field.value} onChange={field.onChange} />
                                            )}
                                        />
                                    </TabsContent>

                                    <TabsContent value="execution" className="mt-0 min-h-full data-[state=inactive]:hidden">
                                        <FormField
                                            control={control}
                                            name="executionFlow"
                                            render={({ field }) => (
                                                <ExecutionConfig
                                                    config={field.value}
                                                    onChange={field.onChange}
                                                    availableFields={watch('formConfig').fields}
                                                />
                                            )}
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>

                            <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 shrink-0 z-10 sticky bottom-0">
                                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save Tool'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
