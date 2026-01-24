'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { DynamicFormField } from '@/components/ui/DynamicFormField';
import { toast } from 'sonner';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import axiosClient from '@/lib/axios-client';
import { TriggerAction } from '@/lib/api/creation-tools';

interface TriggerActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string | null;
    action: TriggerAction | null;
    productName?: string;
    onSuccess?: (result: any) => void;
}

export function TriggerActionDialog({
    open,
    onOpenChange,
    jobId,
    action,
    productName,
    onSuccess
}: TriggerActionDialogProps) {
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when action changes
    useEffect(() => {
        if (action?.formConfig?.fields) {
            const defaults: Record<string, any> = {};
            action.formConfig.fields.forEach(f => {
                if (f.defaultValue !== undefined) {
                    defaults[f.name] = f.defaultValue;
                }
            });
            setFormValues(defaults);
        } else {
            setFormValues({});
        }
        setErrors({});
    }, [action]);

    const handleFieldChange = (name: string, value: any) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        action?.formConfig?.fields?.forEach(field => {
            if (field.validation?.required && !formValues[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleExecute = async () => {
        if (!jobId || !action) return;
        if (!validate()) return;

        setIsExecuting(true);
        try {
            const response = await axiosClient.post(`/creation-jobs/${jobId}/actions/${action.id}`, formValues);

            toast.success(`${action.name} executed successfully!`);
            onSuccess?.(response.data);
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || `Failed to execute ${action.name}`;
            toast.error(message);
        } finally {
            setIsExecuting(false);
        }
    };

    if (!action) return null;

    const hasFields = action.formConfig?.fields && action.formConfig.fields.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        {action.name}
                    </DialogTitle>
                    <DialogDescription>
                        {action.description || `Execute ${action.name} for "${productName || 'this product'}".`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {hasFields ? (
                        action.formConfig!.fields.map((field) => (
                            <DynamicFormField
                                key={field.name}
                                field={field as any}
                                value={formValues[field.name]}
                                onChange={handleFieldChange}
                                error={errors[field.name]}
                                allValues={formValues}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-secondary/10 rounded-xl border border-dashed border-border">
                            <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                No additional configuration needed. <br />
                                Click execute to proceed.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExecute} disabled={isExecuting} className="min-w-[120px]">
                        {isExecuting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                {hasFields ? 'Confirm & Execute' : 'Execute Now'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
