'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { creationToolsApi, CreationTool, FormField } from '@/lib/api/creation-tools';
import { templatesApi } from '@/lib/api/templates';
import { getChannels } from '@/lib/api/channels';
import { Template } from '@/lib/types/template';
import { Channel } from '@/lib/types/channel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader2, ArrowLeft, Sparkles, Check, Plus, Filter, LayoutGrid, Settings, Facebook, Instagram, Share2, Globe, FileText, X, Eye } from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Media } from '@/components/ui/Media';
import { TemplateCardMedia } from '@/components/features/templates/TemplateCardMedia';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Form,
    FormField as ShadcnFormField,
} from '@/components/ui/Form';

import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { DynamicFormField } from '@/components/ui/DynamicFormField';

import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { useBreadcrumbStore } from '@/lib/stores/useBreadcrumbStore';

export default function CreationToolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { addJob } = useCreationJobs();
    const [tool, setTool] = useState<CreationTool | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [includeTemplate, setIncludeTemplate] = useState(false);
    const formConfig = tool?.formConfig || { fields: [] };
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const form = useForm<z.infer<any>>({
        defaultValues: {},
    });

    const setBreadcrumbName = useBreadcrumbStore(state => state.setBreadcrumbName)
    const removeBreadcrumbName = useBreadcrumbStore(state => state.removeBreadcrumbName)

    useEffect(() => {
        const fetchTool = async () => {
            if (!params.slug) return;

            try {
                const toolData = await creationToolsApi.getBySlug(params.slug as string);
                setTool(toolData);

                const defaults: Record<string, any> = {};
                let requiresChannels = false;
                const zodShape: Record<string, any> = {};

                toolData.formConfig.fields.forEach((field) => {
                    if (field.defaultValue !== undefined) {
                        defaults[field.name] = field.defaultValue;
                    }

                    let schema: any;

                    if (field.type === 'number') {
                        schema = z.number({ message: "Must be a number" });
                        if (field.validation?.min !== undefined) schema = schema.min(field.validation.min);
                        if (field.validation?.max !== undefined) schema = schema.max(field.validation.max);
                    } else if (field.type === 'checkbox') {
                        schema = z.boolean();
                    } else if (field.type === 'channel-selector') {
                        schema = z.array(z.string());
                        if (field.validation?.required) {
                            schema = (schema as z.ZodArray<any>).min(1, "Please select at least one channel");
                        }
                        requiresChannels = true;
                    } else if (field.type === 'file') {
                        schema = z.any().refine((val) => val && val.url, "File is required");
                    } else {
                        schema = z.string();
                        if (field.validation?.minLength) schema = schema.min(field.validation.minLength, `Minimum ${field.validation.minLength} characters`);
                        if (field.validation?.maxLength) schema = schema.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters`);
                        if (field.validation?.pattern) schema = schema.regex(new RegExp(field.validation.pattern), "Invalid format");
                    }

                    if (!field.validation?.required && field.type !== 'checkbox') {
                        schema = schema.optional().or(z.literal(''));
                    } else if (field.validation?.required) {
                        if (field.type === 'text' || field.type === 'textarea') {
                            schema = schema.min(1, "This field is required");
                        }
                    }

                    zodShape[field.name] = schema;

                    if (field.name === 'platforms') {
                        requiresChannels = true;
                    }
                });

                form.reset(defaults);

                if (requiresChannels) {
                    try {
                        const channelsData = await getChannels();
                        setChannels(channelsData);
                    } catch (err) {
                        console.error("Failed to load channels", err);
                    }
                }

                if (params.slug) setBreadcrumbName(params.slug as string, toolData.name);
            } catch (error) {
                console.error('Failed to load tool:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load creation tool',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTool();

        return () => {
            if (params.slug) removeBreadcrumbName(params.slug as string)
        }
    }, [params.slug, form, setBreadcrumbName, removeBreadcrumbName]);

    // This effect is now just for breadcrumbs and other side effects when tool state changes
    useEffect(() => {
        if (tool && params.slug) {
            setBreadcrumbName(params.slug as string, tool.name)
        }
    }, [tool, params.slug, setBreadcrumbName])

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!tool?.id) return;

            try {
                // Construct filter object
                const filters: any = {
                    creationToolId: tool.id
                };

                if (debouncedSearch && debouncedSearch.trim() !== '') {
                    filters.name = debouncedSearch.trim();
                }

                if (selectedCategory && selectedCategory !== 'all') {
                    filters.category = selectedCategory;
                }

                // Call API
                const result = await templatesApi.findAll({
                    filters: JSON.stringify(filters),
                    limit: 100
                });

                const templatesData = Array.isArray(result) ? result : (result?.data || []);
                setTemplates(templatesData);

                // Auto-select template if ID is in URL
                const queryTemplateId = searchParams.get('templateId');
                if (queryTemplateId && !selectedTemplate) {
                    const match = templatesData.find((t: any) => t.id === queryTemplateId);
                    if (match) {
                        handleTemplateSelect(match);
                    }
                }

                // Extract categories from unfiltered list or first load
                if ((!debouncedSearch && selectedCategory === 'all') || categories.length <= 1) {
                    const distinctCategories = ['all', ...Array.from(new Set(templatesData.map((t: any) => {
                        if (t.category && typeof t.category === 'object') {
                            return t.category.slug || t.category.name || 'other';
                        }
                        return t.category || 'other';
                    })))];
                    setCategories(distinctCategories as string[]);
                }
            } catch (error) {
                console.error("Failed to search templates", error);
            }
        };
        fetchTemplates();
    }, [debouncedSearch, selectedCategory, tool?.id]);



    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        if (template.prefilledData) {
            // Merge per-field to trigger form updates
            Object.entries(template.prefilledData).forEach(([key, value]) => {
                form.setValue(key, value);
            });
        }
    };

    const onSubmit = async (data: any) => {
        if (!tool) return;
        setSubmitting(true);

        try {
            const inputData: any = {
                ...data,
                includeTemplate: includeTemplate
            };

            if (selectedTemplate?.id) {
                inputData.templateId = selectedTemplate.id;
            }

            const job = await creationJobsApi.create({
                creationToolId: tool.id,
                inputData,
            });

            const newJob: CreationJob = {
                id: job.id,
                status: CreationJobStatus.PENDING,
                progress: 0,
                creationToolId: tool.id,
                inputData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            addJob(newJob);
        } catch (error) {
            console.error('Job submission error:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit creation job',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // We use the 'templates' state which is now filtered via API
    const filteredTemplates = templates;


    const renderFormField = (field: FormField) => {
        return (
            <ShadcnFormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                    <DynamicFormField
                        field={field}
                        value={formField.value}
                        onChange={(_, val) => formField.onChange(val)}
                        allValues={form.watch()}
                    />
                )}
            />
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tool) return null;

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            <div className="flex-1 overflow-hidden p-0 sm:p-2 lg:p-4">
                <div className="h-full w-full">
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* LEFT: Templates Area (7 cols ~ 58%) */}
                        <Card className="lg:col-span-7 flex flex-col h-full overflow-hidden">
                            <div className="px-6 py-5 border-b flex-none flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => router.back()}
                                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-background shadow-sm shrink-0"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>

                                    {/* Tool Visual Identity */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {(tool.coverImage || tool.icon) ? (
                                            <div className="w-12 h-12 rounded-xl border border-primary/20 overflow-hidden bg-primary/5 shrink-0 flex items-center justify-center">
                                                {tool.coverImage ? (
                                                    <Media
                                                        src={tool.coverImage}
                                                        alt={tool.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Sparkles className="w-6 h-6 text-primary" />
                                                )}
                                            </div>
                                        ) : null}
                                        <div className="min-w-0">
                                            <h1 className="text-xl font-bold tracking-tight truncate">{tool.name}</h1>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="relative w-full sm:max-w-[240px]">
                                        <Search
                                            placeholder="Search templates..."
                                            value={searchQuery}
                                            onChange={(e: any) => setSearchQuery(e.target.value)}
                                            onClear={() => setSearchQuery("")}
                                            className="h-9"
                                        />
                                    </div>

                                    {/* Compact Category Filters */}
                                    <div className="hidden sm:flex flex-wrap gap-1.5 flex-1 justify-end">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                                selectedCategory === 'all'
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-muted/10 hover:bg-muted/30 border-border/40 text-muted-foreground"
                                            )}
                                        >
                                            ALL
                                        </button>
                                        {categories.filter(c => c !== 'all').slice(0, 3).map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                                    selectedCategory === cat
                                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                        : "bg-muted/10 hover:bg-muted/30 border-border/40 text-muted-foreground"
                                                )}
                                            >
                                                {cat.replace('-', ' ')}
                                            </button>
                                        ))}
                                        {categories.length > 4 && (
                                            <Badge variant="outline" className="text-[10px] px-2">+{categories.length - 4}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Full Categories View for mobile or overflow */}
                            <div className="px-6 py-2 border-b bg-muted/5 flex sm:hidden">
                                <ScrollArea className="w-full">
                                    <div className="flex gap-2 pb-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] uppercase font-bold whitespace-nowrap border",
                                                    selectedCategory === cat
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-border text-muted-foreground"
                                                )}
                                            >
                                                {cat === 'all' ? 'ALL' : cat.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                {filteredTemplates.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="font-semibold text-lg">No templates found</h3>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                        {filteredTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                onClick={() => handleTemplateSelect(template)}
                                                className={cn(
                                                    "group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300",
                                                    selectedTemplate?.id === template.id
                                                        ? "border-primary"
                                                        : "border-transparent bg-muted/20 hover:border-primary/30"
                                                )}
                                            >
                                                <TemplateCardMedia
                                                    thumbnailUrl={template.thumbnailUrl}
                                                    name={template.name}
                                                    className="w-full h-full absolute inset-0"
                                                    autoPlayOnHover={true}
                                                    icon={template.icon}
                                                />

                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 pb-5 px-5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <h3 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-sm group-hover:text-primary-foreground transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    {template.category && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <Badge variant="secondary" className="bg-white/20 text-white">
                                                                {typeof template.category === 'object' ? (template.category as any).name || (template.category as any).slug : template.category}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedTemplate?.id === template.id && (
                                                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-in zoom-in spin-in-90 duration-300 z-10">
                                                        <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </Card>

                        {/* RIGHT: Form Area (5 cols ~ 42%) */}
                        <Card className="lg:col-span-5 flex flex-col h-full overflow-hidden relative">
                            <div className="p-5 border-b flex-none bg-muted/5 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary animate-pulse" />
                                    Configure
                                </h2>
                                {selectedTemplate && (
                                    <Badge variant="secondary" className="text-[10px] font-bold rounded-lg px-2">
                                        {selectedTemplate.name}
                                    </Badge>
                                )}
                            </div>

                            <ScrollArea className="flex-1 p-5">
                                <Form {...form}>
                                    <form id="creation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">


                                        {tool.formConfig.fields.map((field) => (
                                            <div key={field.name} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                {renderFormField(field)}
                                            </div>
                                        ))}
                                    </form>
                                </Form>
                            </ScrollArea>

                            <div className="p-5 border-t bg-muted/5 flex-none mt-auto space-y-4">
                                {tool.executionFlow.type === 'ai-generation' && selectedTemplate && (
                                    <div className="flex items-center space-x-3 p-4 rounded-xl border bg-primary/5 border-primary/10 mb-6 font-medium animate-in fade-in slide-in-from-bottom-2">
                                        <Checkbox
                                            id="include-template-run"
                                            checked={includeTemplate}
                                            onCheckedChange={(checked) => setIncludeTemplate(!!checked)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="include-template-run"
                                                className="text-sm font-bold leading-none cursor-pointer flex items-center gap-2"
                                            >
                                                Include Template Context
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">Optimization</Badge>
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Send tool-specific template instructions to the AI for better results.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        form="creation-form"
                                        size="lg"
                                        className={cn(
                                            "w-full font-bold group bg-primary transition-all active:scale-95",
                                            submitting && "opacity-80"
                                        )}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                Initializing Matrix...
                                            </>
                                        ) : (
                                            <>
                                                Execute Generation
                                                <Sparkles className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
