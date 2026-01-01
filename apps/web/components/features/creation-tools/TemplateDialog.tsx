'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Template } from '@/lib/types/template';
import { CoverUpload } from '@/components/ui/FileUpload';
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
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Film, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { IconPicker } from '@/components/ui/IconPicker';

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Template | null;
    creationToolId?: string;
    onSave: (data: Partial<Template>) => Promise<void>;
}

export function TemplateDialog({
    open,
    onOpenChange,
    template,
    creationToolId: initialToolId,
    onSave,
}: TemplateDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [icon, setIcon] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedToolId, setSelectedToolId] = useState<string>('');
    const [tools, setTools] = useState<any[]>([]);
    const [loadingTools, setLoadingTools] = useState(true);

    // Load creation tools for selection
    useEffect(() => {
        const loadTools = async () => {
            try {
                const data = await creationToolsApi.getActive();
                setTools(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load tools:', error);
            } finally {
                setLoadingTools(false);
            }
        };
        if (open) {
            loadTools();
        }
    }, [open]);

    // Load template data when editing
    useEffect(() => {
        if (template && open) {
            setName(template.name || '');
            setDescription(template.description || '');
            setThumbnailUrl(template.thumbnailUrl || '');
            setPreviewUrl(template.thumbnailUrl || '');
            setIcon(template.icon || '');
            setSelectedToolId(template.creationToolId || initialToolId || '');
        } else if (!open) {
            // Reset when dialog closes
            resetForm();
        } else if (open && initialToolId) {
            // New template with pre-selected tool
            setSelectedToolId(initialToolId);
        }
    }, [template, open, initialToolId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload an image (JPG, PNG, GIF, WebP) or video (MP4, WebM)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setPreviewFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };



    // ... existing code ...



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalThumbnailUrl = thumbnailUrl;



            await onSave({
                id: template?.id,
                name,
                description,
                thumbnailUrl: finalThumbnailUrl,
                icon,
                creationToolId: selectedToolId,
                prefilledData: template?.prefilledData || {},
                isActive: true,
            });

            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setThumbnailUrl('');
        setPreviewFile(null);
        setPreviewUrl('');
        setIcon('');
        setSelectedToolId('');
    };

    const handleClose = () => {
        onOpenChange(false);
        resetForm();
    };



    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden bg-card border-border/50 shadow-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="flex-none p-6 pb-2">
                    <DialogTitle className="text-xl">{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
                    <DialogDescription>
                        {template ? 'Update template information and preview' : 'Add a new template for this creation tool'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0 scrollbar-thin">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Creation Tool Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                Configuration
                            </Label>

                            <div className="space-y-2">
                                <Label htmlFor="tool-select">Creation Tool <span className="text-destructive">*</span></Label>
                                <Select
                                    value={selectedToolId}
                                    onValueChange={setSelectedToolId}
                                    disabled={loadingTools}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder={loadingTools ? 'Loading...' : 'Select a tool'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tools.map((tool) => (
                                            <SelectItem key={tool.id} value={tool.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{tool.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Icon Selection */}
                        <div className="space-y-4">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">Identity</Label>

                            <div className="space-y-2">
                                <Label>Template Icon</Label>
                                <IconPicker value={icon} onChange={setIcon} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">Media</Label>

                            <div className="space-y-2">
                                <Label>Preview Thumbnail</Label>

                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                    {/* Upload Area - Spans 3 cols */}
                                    <div className="sm:col-span-3">
                                        <CoverUpload
                                            value={previewUrl}
                                            onUpload={(url, file) => {
                                                setPreviewUrl(url);
                                                setThumbnailUrl(url);
                                                setPreviewFile(file);
                                            }}
                                            onDelete={() => {
                                                setPreviewUrl('');
                                                setThumbnailUrl('');
                                                setPreviewFile(null);
                                            }}
                                            aspectRatio={16 / 9}
                                            description="JPG, PNG, GIF, MP4 (Max 10MB)"
                                            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                                        />

                                    </div>

                                    {/* Info - Spans 2 cols */}
                                    <div className="sm:col-span-2 space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50 h-fit">
                                        <h4 className="font-medium text-xs uppercase tracking-wider text-foreground">Guidelines</h4>
                                        <ul className="space-y-2 text-xs text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <ImageIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                                <span>Images: High quality JPG, PNG, or GIF.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Film className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                                <span>Videos: Short clips under 30s work best.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[9px] w-3.5 text-center mt-0.5">16:9</span>
                                                <span>Ratio: Landscape 16:9 is recommended.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Details</Label>

                            <div className="space-y-3">
                                <Label htmlFor="template-name">Template Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="template-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Ultra-Realistic Product Hero"
                                    required
                                    className="h-10 font-medium"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="template-description">Description</Label>
                                <Textarea
                                    id="template-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the style, mood, and intended use case..."
                                    rows={3}
                                    className="resize-none min-h-[80px]"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="flex-none p-4 border-t border-border/50 bg-secondary/20">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={saving} className="hover:bg-background">
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={saving || uploading} className="min-w-[100px]">
                        {saving || uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {uploading ? 'Uploading...' : 'Saving...'}
                            </>
                        ) : (
                            'Save Template'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
