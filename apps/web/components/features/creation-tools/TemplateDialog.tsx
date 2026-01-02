'use client';

import { toast } from 'sonner';
import { Template } from '@/lib/types/template';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { TemplateForm } from './TemplateForm';
import { TemplateFormValues } from '@/lib/types/template-form';

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

    const handleSave = async (data: TemplateFormValues) => {
        try {
            await onSave({
                id: template?.id,
                name: data.name,
                description: data.description,
                thumbnailUrl: data.thumbnailUrl,
                icon: data.icon,
                creationToolId: data.creationToolId,
                prefilledData: template?.prefilledData || {},
                isActive: true,
            });

            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
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
                    <TemplateForm
                        template={template}
                        creationToolId={initialToolId}
                        onSave={handleSave}
                        onCancel={handleClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
