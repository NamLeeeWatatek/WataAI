"use client";

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/useDebounce';
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
import { Loader2, Save, Cpu, Key, Globe, Shield, RefreshCw, X, Stars } from 'lucide-react';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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
    modelList: z.array(z.string()),
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
            modelList: [],
            isActive: true,
        },
    });

    const [isFetchingModels, setIsFetchingModels] = React.useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(true);

    const configWatch = form.watch('config');
    const debouncedConfig = useDebounce(configWatch, 1000);

    useEffect(() => {
        if (config && open) {
            form.reset({
                providerId: config.providerId || '',
                displayName: config.displayName || '',
                config: config.config || {},
                modelList: config.modelList || [],
                isActive: !!config.isActive,
            } as ConfigFormValues);
        } else if (!config && open) {
            form.reset({
                providerId: '',
                displayName: '',
                config: {},
                modelList: [],
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

    const onSubmit: SubmitHandler<ConfigFormValues> = (data) => {
        saveMutation.mutate(data);
    };

    const handleFetchModels = async (silent = false) => {
        const providerId = form.getValues('providerId');
        const configData = form.getValues('config');

        if (!providerId) return;

        // Validation for auto-fetch only
        if (silent) {
            const hasKey = !!configData?.apiKey;
            const isOllama = providerId === 'ollama';
            const isCustom = providerId === 'custom';

            if (!hasKey && !isOllama && !isCustom) return;
        }

        if (!silent) setIsFetchingModels(true);
        try {
            const models = await aiProvidersApi.verifyModels(providerId, configData);
            if (models && Array.isArray(models)) {
                const currentModels = form.getValues('modelList') || [];
                // Only update if different to avoid infinite loop or flickering
                if (JSON.stringify(currentModels) !== JSON.stringify(models)) {
                    form.setValue('modelList', models);
                    if (!silent) toast.success(`Fetched ${models.length} models successfully`);
                }
            }
        } catch (error: any) {
            if (!silent) toast.error(error.response?.data?.message || 'Failed to fetch models');
        } finally {
            if (!silent) setIsFetchingModels(false);
        }
    };

    // Auto-fetch effect
    useEffect(() => {
        if (open && autoRefreshEnabled) {
            const isUnchanged = isEdit && config?.config && JSON.stringify(debouncedConfig) === JSON.stringify(config.config);

            if (!isUnchanged) {
                handleFetchModels(true);
            }
        }
    }, [debouncedConfig, open, autoRefreshEnabled, isEdit, config]);

    const removeModel = (modelToRemove: string) => {
        const currentModels = form.getValues('modelList') || [];
        form.setValue('modelList', currentModels.filter(m => m !== modelToRemove));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-3xl rounded-[32px]">
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
                                        {isEdit ? 'Edit Provider' : 'Connect New Provider'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm font-medium">
                                        Connect an AI provider to enable smart features
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
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Provider Service</FormLabel>
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
                                                    <SelectTrigger >
                                                        <SelectValue placeholder="Select Provider" />
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
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Display Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. My OpenAI"
                                                    {...field}

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
                                        <span className="text-[10px] font-black uppercase tracking-widest">Credentials</span>
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

                                                            className="font-mono text-sm"
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
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}

                                    <div className="pt-2 pb-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleFetchModels()}
                                            disabled={isFetchingModels}
                                            className={cn(
                                                "w-full h-12 font-black uppercase tracking-widest text-xs border-2 transition-all active:scale-[0.98]",
                                                isFetchingModels
                                                    ? "border-primary/20 text-primary/50 cursor-wait"
                                                    : "border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                                            )}
                                        >
                                            {isFetchingModels ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Verifying Connection...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Test Connection & Load Models
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Stars className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Detected Capabilities</span>
                                            <span className="ml-auto text-[9px] font-bold text-muted-foreground/50 bg-muted/10 px-2 py-0.5 rounded-full">
                                                {(form.getValues('modelList') || []).length} Models
                                            </span>
                                        </div>

                                        <FormField
                                            control={form.control as any}
                                            name="modelList"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex flex-wrap gap-2 min-h-[80px] p-4 rounded-xl bg-muted/10 border border-border/10 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                                                        {field.value && field.value.length > 0 ? (
                                                            field.value.map((model: string) => (
                                                                <Badge
                                                                    key={model}
                                                                    variant="secondary"
                                                                    className="group font-mono text-[10px] px-2 py-1 bg-background border border-border/40 text-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive transition-all rounded-lg cursor-pointer select-none"
                                                                    onClick={() => removeModel(model)}
                                                                    title="Click to remove"
                                                                >
                                                                    {model}
                                                                    <X className="w-2.5 h-2.5 ml-1.5 opacity-30 group-hover:opacity-100" />
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                                                                <RefreshCw className="w-5 h-5 opacity-20" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-center">
                                                                    No models loaded<br />
                                                                    Test connection to fetch
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-8 pt-0 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="h-14 font-bold text-muted-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="h-14 px-8 font-black flex-1 sm:flex-none shadow-xl shadow-primary/20"
                            >
                                {saveMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                {isEdit ? 'Save Changes' : 'Connect Provider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
