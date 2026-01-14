'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ImageIcon, Film } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { AiEnhancedTextarea } from '@/components/ui/AiEnhancedTextarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { IconPicker } from '@/components/ui/IconPicker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { CoverUpload } from '@/components/ui/CoverUpload';
import { templateFormSchema, type TemplateFormValues } from '@/lib/types/template-form';
import { Template } from '@/lib/types/template';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { useEffect } from 'react';

// Reusing constant from original file or moving to constants
const ACCEPTED_FILE_TYPES = ['image/*', 'video/*'];

interface TemplateFormProps {
    template?: Template | null;
    creationToolId?: string;
    onSave: (data: TemplateFormValues) => Promise<void>;
    onCancel: () => void;
}

export function TemplateForm({ template, creationToolId: initialToolId, onSave, onCancel }: TemplateFormProps) {
    const { data: tools = [], isLoading: loadingTools } = useQuery({
        queryKey: ['creationTools', 'active'],
        queryFn: creationToolsApi.getActive,
        staleTime: 5 * 60 * 1000,
    });

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateFormSchema),
        defaultValues: {
            name: '',
            description: '',
            creationToolId: initialToolId || '',
            thumbnailUrl: '',
            icon: '',
            previewFile: null,
        },
    });

    const { reset, setValue, control, handleSubmit, formState: { isSubmitting } } = form;
    const previewUrl = useWatch({
        control,
        name: 'thumbnailUrl'
    });

    useEffect(() => {
        if (template) {
            reset({
                name: template.name || '',
                description: template.description || '',
                creationToolId: template.creationToolId || initialToolId || '',
                thumbnailUrl: template.thumbnailUrl || '',
                icon: template.icon || '',
                previewFile: null,
            });
        } else {
            reset({
                name: '',
                description: '',
                creationToolId: initialToolId || '',
                thumbnailUrl: '',
                icon: '',
                previewFile: null,
            });
        }
    }, [template, initialToolId, reset]);

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSave)} className="space-y-6">
                {/* Creation Tool Selection */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Configuration
                    </Label>

                    <FormField
                        control={control}
                        name="creationToolId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Creation Tool <span className="text-destructive">*</span></FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    disabled={loadingTools || !!initialToolId}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder={loadingTools ? 'Loading...' : 'Select a tool'} />
                                        </SelectTrigger>
                                    </FormControl>
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Icon Selection */}
                <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">Identity</Label>

                    <FormField
                        control={control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Template Icon</FormLabel>
                                <FormControl>
                                    <IconPicker value={field.value || ''} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">Media</Label>

                    <div className="space-y-2">
                        <Label>Preview Thumbnail</Label>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                            {/* Upload Area - Spans 3 cols */}
                            <div className="sm:col-span-3">
                                <CoverUpload
                                    value={previewUrl || ''}
                                    onUpload={(url, file) => {
                                        setValue('thumbnailUrl', url, { shouldDirty: true });
                                    }}
                                    onDelete={() => {
                                        setValue('thumbnailUrl', '', { shouldDirty: true });
                                    }}
                                    aspectRatio={16 / 9}
                                    description="Images (JPG, PNG, GIF, JFIF...) & Videos (MP4...)"
                                    accept={ACCEPTED_FILE_TYPES.join(',')}
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

                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Template Name <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Ultra-Realistic Product Hero"
                                        className="h-10 font-medium"
                                        {...field}
                                    />
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
                                    <AiEnhancedTextarea
                                        placeholder="Describe the style, mood, and intended use case..."
                                        rows={3}
                                        className="resize-none min-h-[80px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex-none p-4 border-t border-border/50 bg-secondary/20 -mx-6 -mb-6 mt-6 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="hover:bg-background">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Template'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
