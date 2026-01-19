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
import { useKnowledgeBases } from '@/lib/hooks/features/useKnowledgeBases';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { UnifiedFileUpload } from '@/components/shared/UnifiedFileUpload';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsHeader } from '@/components/ui/Tabs';
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
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/Badge';


// --- Schema ---
const toolFormSchema = z.object({
    name: z.string().min(1, 'Tool name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional(),
    categoryIds: z.array(z.string()),
    isActive: z.boolean(),
    formConfig: z.custom<FormConfig>((data) => {
        return data && typeof data === 'object' && Array.isArray((data as any).fields);
    }),
    knowledgeBaseId: z.string().optional(),
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

    // Fetch Knowledge Bases
    const { knowledgeBases = [] } = useKnowledgeBases(tool?.workspaceId);

    // Form Setup
    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            icon: '',
            coverImage: '',
            categoryIds: [],
            isActive: true,
            formConfig: { fields: [], submitLabel: 'Generate' },
            executionFlow: { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' },
            knowledgeBaseId: '',
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
                coverImage: tool.coverImage || '',
                categoryIds: cats,
                isActive: tool.isActive ?? true,
                formConfig: tool.formConfig || { fields: [], submitLabel: 'Generate' },
                executionFlow: tool.executionFlow || { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' },
                knowledgeBaseId: tool.knowledgeBaseId || '',
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
                        <TabsHeader>
                            <TabsList variant="pills">
                                <TabsTrigger value="general" variant="pills">
                                    <Settings className="w-4 h-4 mr-2" />
                                    General Info
                                </TabsTrigger>
                                <TabsTrigger value="form" variant="pills">
                                    <LayoutTemplate className="w-4 h-4 mr-2" />
                                    Form Builder
                                </TabsTrigger>
                                <TabsTrigger value="execution" variant="pills">
                                    <Play className="w-4 h-4 mr-2" />
                                    Execution Flow
                                </TabsTrigger>
                            </TabsList>
                        </TabsHeader>

                        {/* TAB 1: General Info */}
                        <TabsContent value="general">
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    <FormField
                                        control={control}
                                        name="coverImage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex flex-col mb-4">
                                                    <FormLabel className="text-sm font-bold uppercase tracking-[0.2em] text-primary/70">Cover Image</FormLabel>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Recommended size: 1200x600px</p>
                                                </div>
                                                <FormControl>
                                                    <UnifiedFileUpload
                                                        variant="cover"
                                                        value={field.value}
                                                        onChange={(url) => field.onChange(url)}
                                                        bucket="images"
                                                        className="aspect-[21/9]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tool Name <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g. Blog Post Generator"
                                                            className="h-12 rounded-xl bg-muted/5 border-muted-foreground/10 focus:border-primary/30"
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
                                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slug</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled className="h-12 rounded-xl bg-muted/50 border-muted-foreground/10" />
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
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="Describe what this tool does..."
                                                        className="rounded-xl bg-muted/5 border-muted-foreground/10 focus:border-primary/30 min-h-[100px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categories</Label>
                                            <div className="border rounded-2xl p-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto bg-muted/5 border-muted-foreground/10">
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
                                                                        const isChecked = field.value?.includes(c.id);
                                                                        return (
                                                                            <FormItem
                                                                                key={c.id}
                                                                                className={cn(
                                                                                    "flex items-center space-x-3 space-y-0 p-3 rounded-xl border transition-all cursor-pointer",
                                                                                    isChecked ? "bg-primary/5 border-primary/20" : "bg-transparent border-transparent hover:bg-muted/50"
                                                                                )}
                                                                            >
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={isChecked}
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
                                                                                <FormLabel className="font-medium cursor-pointer text-sm mb-0 flex-1">
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
                                                    <p className="text-sm text-muted-foreground italic text-center col-span-full py-4">No categories found</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <FormField
                                                control={control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-4 p-5 rounded-2xl border bg-primary/5 border-primary/10 space-y-0">
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-0.5 leading-none">
                                                            <FormLabel className="font-bold text-base">
                                                                Active Status
                                                            </FormLabel>
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                Tool will be visible in the user tool library
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
                                            <FormItem>
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
                                            </FormItem>
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
        </PageShell >
    );
}
