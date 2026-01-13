'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creationToolsApi, CreationTool, FormConfig, ExecutionFlow } from '@/lib/api/creation-tools';
import { useCategories } from '@/lib/hooks/useCategories';
import { handleApiError } from '@/lib/utils/api-error';
import { toast } from 'sonner';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconPicker } from '@/components/ui/IconPicker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Loader2, ArrowLeft, Save, LayoutTemplate, Settings, Play, Sparkles, Plus, Edit2, Trash2 } from 'lucide-react';
import { FormBuilder } from '@/components/features/creation-tools/FormBuilder';
import { ExecutionConfig } from '@/components/features/creation-tools/ExecutionConfig';
import { toolKeys } from '@/lib/hooks/features/useCreationTools';

// Templates Imports
import { useTemplates } from '@/lib/hooks/useTemplates';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { Template, CreateTemplateDto, UpdateTemplateDto } from '@/lib/types/template';
import { TemplateCardMedia } from '@/components/features/templates/TemplateCardMedia';
import { TemplateDialog } from '@/components/features/creation-tools/TemplateDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { cn, slugify } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';


// --- Schema ---
const toolFormSchema = z.object({
    name: z.string().min(1, 'Tool name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    categoryIds: z.array(z.string()),
    isActive: z.boolean(),
    formConfig: z.custom<FormConfig>((data) => {
        return data && typeof data === 'object' && Array.isArray((data as any).fields);
    }),
    executionFlow: z.custom<ExecutionFlow>((data) => {
        return data && typeof data === 'object' && 'type' in data;
    }),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

export default function EditCreationToolPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const isNew = id === 'new';

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');

    // Fetch Tool Data
    const { data: tool, isLoading: isLoadingTool, isError } = useQuery({
        queryKey: ['creation-tool', id],
        queryFn: () => creationToolsApi.getById(id),
        enabled: !isNew,
        retry: 1
    });

    // Fetch Categories
    const { data: categories = [] } = useCategories('creation-tool');

    // Form Setup
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

    const { reset, setValue, control, handleSubmit, formState: { isSubmitting, isDirty } } = form;

    const watchedName = useWatch({
        control,
        name: 'name'
    });

    // Declarative Side Effect: Sync Name -> Slug
    useEffect(() => {
        if (isNew && watchedName) {
            setValue('slug', slugify(watchedName), {
                shouldDirty: true,
                shouldValidate: true,
                shouldTouch: true
            });
        }
    }, [watchedName, isNew, setValue]);

    // Load Data
    useEffect(() => {
        if (!isNew && tool) {
            const cats = tool.categories?.map(c => c.id) || tool.categoryIds || [];
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
        }
    }, [isNew, tool, reset]);


    // Mutation
    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreationTool>) =>
            isNew ? creationToolsApi.create(data) : creationToolsApi.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: toolKeys.all });
            queryClient.invalidateQueries({ queryKey: ['creation-tool', id] });
            toast.success(isNew ? 'Tool created successfully' : 'Tool updated successfully');
            if (isNew) {
                router.push(`/system/creation-tools/${data.id}`);
            }
        },
        onError: (error) => {
            toast.error(handleApiError(error));
        }
    });

    const onSubmit = async (data: ToolFormValues) => {
        await updateMutation.mutateAsync(data);
    };



    if (isLoadingTool) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isNew && isError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 gap-4">
                <h3 className="text-lg font-semibold text-destructive">Failed to load tool</h3>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <PageShell
            title={isNew ? 'Create New Tool' : `Edit: ${tool?.name || '...'}`}
            description={isNew ? 'Configure a new AI creation tool' : 'Manage tool configuration, form fields and execution flow'}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push('/system/creation-tools')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                    {/* Trigger form submit manually */}
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting || (isNew && updateMutation.isSuccess) || (!isDirty && !isNew)}
                    >
                        {isSubmitting || (isNew && updateMutation.isSuccess) ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isNew ? (updateMutation.isSuccess ? 'Creating...' : 'Create Tool') : 'Save Changes'}
                    </Button>
                </div>
            }
        >
            <FormProvider {...form}>
                <div className="flex flex-col space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
                            <TabsTrigger value="general" className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                General Info
                            </TabsTrigger>
                            <TabsTrigger value="form" className="flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4" />
                                Form Builder
                            </TabsTrigger>
                            <TabsTrigger value="execution" className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Execution Flow
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: General Info */}
                        <TabsContent value="general">
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tool Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g. Blog Post Generator"
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
                                    </div>

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
                                                        placeholder="Describe what this tool does..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Categories</Label>
                                            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto bg-muted/10">
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
                                                                                className="flex items-center space-x-3 space-y-0"
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
                                                    <p className="text-sm text-muted-foreground italic text-center">No categories found</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
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
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 p-4 rounded-lg border bg-secondary/10 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="font-medium text-base">
                                                                Active Status
                                                            </FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Visible to users in the tool library
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: Form Builder */}
                        <TabsContent value="form">
                            <Card className="border-none shadow-none bg-transparent">
                                <CardContent className="p-0">
                                    <FormField
                                        control={control}
                                        name="formConfig"
                                        render={({ field }) => (
                                            <div className="h-[calc(100vh-250px)] min-h-[600px] border rounded-lg bg-background overflow-hidden shadow-sm">
                                                <FormBuilder
                                                    config={field.value}
                                                    onChange={(config) => field.onChange(config)}
                                                    onFieldRename={(oldName, newName) => {
                                                        const currentFlow = form.getValues('executionFlow');
                                                        if (currentFlow.type === 'ai-generation' && currentFlow.promptTemplate) {
                                                            // Simple Regex replacement for {{name}} or {name} or [name] depending on usage
                                                            // Standardized to {{name}} in our UI feedback
                                                            const newTemplate = currentFlow.promptTemplate.replace(
                                                                new RegExp(`{{${oldName}}}`, 'g'),
                                                                `{{${newName}}}`
                                                            );
                                                            if (newTemplate !== currentFlow.promptTemplate) {
                                                                setValue('executionFlow', { ...currentFlow, promptTemplate: newTemplate }, { shouldDirty: true });
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 3: Execution Flow */}
                        <TabsContent value="execution">
                            <Card>
                                <CardContent className="pt-6">
                                    <FormField
                                        control={control}
                                        name="executionFlow"
                                        render={({ field }) => (
                                            <ExecutionConfig
                                                config={field.value}
                                                onChange={field.onChange}
                                                availableFields={form.getValues('formConfig').fields}
                                            />
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </FormProvider>
        </PageShell>
    );
}
