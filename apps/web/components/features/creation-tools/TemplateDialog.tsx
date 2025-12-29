'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Template } from '@/lib/types/template';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
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
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { Media } from '@/components/ui/Media';
import { isVideoUrl } from '@/lib/utils/media';
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

    const { uploadFile: uploadFileService, uploading: hookUploading } = useFileUpload({
        bucket: 'images',
        onSuccess: (url) => {
            console.log('Upload success, url:', url);
        }
    });

    // ... existing code ...

    const uploadFile = async (file: File): Promise<string> => {
        try {
            const result = await uploadFileService(file);
            return result?.fileUrl || '';
        } catch (error) {
            console.error('Upload failed', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalThumbnailUrl = thumbnailUrl;

            // Upload file if selected
            if (previewFile) {
                setUploading(true);
                finalThumbnailUrl = await uploadFile(previewFile);
                setUploading(false);
            }

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

    const isVideo = isVideoUrl(previewUrl);

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
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className={cn(
                                                'relative flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden',
                                                'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-accent/50',
                                                previewUrl ? 'border-solid border-border' : ''
                                            )}
                                        >
                                            {previewUrl ? (
                                                <div className="relative w-full h-full group">
                                                    <Media
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        containerClassName="w-full h-full"
                                                        className="w-full h-full object-cover"
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Upload className="w-6 h-6 text-white" />
                                                        <span className="text-white font-medium text-sm">Change</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation(); // Stop clicking label
                                                            setPreviewUrl('');
                                                            setPreviewFile(null);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 text-white hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                                        <Upload className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-foreground">Click to upload</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, GIF, MP4 (Max 10MB)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                        <input
                                            id="thumbnail-upload"
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                                            onChange={handleFileSelect}
                                            className="hidden"
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
