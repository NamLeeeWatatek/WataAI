'use client';

import { useState, useEffect } from 'react';
import { CreationTool } from '@/lib/api/creation-tools';
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
import { ExecutionFlow } from '@/lib/api/creation-tools';
import { Label } from '@/components/ui/Label';

import { useCategories } from '@/lib/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconPicker } from '@/components/ui/IconPicker';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { Image } from '@/components/ui/Image';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool?: CreationTool | null;
    onSave: (data: Partial<CreationTool>) => Promise<void>;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FormBuilder } from './FormBuilder';
import { FormConfig } from '@/lib/api/creation-tools';

export function ToolDialog({
    open,
    onOpenChange,
    tool,
    onSave,
}: ToolDialogProps) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [formConfig, setFormConfig] = useState<FormConfig>({ fields: [], submitLabel: 'Generate' });
    const [executionFlow, setExecutionFlow] = useState<ExecutionFlow>({ type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Fetch categories for selection
    const { data: categories = [], isLoading: loadingCategories } = useCategories('creation-tool');

    useEffect(() => {
        if (tool && open) {
            setName(tool.name || '');
            setSlug(tool.slug || '');
            setDescription(tool.description || '');
            setIcon(tool.icon || '');
            setCoverImage(tool.coverImage || '');
            setPreviewUrl(tool.coverImage || '');
            // Handle both legacy single category and new multiple categories
            const cats = tool.categories?.map(c => c.id) || [];
            if (cats.length === 0 && (tool as any).category?.id) {
                cats.push((tool as any).category.id);
            }
            setSelectedCategories(cats);
            setIsActive(tool.isActive ?? true);
            setFormConfig(tool.formConfig || { fields: [], submitLabel: 'Generate' });
            setExecutionFlow(tool.executionFlow || { type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' });
        } else if (!open) {
            resetForm();
        }
    }, [tool, open]);

    const resetForm = () => {
        setName('');
        setSlug('');
        setDescription('');
        setIcon('');
        setCoverImage('');
        setPreviewFile(null);
        setPreviewUrl('');
        setSelectedCategories([]);
        setIsActive(true);
        setFormConfig({ fields: [], submitLabel: 'Generate' });
        setExecutionFlow({ type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' });
        setActiveTab('general');
    };

    const { uploadFile: uploadFileService } = useFileUpload({
        bucket: 'images',
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload an image (JPG, PNG, GIF, WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            let finalCoverImage = coverImage;

            if (previewFile) {
                setUploading(true);
                const result = await uploadFileService(previewFile);
                finalCoverImage = result?.fileUrl || '';
                setUploading(false);
            }

            await onSave({
                id: tool?.id,
                name,
                slug,
                description,
                icon,
                coverImage: finalCoverImage,
                categoryIds: selectedCategories,
                isActive,
                formConfig,
                executionFlow,
            });

            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save tool:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!tool) {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setSlug(generatedSlug);
        }
    };


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden bg-background/95 border-border/50 shadow-2xl backdrop-blur-xl h-[85vh] flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b border-border/50 flex-none">
                    <DialogTitle className="text-xl">{tool ? 'Edit Creation Tool' : 'Create Creation Tool'}</DialogTitle>
                    <DialogDescription>
                        {tool ? 'Update creation tool details and configuration' : 'Configure a new AI creation tool'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-2 border-b bg-muted/20">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="form">Form Builder</TabsTrigger>
                                <TabsTrigger value="execution">Execution Flow</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            <TabsContent value="general" className="mt-0 space-y-6 h-full">
                                {/* General Info Form content... same as before but wrapped */}
                                <div className="space-y-4">
                                    {/* ... keeping inputs for name, slug, description, category, active ... */}
                                    <div className="space-y-2">
                                        <Label htmlFor="tool-name">Tool Name <span className="text-destructive">*</span></Label>
                                        <Input id="tool-name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug</Label>
                                        <Input value={slug} disabled className="bg-muted/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Categories</Label>
                                        <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto bg-muted/20">
                                            {categories.map(c => (
                                                <div key={c.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`cat-${c.id}`}
                                                        checked={selectedCategories.includes(c.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedCategories(prev => [...prev, c.id]);
                                                            } else {
                                                                setSelectedCategories(prev => prev.filter(id => id !== c.id));
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`cat-${c.id}`} className="font-normal cursor-pointer text-sm mb-0">
                                                        {c.name}
                                                    </Label>
                                                </div>
                                            ))}
                                            {categories.length === 0 && (
                                                <p className="text-sm text-muted-foreground italic p-2 text-center">No categories found</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Icon</Label>
                                        <IconPicker value={icon} onChange={setIcon} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cover Image</Label>
                                        <div className="flex gap-4 items-start">
                                            <label
                                                htmlFor="tool-cover"
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                                                    "border-border hover:border-primary/50 hover:bg-muted/50",
                                                    previewUrl ? "border-solid" : ""
                                                )}
                                            >
                                                {previewUrl ? (
                                                    <div className="relative w-full h-full group">
                                                        <Image
                                                            src={previewUrl}
                                                            alt="Cover"
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Upload className="w-8 h-8 text-white" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setPreviewUrl('');
                                                                setPreviewFile(null);
                                                                setCoverImage('');
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-destructive transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                                                        <div className="p-3 rounded-full bg-secondary">
                                                            <Upload className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">Upload Cover</p>
                                                            <p className="text-[10px]">16:9 Recommended</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                            <input
                                                id="tool-cover"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 rounded-lg border bg-secondary/10">
                                        <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(!!checked)} />
                                        <Label>Active Status</Label>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="form" className="mt-0 h-full">
                                <FormBuilder config={formConfig} onChange={setFormConfig} />
                            </TabsContent>

                            <TabsContent value="execution" className="mt-0 h-full">
                                <ExecutionConfig
                                    config={executionFlow}
                                    onChange={setExecutionFlow}
                                    availableFields={formConfig.fields}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex-none">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={saving || uploading}>Cancel</Button>
                    <Button type="button" onClick={() => handleSubmit()} disabled={saving || uploading} className="min-w-[100px]">
                        {saving || uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {uploading ? 'Uploading...' : 'Saving...'}
                            </>
                        ) : 'Save Tool'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
