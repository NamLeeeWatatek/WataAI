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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { useCategories } from '@/lib/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconPicker } from '@/components/ui/IconPicker';

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
    const [category, setCategory] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [formConfig, setFormConfig] = useState<FormConfig>({ fields: [], submitLabel: 'Generate' });
    const [executionFlow, setExecutionFlow] = useState<ExecutionFlow>({ type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // Fetch categories for selection
    const { data: categories = [], isLoading: loadingCategories } = useCategories('creation-tool');

    useEffect(() => {
        if (tool && open) {
            setName(tool.name || '');
            setSlug(tool.slug || '');
            setDescription(tool.description || '');
            setIcon(tool.icon || '');
            setCategory(tool.category?.id || '');
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
        setCategory('');
        setIsActive(true);
        setFormConfig({ fields: [], submitLabel: 'Generate' });
        setExecutionFlow({ type: 'ai-generation', provider: 'openai', model: 'gpt-4o', promptTemplate: '' });
        setActiveTab('general');
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            await onSave({
                id: tool?.id,
                name,
                slug,
                description,
                icon,
                categoryId: category,
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
                                        <Label>Category</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Icon</Label>
                                        <IconPicker value={icon} onChange={setIcon} />
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
                                <ExecutionConfig config={executionFlow} onChange={setExecutionFlow} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t border-border/50 bg-muted/50 flex-none">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>Cancel</Button>
                    <Button type="button" onClick={() => handleSubmit()} disabled={saving} className="min-w-[100px]">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Tool'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
