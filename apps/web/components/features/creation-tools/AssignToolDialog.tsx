'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi } from '@/lib/api/creation-tools';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/Form';
import { toast } from 'sonner';

interface AssignToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssign: (toolId: string) => Promise<void>;
    count: number;
}

const assignToolSchema = z.object({
    toolId: z.string().min(1, 'Please select a tool'),
});

type AssignToolValues = z.infer<typeof assignToolSchema>;

export function AssignToolDialog({
    open,
    onOpenChange,
    onAssign,
    count,
}: AssignToolDialogProps) {
    const form = useForm<AssignToolValues>({
        resolver: zodResolver(assignToolSchema),
        defaultValues: {
            toolId: '',
        },
    });

    const { reset, handleSubmit, control, formState: { isSubmitting } } = form;

    const { data: tools = [], isLoading: loadingTools } = useQuery({
        queryKey: ['creationTools', 'active'],
        queryFn: creationToolsApi.getActive,
        enabled: open,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const onSubmit = async (data: AssignToolValues) => {
        try {
            await onAssign(data.toolId);
            onOpenChange(false);
            reset();
        } catch (error) {
            console.error('Failed to assign tool:', error);
            toast.error('Failed to assign tool');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md gap-0 p-0 overflow-hidden bg-background border-border/50 shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl">Assign Creation Tool</DialogTitle>
                    <DialogDescription>
                        Assign {count} selected template{count !== 1 ? 's' : ''} to a specific creation tool.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={control}
                                name="toolId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                                disabled={loadingTools}
                                            >
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue placeholder={loadingTools ? 'Loading tools...' : 'Select a tool to assign'} />
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
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4 border-t border-border/50 -mx-6 px-6 -mb-6 pb-6 bg-muted/20">
                                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!form.formState.isValid || isSubmitting} className="min-w-[100px]">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        'Assign Tool'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
