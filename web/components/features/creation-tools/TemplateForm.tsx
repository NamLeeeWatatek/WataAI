'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Image as LucideImage, Film, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AiEnhancedTextarea } from '@/components/shared/AiEnhancedTextarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { templateFormSchema, type TemplateFormValues } from '@/lib/types/template-form';
import { Template } from '@/lib/types/template';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi, type CreationTool } from '@/lib/api/creation-tools';
import { useEffect } from 'react';
import { UnifiedCoverUpload } from '@/components/shared/UnifiedFileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Thông tin chung
                        </TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2">
                            <LucideImage className="w-4 h-4" />
                            Hình ảnh & Preview
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-0">
                        {/* Creation Tool Selection */}
                        <FormField
                            control={control}
                            name="creationToolId"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Settings className="w-4 h-4 text-primary" />
                                        <FormLabel className="text-base">Công cụ khởi tạo <span className="text-destructive">*</span></FormLabel>
                                    </div>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={loadingTools || !!initialToolId}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full h-11 bg-background/50">
                                                <SelectValue placeholder={loadingTools ? 'Đang tải...' : 'Chọn một công cụ'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {tools.map((tool: CreationTool) => (
                                                <SelectItem key={tool.id} value={tool.id}>
                                                    {tool.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base">Tên Template <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="VD: Ultra-Realistic Product Hero"
                                            className="h-11 font-medium bg-background/50"
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
                                    <FormLabel className="text-base">Mô tả</FormLabel>
                                    <FormControl>
                                        <AiEnhancedTextarea
                                            placeholder="Mô tả phong cách, bối cảnh và mục đích sử dụng..."
                                            rows={4}
                                            className="resize-none min-h-[120px] bg-background/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    <TabsContent value="media" className="space-y-6 mt-0">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-base">Hình đại diện (Thumbnail)</Label>
                                    <UnifiedCoverUpload
                                        value={previewUrl || ''}
                                        onChange={(url) => {
                                            setValue('thumbnailUrl', (url as string), { shouldDirty: true });
                                        }}
                                        description="Hỗ trợ Hình ảnh (JPG, PNG, GIF...) & Video (MP4...)"
                                        accept={ACCEPTED_FILE_TYPES.join(',')}
                                    />
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                                        <Info className="w-4 h-4" />
                                        Hướng dẫn tải lên
                                    </h4>
                                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-3">
                                            <LucideImage className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/70" />
                                            <span>Hình ảnh: Chất lượng cao (JPG, PNG hoặc GIF).</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Film className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/70" />
                                            <span>Video: Các đoạn clip ngắn dưới 30 giây sẽ hoạt động tốt nhất.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="text-[10px] font-bold w-4 h-4 border border-current rounded flex items-center justify-center mt-0.5 text-primary/70">16:9</div>
                                            <span>Tỷ lệ: Nên sử dụng tỷ lệ ngang 16:9 để hiển thị tối ưu.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

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
