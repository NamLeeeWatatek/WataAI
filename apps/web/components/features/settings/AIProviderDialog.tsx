'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { toast } from '@/lib/toast';
import { Loader2, Save, Cpu, Key, Globe, Shield, RefreshCw, X, Stars } from 'lucide-react';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAiProviders } from '@/lib/hooks/features/useAiProviders';
import { type AiProviderMetadata } from '@/lib/api/ai-providers';
import type { AiProviderConfig, UserAiProviderConfig } from '@/lib/types/ai-provider';

interface AIProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableProviders: AiProviderMetadata[];
    config?: UserAiProviderConfig | null;
}

const configSchema = z.object({
    providerId: z.string().min(1, 'Provider is required'),
    displayName: z.string().min(1, 'Display name is required'),
    config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.undefined()])),
    modelList: z.array(z.string()),
    isActive: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export function AIProviderDialog({ open, onOpenChange, availableProviders, config }: AIProviderDialogProps) {
    const isEdit = !!config;
    const { createConfig, updateConfig, verifyModels, isVerifyingModels, isMutating } = useAiProviders();

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

    const selectedProviderId = form.watch('providerId');
    const selectedProvider = availableProviders.find(p => p.id === selectedProviderId);

    const onSubmit: SubmitHandler<ConfigFormValues> = async (data) => {
        try {
            // Transform form data to match API DTOs
            const apiKey = data.config?.apiKey as string || '';
            const provider = selectedProvider?.key as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' || 'custom';

            if (isEdit && config) {
                await updateConfig({
                    id: config.id,
                    data: {
                        displayName: data.displayName,
                        config: data.config,
                        modelList: data.modelList,
                        isActive: data.isActive,
                    }
                });
            } else {
                await createConfig({
                    providerId: data.providerId,
                    displayName: data.displayName,
                    config: data.config,
                    modelList: data.modelList,
                });
            }
            onOpenChange(false);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleFetchModels = async (silent = false) => {
        const providerId = form.getValues('providerId');
        const configData = form.getValues('config');

        if (!providerId) return;

        if (silent) {
            const hasKey = !!configData?.apiKey;
            if (!hasKey && providerId !== 'ollama' && providerId !== 'custom') return;
        }

        try {
            const models = await verifyModels({ providerId, config: configData });
            if (models && Array.isArray(models)) {
                const currentModels = form.getValues('modelList') || [];
                if (JSON.stringify(currentModels) !== JSON.stringify(models)) {
                    form.setValue('modelList', models);
                    if (!silent) toast.success(`Found ${models.length} models`);
                }
            }
        } catch (error: any) {
            if (!silent) toast.error(error.response?.data?.message || 'Verification failed');
        }
    };

    useEffect(() => {
        if (open && autoRefreshEnabled) {
            const isUnchanged = isEdit && config?.config && JSON.stringify(debouncedConfig) === JSON.stringify(config.config);
            if (!isUnchanged) {
                handleFetchModels(true);
            }
        }
    }, [debouncedConfig, open, autoRefreshEnabled]);

    const removeModel = (modelToRemove: string) => {
        const currentModels = form.getValues('modelList') || [];
        form.setValue('modelList', currentModels.filter(m => m !== modelToRemove));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <DialogHeader className="p-6 pb-4 border-b">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Cpu className="size-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle>
                                        {isEdit ? 'Edit Provider' : 'Add Provider'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Configure AI provider settings and credentials
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="providerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Provider</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    const p = availableProviders.find(x => x.id === val);
                                                    if (p && !form.getValues('displayName')) {
                                                        form.setValue('displayName', p.label);
                                                    }
                                                    if (p) {
                                                        form.setValue('config', { ...p.defaultValues } as any);
                                                    }
                                                }}
                                                defaultValue={field.value}
                                                value={field.value}
                                                disabled={isEdit}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select provider" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableProviders.map((p) => (
                                                        <SelectItem key={`${p.id}-${p.key}`} value={p.id}>
                                                            {p.label}
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
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Production GPT-4"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {selectedProvider && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Shield className="size-4" />
                                            Authentication
                                        </div>

                                        {selectedProvider.requiredFields.map((fieldName) => (
                                            <FormField
                                                key={fieldName}
                                                control={form.control as any}
                                                name={`config.${fieldName}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center justify-between">
                                                            <span className="flex items-center gap-2">
                                                                {fieldName.includes('Key') ? <Key className="size-3" /> : <Globe className="size-3" />}
                                                                {fieldName.replace(/([A-Z])/g, ' $1')}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Required</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type={fieldName.includes('Key') || fieldName.includes('Secret') ? 'password' : 'text'}
                                                                placeholder={`Enter ${fieldName}...`}
                                                                {...field}
                                                                value={(field.value as string) || ''}
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
                                                        <FormLabel>
                                                            {fieldName.replace(/([A-Z])/g, ' $1')} (Optional)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                value={(field.value as string) || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => handleFetchModels()}
                                            disabled={isVerifyingModels}
                                            className="w-full"
                                        >
                                            {isVerifyingModels ? (
                                                <>
                                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="size-4 mr-2" />
                                                    Refresh Models
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Stars className="size-4" />
                                                Available Models
                                            </div>
                                            <Badge variant="outline">
                                                {(form.getValues('modelList') || []).length} Models
                                            </Badge>
                                        </div>

                                        <FormField
                                            control={form.control as any}
                                            name="modelList"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex flex-wrap gap-2 min-h-[60px] p-4 rounded-lg bg-muted/50 border transition-all">
                                                        {field.value && field.value.length > 0 ? (
                                                            field.value.map((model: string) => (
                                                                <Badge
                                                                    key={model}
                                                                    variant="secondary"
                                                                    className="group pr-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => removeModel(model)}
                                                                >
                                                                    {model}
                                                                    <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <div className="w-full flex flex-col items-center justify-center text-muted-foreground gap-2 py-4 text-xs">
                                                                <RefreshCw className="size-4 opacity-50" />
                                                                No models loaded. Click Refresh Models.
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

                        <DialogFooter className="p-6 pt-0 gap-2 border-t mt-auto pt-6 bg-muted/10">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isMutating}
                            >
                                {isMutating ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="size-4 mr-2" />
                                )}
                                {isEdit ? 'Save Changes' : 'Add Provider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
