"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';
import { Loader2, Save, Cpu, Key, Globe, Shield } from 'lucide-react';

interface AiProvider {
    id: string;
    key: string;
    label: string;
    icon?: string;
    description?: string;
    requiredFields: string[];
    optionalFields: string[];
    defaultValues: Record<string, any>;
    isActive: boolean;
}

interface AIProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableProviders: AiProvider[];
    config?: any;
}

const configSchema = z.object({
    providerId: z.string().min(1, 'Provider is required'),
    displayName: z.string().min(1, 'Display name is required'),
    config: z.record(z.string(), z.any()),
    isActive: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export function AIProviderDialog({ open, onOpenChange, availableProviders, config }: AIProviderDialogProps) {
    const queryClient = useQueryClient();
    const isEdit = !!config;

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            providerId: '',
            displayName: '',
            config: {},
            isActive: true,
        },
    });

    useEffect(() => {
        if (config && open) {
            form.reset({
                providerId: config.providerId || '',
                displayName: config.displayName || '',
                config: config.config || {},
                isActive: !!config.isActive,
            } as ConfigFormValues);
        } else if (!config && open) {
            form.reset({
                providerId: '',
                displayName: '',
                config: {},
                isActive: true,
            });
        }
    }, [config, form, open]);

    const saveMutation = useMutation({
        mutationFn: (data: ConfigFormValues) => {
            if (isEdit) {
                return axiosClient.patch(`/ai-providers/user/configs/${config.id}`, data);
            }
            return axiosClient.post('/ai-providers/user/configs', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-user-configs'] });
            toast.success(`Provider ${isEdit ? 'updated' : 'added'} successfully`);
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to save configuration');
        },
    });

    const selectedProviderId = form.watch('providerId');
    const selectedProvider = availableProviders.find(p => p.id === selectedProviderId);

    const onSubmit = (data: ConfigFormValues) => {
        saveMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none bg-card/95 backdrop-blur-2xl shadow-3xl rounded-[32px]">
                <div className="h-2 w-full bg-gradient-to-r from-primary via-primary/50 to-primary/20" />

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                        <DialogHeader className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                                    <Cpu className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight">
                                        {isEdit ? 'Reconfigure Cluster' : 'Initialize Intelligence'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm font-medium">
                                        Provision new AI capabilities to your global processing matrix
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-8 pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="providerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Core Provider</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    const p = availableProviders.find(x => x.id === val);
                                                    if (p && !form.getValues('displayName')) {
                                                        form.setValue('displayName', p.label);
                                                    }
                                                    // Set default values for config
                                                    if (p) {
                                                        form.setValue('config', { ...p.defaultValues });
                                                    }
                                                }}
                                                defaultValue={field.value}
                                                value={field.value}
                                                disabled={isEdit}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-border/40 bg-muted/20 h-12 focus:ring-primary/20 font-bold">
                                                        <SelectValue placeholder="Select Engine" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-xl">
                                                    {availableProviders.map((p) => (
                                                        <SelectItem key={p.id} value={p.id} className="rounded-xl focus:bg-primary/10">
                                                            <span className="font-bold">{p.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Alias Identity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Primary OpenAI"
                                                    {...field}
                                                    className="rounded-xl border-border/40 bg-muted/20 h-12 focus:ring-primary/20 font-bold"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {selectedProvider && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Security Credentials</span>
                                    </div>

                                    {selectedProvider.requiredFields.map((fieldName) => (
                                        <FormField
                                            key={fieldName}
                                            control={form.control as any}
                                            name={`config.${fieldName}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <FormLabel className="font-bold text-xs capitalize text-muted-foreground flex items-center gap-2">
                                                            {fieldName.includes('Key') ? <Key className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                                            {fieldName.replace(/([A-Z])/g, ' $1')}
                                                        </FormLabel>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full ring-1 ring-primary/20">Required</span>
                                                    </div>
                                                    <FormControl>
                                                        <Input
                                                            type={fieldName.includes('Key') || fieldName.includes('Secret') ? 'password' : 'text'}
                                                            placeholder={`Enter ${fieldName}...`}
                                                            {...field}
                                                            value={(field.value as string) || ''}
                                                            className="rounded-xl border-border/40 bg-muted/20 h-11 focus:ring-primary/20 font-mono text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}

                                    {selectedProvider.optionalFields.map((fieldName) => (
                                        <FormField
                                            key={fieldName}
                                            control={form.control as any}
                                            name={`config.${fieldName}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-xs capitalize text-muted-foreground">
                                                        {fieldName.replace(/([A-Z])/g, ' $1')} (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={(field.value as string) || ''}
                                                            className="rounded-xl border-border/40 bg-muted/20 h-11 focus:ring-primary/20 text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-8 pt-0 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-2xl h-14 font-bold text-muted-foreground hover:bg-muted/30"
                            >
                                Cancel Process
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                            >
                                {saveMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                {isEdit ? 'Synchronize Updates' : 'Initiate Provisioning'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
