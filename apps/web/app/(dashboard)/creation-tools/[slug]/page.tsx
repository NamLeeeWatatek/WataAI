'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Loader2, ArrowLeft, Sparkles, Check, Search, Plus, Filter, LayoutGrid, Settings, Facebook, Instagram, Share2, Globe, FileText, X, Eye } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { ImagePreview } from '@/components/ui/ImagePreview';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField as ShadcnFormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form';

import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { FileDropzone } from '@/components/ui/FileUpload';

import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { useBreadcrumbStore } from '@/lib/stores/useBreadcrumbStore';

export default function CreationToolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { addJob } = useCreationJobs();
    const [tool, setTool] = useState<CreationTool | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
        if (params.slug) {
            loadTool(params.slug as string);
        }
        return () => {
            if (params.slug) removeBreadcrumbName(params.slug as string)
        }
    }, [params.slug]);

    useEffect(() => {
        if (tool && params.slug) {
            setBreadcrumbName(params.slug as string, tool.name)
        }
    }, [tool, params.slug, setBreadcrumbName])

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!tool?.id) return;
            try {
                const filters: any = {
                    creationToolId: tool.id
                };

                if (debouncedSearch && debouncedSearch.trim() !== '') {
                    filters.name = debouncedSearch.trim();
                }

                if (selectedCategory && selectedCategory !== 'all') {
                    filters.category = selectedCategory;
                }
                const result = await templatesApi.findAll({
                    filters: JSON.stringify(filters),
                    limit: 100
                });

                setTemplates(result.data);
            } catch (error) {
                console.error("Failed to search templates", error);
            }
        };
        fetchTemplates();
    }, [debouncedSearch, selectedCategory, tool?.id]);

    const loadTool = async (slug: string) => {
        try {
            const toolData = await creationToolsApi.getBySlug(slug);
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
                    schema = z.array(z.string()).min(1, "Please select at least one channel");
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

            const dynamicSchema = z.object(zodShape);
            form.reset(defaults);

            const templatesData = await templatesApi.findByCreationTool(toolData.id);
            setTemplates(templatesData);

            // Extract categories
            const distinctCategories = ['all', ...Array.from(new Set(templatesData.map((t: any) => {
                if (t.category && typeof t.category === 'object') {
                    return t.category.slug || t.category.name || 'other';
                }
                return t.category || 'other';
            })))];
            setCategories(distinctCategories as string[]);

            if (requiresChannels) {
                try {
                    const channelsData = await getChannels();
                    setChannels(channelsData);
                } catch (err) {
                    console.error("Failed to load channels", err);
                }
            }

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
            const inputData = { ...data, templateId: selectedTemplate?.id };

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

    const shouldShowField = (field: FormField): boolean => {
        if (!field.showIf) return true;

        // Watch the dependency field
        const targetValue = form.watch(field.showIf.field);

        switch (field.showIf.operator) {
            case 'equals':
                return targetValue === field.showIf.value;
            case 'not-equals':
                return targetValue !== field.showIf.value;
            case 'contains':
                return String(targetValue).includes(field.showIf.value);
            default:
                return true;
        }
    };

    const getPlatformIcon = (type: string) => {
        switch (type) {
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
            case 'telegram': return <Share2 className="w-4 h-4 text-sky-500" />;
            default: return <Globe className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const renderFormField = (field: FormField) => {
        // We handle visibility inside the render to use 'watch' hook naturally
        const isVisible = shouldShowField(field);
        if (!isVisible) return null;

        // Construct rules for RHF (Simple approach without complex Zod resolver for now)
        const rules: any = {
            required: field.validation?.required ? "This field is required" : false,
        };
        if (field.validation?.min) rules.min = { value: field.validation.min, message: `Minimum value is ${field.validation.min}` };
        if (field.validation?.max) rules.max = { value: field.validation.max, message: `Maximum value is ${field.validation.max}` };
        if (field.validation?.minLength) rules.minLength = { value: field.validation.minLength, message: `Minimum ${field.validation.minLength} characters` };

        return (
            <ShadcnFormField
                key={field.name}
                control={form.control}
                name={field.name}
                rules={rules}
                render={({ field: formField }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium flex items-center gap-1">
                            {field.label}
                            {field.validation?.required && <span className="text-destructive">*</span>}
                        </FormLabel>

                        {field.description && (
                            <FormDescription className="text-xs text-muted-foreground mt-0">
                                {field.description}
                            </FormDescription>
                        )}

                        <FormControl>
                            {(() => {
                                switch (field.type) {
                                    case 'textarea':
                                        return (
                                            <Textarea
                                                placeholder={field.placeholder}
                                                className="resize-none bg-background text-sm min-h-[120px]"
                                                {...formField}
                                            />
                                        );
                                    case 'select':
                                        return (
                                            <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {field.options?.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        );
                                    case 'channel-selector':
                                        const activeChannels = channels.filter(c => c.status === 'active' || c.status === 'connected');
                                        const currentValues: string[] = Array.isArray(formField.value) ? formField.value : [];

                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                {activeChannels.length > 0 ? (
                                                    activeChannels.map(channel => {
                                                        const isSelected = currentValues.includes(channel.type);
                                                        return (
                                                            <div
                                                                key={channel.id}
                                                                onClick={() => {
                                                                    const newValue = isSelected
                                                                        ? currentValues.filter(v => v !== channel.type)
                                                                        : [...currentValues, channel.type];
                                                                    formField.onChange(newValue);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-primary/50",
                                                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0",
                                                                    isSelected ? "bg-primary border-primary" : "bg-muted border-muted-foreground/20"
                                                                )}>
                                                                    {isSelected ? (
                                                                        <Check className="w-4 h-4 text-primary-foreground" />
                                                                    ) : (
                                                                        getPlatformIcon(channel.type)
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium truncate">{channel.name || channel.type}</span>
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Connected" />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground capitalize">{channel.type}</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="col-span-2 py-6 flex flex-col items-center justify-center text-center gap-2 border border-dashed rounded-lg bg-muted/20">
                                                        <span className="text-sm text-muted-foreground">No active channels found.</span>
                                                        <Button variant="outline" size="sm" type="button" onClick={() => window.open('/channels', '_blank')}>
                                                            Connect Channels
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    case 'checkbox':
                                        return (
                                            <div className="flex items-center space-x-2 p-1">
                                                <Checkbox
                                                    checked={formField.value}
                                                    onCheckedChange={formField.onChange}
                                                />
                                                <Label className="font-normal cursor-pointer text-sm">
                                                    Yes, I agree
                                                </Label>
                                            </div>
                                        );
                                    case 'file':
                                        return (
                                            <div className="mt-1">
                                                {formField.value ? (
                                                    <div className="relative group rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-md overflow-hidden hover:shadow-xl transition-all duration-300 p-0 animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex items-center gap-4 p-4">
                                                            {typeof formField.value === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(formField.value.split('?')[0]) ? (
                                                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/10 bg-muted shrink-0 shadow-inner">
                                                                    <img src={formField.value} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shrink-0 border border-primary/10 shadow-inner">
                                                                    <FileText className="w-7 h-7 text-primary" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-black truncate pr-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
                                                                        {typeof formField.value === 'string' ? formField.value.split('/').pop()?.split('?')[0] : 'File Ready'}
                                                                    </span>
                                                                    <div className="flex gap-1 shrink-0">
                                                                        {typeof formField.value === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(formField.value.split('?')[0]) && (
                                                                            <ImagePreview src={formField.value}>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                </Button>
                                                                            </ImagePreview>
                                                                        )}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                                                            onClick={() => formField.onChange(null)}
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-tighter">
                                                                        {typeof formField.value === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(formField.value.split('?')[0]) ? 'Image' : 'Document'}
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground font-bold italic opacity-70">
                                                                        System verified • Ready to sync
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="h-1 w-full bg-primary/20">
                                                            <div className="h-full w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <FileDropzone
                                                        height="h-32"
                                                        maxSize={50 * 1024 * 1024} // 50MB
                                                        onUploadComplete={(url, fileData) => {
                                                            formField.onChange(url);
                                                        }}
                                                        onUploadError={(error) => {
                                                            toast({
                                                                title: "Upload Failed",
                                                                description: error.message,
                                                                variant: "destructive"
                                                            });
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    case 'radio':
                                        return (
                                            <RadioGroup
                                                onValueChange={formField.onChange}
                                                defaultValue={formField.value}
                                                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                                            >
                                                {field.options?.map((opt) => (
                                                    <div key={opt.value}>
                                                        <RadioGroupItem
                                                            value={opt.value}
                                                            id={`${field.name}-${opt.value}`}
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor={`${field.name}-${opt.value}`}
                                                            className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <span className="text-sm font-semibold">{opt.label}</span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        );
                                    default:
                                        // Text, Number, standard Input
                                        return (
                                            <Input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                className="bg-background"
                                                {...formField}
                                                onChange={(e) => {
                                                    // Handle number type specifically
                                                    const val = field.type === 'number' ?
                                                        (e.target.value === '' ? '' : Number(e.target.value))
                                                        : e.target.value;
                                                    formField.onChange(val);
                                                }}
                                            />
                                        );
                                }
                            })()}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
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
                        <Card variant="glass" rounded="xl" className="lg:col-span-7 flex flex-col h-full overflow-hidden border-border/40">
                            <div className="px-6 py-5 border-b flex-none flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        rounded="full"
                                        onClick={() => router.back()}
                                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm shrink-0"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="min-w-0">
                                        <h1 className="text-xl font-bold tracking-tight truncate">{tool.name}</h1>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="relative w-full sm:max-w-[240px]">
                                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search templates..."
                                            className="pl-9 h-9 border-border/60 bg-muted/20"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Compact Category Filters */}
                                    <div className="hidden sm:flex flex-wrap gap-1.5 flex-1 justify-end">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                                selectedCategory === 'all'
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-accent border-border text-muted-foreground"
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
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background hover:bg-accent border-border text-muted-foreground"
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
                                                    "group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-500 ease-out",
                                                    selectedTemplate?.id === template.id
                                                        ? "border-primary ring-4 ring-primary/10 shadow-2xl scale-[0.98]"
                                                        : "border-transparent bg-muted/20 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]"
                                                )}
                                            >
                                                {/* Thumbnail */}
                                                <div className="absolute inset-0 bg-secondary/10">
                                                    {template.thumbnailUrl ? (
                                                        <img
                                                            src={template.thumbnailUrl}
                                                            alt={template.name}
                                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted/10 group-hover:bg-muted/20 transition-colors">
                                                            <Sparkles className="w-12 h-12 text-muted-foreground/20 group-hover:text-primary/40 transition-colors duration-500" />
                                                        </div>
                                                    )}
                                                    {/* Glass overlay on non-hover to brighten, fades out on hover */}
                                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </div>

                                                {/* Labels overlay - Smoother gradient */}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-5 px-5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <h3 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-sm group-hover:text-primary-foreground transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    {template.category && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 h-auto">
                                                                {typeof template.category === 'object' ? (template.category as any).name || (template.category as any).slug : template.category}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Active Checkmark - enhanced animation */}
                                                {selectedTemplate?.id === template.id && (
                                                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 animate-in zoom-in spin-in-90 duration-300 z-10">
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
                        <Card variant="premium" rounded="xl" className="lg:col-span-5 flex flex-col h-full overflow-hidden relative border-border/40 ring-1 ring-white/5 shadow-2xl">
                            <div className="p-5 border-b flex-none bg-muted/5 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary animate-pulse" />
                                    Configure
                                </h2>
                                {selectedTemplate && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                        {selectedTemplate.name}
                                    </Badge>
                                )}
                            </div>

                            <ScrollArea className="flex-1 p-5">
                                <Form {...form}>
                                    <form id="creation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {!selectedTemplate && (
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-foreground text-sm flex flex-col items-center justify-center text-center gap-3 py-12 animate-pulse">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <LayoutGrid className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Ready to create?</p>
                                                    <p className="text-muted-foreground text-xs mt-1">Select a template from the gallery to begin</p>
                                                </div>
                                            </div>
                                        )}

                                        {tool.formConfig.fields.map((field) => (
                                            <div key={field.name} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                {renderFormField(field)}
                                            </div>
                                        ))}
                                    </form>
                                </Form>
                            </ScrollArea>

                            <div className="p-5 border-t bg-muted/5 flex-none mt-auto space-y-4">
                                <Button
                                    type="submit"
                                    form="creation-form"
                                    size="xl"
                                    rounded="xl"
                                    disabled={submitting || !selectedTemplate}
                                    className={cn(
                                        "w-full font-black tracking-tight shadow-xl transition-all h-14",
                                        !selectedTemplate ? "opacity-50 grayscale" : "hover:translate-y-[-2px] hover:shadow-primary/20 hover:shadow-xl active:translate-y-[0px] bg-primary"
                                    )}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            {tool.formConfig.submitLabel || 'Generate Now'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
