'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creationToolsApi, CreationTool, FormConfig, ExecutionFlow } from '@/lib/api/creation-tools';
import { useInfiniteCategories } from '@/lib/hooks/useCategories';
import { handleApiError } from '@/lib/utils/api-error';
import { toast } from 'sonner';
import { useKnowledgeBases } from '@/lib/hooks/use-kb'

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
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
    Loader2, ArrowLeft, Save, LayoutTemplate, Settings, Sparkles,
    ChevronDown, Table as TableIcon, Layers
} from 'lucide-react';
import { FormBuilder } from '@/components/features/creation-tools/FormBuilder';
import { toolKeys } from '@/lib/hooks/features/useCreationTools';
import { cn, slugify } from '@/lib/utils';

// --- Schema ---
const toolFormSchema = z.object({
    name: z.string().min(1, 'Tool name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().default(''),
    icon: z.string().default(''),
    coverImage: z.string().default(''),
    categoryIds: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    formConfig: z.any().default({ fields: [], steps: [] }),
    actions: z.array(z.any()).default([]),
    knowledgeBaseId: z.string().nullable().optional(),
    executionFlow: z.any().default({ steps: [] }),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

export default function EditCreationToolPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');

    // Fetch tool data
    const { data: tool, isLoading: isLoadingTool } = useQuery({
        queryKey: ['creation-tools', 'detail', id],
        queryFn: () => creationToolsApi.getById(id),
        enabled: !isNew && !!id,
    });

    // Use Infinite Categories for "Load More"
    const {
        data: infiniteCategories,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteCategories('creation-tool', 20);

    const categories = infiniteCategories?.pages.flatMap(page => page.data) || [];

    const { data: knowledgeBases = [] } = useKnowledgeBases();

    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema) as any,
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            icon: '',
            coverImage: '',
            categoryIds: [],
            isActive: true,
            formConfig: { fields: [], steps: [] },
            actions: [],
            executionFlow: { steps: [] },
            knowledgeBaseId: '',
        },
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { isDirty, isValid, dirtyFields }
    } = form;

    // Debug dirtiness
    useEffect(() => {
        if (isDirty) {
            console.log('Form is dirty. Fields:', dirtyFields);
        }
    }, [isDirty, dirtyFields]);
    const nameValue = useWatch({ control, name: 'name' });

    // Auto-generate slug
    useEffect(() => {
        if (isNew && nameValue) {
            setValue('slug', slugify(nameValue));
        }
    }, [isNew, nameValue, setValue]);

    // Handle initial data
    useEffect(() => {
        if (tool) {
            reset({
                name: tool.name || '',
                slug: tool.slug || '',
                description: tool.description || '',
                icon: tool.icon || '',
                coverImage: tool.coverImage || '',
                categoryIds: tool.categories?.map((c: { id: string }) => c.id) || [],
                isActive: !!tool.isActive,
                formConfig: tool.formConfig || { fields: [], steps: [] },
                actions: tool.actions || [],
                executionFlow: tool.executionFlow || { steps: [] },
                knowledgeBaseId: tool.knowledgeBaseId || '',
            });
        }
    }, [tool, reset]);

    const mutation = useMutation({
        mutationFn: (data: ToolFormValues) =>
            isNew ? creationToolsApi.create(data as any) : creationToolsApi.update(id, data as any),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: toolKeys.all });
            toast.success(isNew ? 'Tool created successfully' : 'Tool updated successfully');
            if (isNew) {
                router.push(`/admin/system/creation-tools/${data.id}` as any);
            }
        },
        onError: (error) => {
            toast.error(handleApiError(error));
        },
    });

    const onSubmit = (data: ToolFormValues) => {
        const payload = {
            ...data,
            knowledgeBaseId: data.knowledgeBaseId === '' ? null : data.knowledgeBaseId,
        };
        console.log('Submitting form data:', payload);
        mutation.mutate(payload as any);
    };

    const onInvalid = (errors: any) => {
        console.error('Detailed Form Errors:', JSON.stringify(errors, null, 2));
        const errorList = Object.entries(errors).map(([key, value]: [string, any]) => {
            return `${key}: ${value?.message || 'Invalid value'}`;
        });
        toast.error(`Validation failed: ${errorList[0] || 'Please check all fields'}`);
    };

    if (isLoadingTool && !isNew) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageShell
            title={isNew ? 'New Creation Tool' : `Edit: ${tool?.name}`}
            description="Configure identifying information, form structure, and execution logic."
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit(onSubmit as any, onInvalid)}
                        disabled={mutation.isPending || (!isDirty && !isNew) || !isValid}
                        className={cn(
                            "px-6 rounded-xl shadow-lg transition-all duration-300 font-bold",
                            (mutation.isPending || (!isDirty && !isNew) || !isValid)
                                ? "bg-muted text-muted-foreground shadow-none cursor-not-allowed grayscale opacity-50"
                                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:scale-[1.05] active:scale-95 shadow-xl"
                        )}
                    >
                        {mutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isNew ? 'Create Tool' : 'Save Changes'}
                    </Button>
                </div>
            }
        >
            <FormProvider {...form}>
                <div className="max-w-7xl mx-auto space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsHeader>
                            <TabsList className="bg-secondary/10 p-1 rounded-2xl border border-border/20">
                                <TabsTrigger value="general" className="rounded-xl px-6 py-2 content-center text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg">
                                    <Settings className="w-3.5 h-3.5 mr-2" />
                                    General Info
                                </TabsTrigger>
                                <TabsTrigger value="form" className="rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg">
                                    <LayoutTemplate className="w-3.5 h-3.5 mr-2" />
                                    Form Builder
                                </TabsTrigger>
                            </TabsList>
                        </TabsHeader>

                        {/* TAB 1: General Info */}
                        <TabsContent value="general" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* LEFT: Main Identity & Content (8 Columns) */}
                                <div className="lg:col-span-8 space-y-8">
                                    {/* Primary Info Card */}
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/10 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                                        <Card className="relative border-border/40 bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
                                            <CardContent className="p-8 lg:p-10 space-y-8">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/80">Identity & Purpose</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="md:col-span-2">
                                                        <FormField
                                                            control={control}
                                                            name="name"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Tool Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            placeholder="e.g. Master Copywriter AI"
                                                                            className="h-14 rounded-2xl bg-secondary/10 border-border/40 focus:border-primary/50 focus:ring-primary/10 text-base font-semibold transition-all px-5"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <FormField
                                                            control={control}
                                                            name="slug"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Access Slug</FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <Input {...field} disabled className="h-14 rounded-2xl bg-secondary/30 border-border/20 font-mono text-xs pl-5 pr-10" />
                                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20"><Sparkles className="w-4 h-4" /></div>
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={control}
                                                    name="description"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-1">Description</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    rows={4}
                                                                    placeholder="Briefly describe what this tool does..."
                                                                    className="rounded-2xl bg-secondary/10 border-border/40 focus:border-primary/50 focus:ring-primary/10 resize-none p-5 text-sm leading-relaxed"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Classification Section (Table Style) */}
                                    <div className="bg-secondary/5 border border-border/40 rounded-[2rem] p-8 lg:p-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/80">Classification</h3>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium ml-10">Organize this tool into relevant categories</p>
                                            </div>
                                            <div className="bg-background/40 px-3 py-1 rounded-full border border-border/10 flex items-center gap-2">
                                                <TableIcon className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">List View</span>
                                            </div>
                                        </div>

                                        <Card className="border-border/40 bg-background/20 rounded-2xl overflow-hidden">
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/40 bg-muted/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                <div className="col-span-7 flex items-center gap-4">
                                                    <div className="w-4 h-4" /> {/* Spacer for checkbox */}
                                                    Name
                                                </div>
                                                <div className="col-span-5">Access Slug</div>
                                            </div>

                                            <ScrollArea className="h-[300px]">
                                                <div className="divide-y divide-border/20">
                                                    <FormField
                                                        control={control}
                                                        name="categoryIds"
                                                        render={({ field }) => (
                                                            <>
                                                                {categories.map((c: any) => {
                                                                    const isChecked = field.value?.includes(c.id);
                                                                    return (
                                                                        <div
                                                                            key={c.id}
                                                                            className={cn(
                                                                                "grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-colors hover:bg-muted/30 cursor-pointer",
                                                                                isChecked && "bg-primary/[0.03]"
                                                                            )}
                                                                            onClick={() => {
                                                                                const newValue = isChecked
                                                                                    ? field.value?.filter(v => v !== c.id)
                                                                                    : [...(field.value || []), c.id];
                                                                                field.onChange(newValue);
                                                                            }}
                                                                        >
                                                                            <div className="col-span-7 flex items-center gap-4">
                                                                                <Checkbox
                                                                                    checked={isChecked}
                                                                                    onCheckedChange={(checked) => {
                                                                                        const newValue = checked
                                                                                            ? [...(field.value || []), c.id]
                                                                                            : field.value?.filter(v => v !== c.id);
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                    className="data-[state=checked]:bg-primary"
                                                                                />
                                                                                <span className={cn(
                                                                                    "text-xs font-semibold whitespace-nowrap",
                                                                                    isChecked ? "text-primary" : "text-foreground/80"
                                                                                )}>
                                                                                    {c.name}
                                                                                </span>
                                                                            </div>
                                                                            <div className="col-span-5 font-mono text-[10px] text-muted-foreground/50">
                                                                                {c.slug}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        )}
                                                    />
                                                </div>

                                                {/* Load More Button */}
                                                {hasNextPage && (
                                                    <div className="p-4 flex justify-center border-t border-border/20 bg-muted/5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                fetchNextPage();
                                                            }}
                                                            disabled={isFetchingNextPage}
                                                            className="text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-all hover:bg-primary/5 rounded-full px-6"
                                                        >
                                                            {isFetchingNextPage ? (
                                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                            ) : (
                                                                <ChevronDown className="w-3 h-3 mr-2" />
                                                            )}
                                                            Load More Categories
                                                        </Button>
                                                    </div>
                                                )}

                                                {categories.length === 0 && !isFetchingNextPage && (
                                                    <div className="p-10 text-center opacity-30">
                                                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No categories available</p>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </Card>
                                    </div>
                                </div>

                                {/* RIGHT: Media & Settings Sidebar (4 Columns) */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Asset Card */}
                                    <div className="relative group">
                                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Tool Thumbnail</Label>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[9px] text-muted-foreground font-medium">Standard Resolution</p>
                                                        <Badge variant="outline" className="text-[8px] opacity-40 px-1 py-0 border-none">1200x600px</Badge>
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={control}
                                                    name="coverImage"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <UnifiedFileUpload
                                                                    variant="cover"
                                                                    value={field.value}
                                                                    onChange={(url) => field.onChange(url)}
                                                                    bucket="images"
                                                                    aspectRatio={2}
                                                                    className="rounded-3xl shadow-lg border-2 border-border/20 transition-all hover:border-primary/40 overflow-hidden"
                                                                    description="Upload tool cover"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="h-px bg-border/40" />

                                                <FormField
                                                    control={control}
                                                    name="isActive"
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-border/20 transition-colors hover:bg-secondary/20">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="font-bold text-xs uppercase tracking-wider">Live Status</FormLabel>
                                                                <p className="text-[10px] text-muted-foreground">Visible in public library</p>
                                                            </div>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    className="data-[state=checked]:bg-primary"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* System Data Card */}
                                    <div className="bg-secondary/5 border border-border/20 rounded-[2rem] p-6 space-y-4">
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground/40">
                                            <Settings className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest font-mono">System Integrity</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-muted-foreground font-bold uppercase tracking-wider">Asset Bucket</span>
                                                <Badge variant="secondary" className="font-mono bg-white/5 hover:bg-white/10 text-primary border-none py-0">images/creation-tools</Badge>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-muted-foreground font-bold uppercase tracking-wider">Workspace Mode</span>
                                                <span className="font-mono text-foreground/60">Managed (Standard)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: Form Builder */}
                        <TabsContent value="form">
                            <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-[2rem]">
                                <CardContent className="p-0">
                                    <FormField
                                        control={control}
                                        name="formConfig"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <FormBuilder
                                                        config={field.value}
                                                        onChange={field.onChange}
                                                        onFieldRename={(oldName, newName) => {
                                                            // Logic to update execution flow variable references could go here
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
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
