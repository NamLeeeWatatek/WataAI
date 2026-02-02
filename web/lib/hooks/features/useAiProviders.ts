'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    aiProvidersApi,
    type AiProviderMetadata,
    type CreateUserAiProviderDto,
    type UpdateUserAiProviderDto
} from '@/lib/api/ai-providers';
import type { AiProviderConfig, UserAiProviderConfig } from '@/lib/types/ai-provider';
import toast from '@/lib/toast';

export const aiProviderKeys = {
    all: ['ai-providers-feature'] as const,
    available: () => [...aiProviderKeys.all, 'available'] as const,
    userConfigs: () => [...aiProviderKeys.all, 'user-configs'] as const,
    userConfig: (id: string) => [...aiProviderKeys.userConfigs(), id] as const,
    systemSettings: () => [...aiProviderKeys.all, 'system-settings'] as const,
};

export interface SystemSettings {
    defaultProviderId: string;
    defaultModel: string;
    minTemperature: number;
    maxTemperature: number;
    contentModeration: boolean;
    safeFallbacks: boolean;
    contextAware: boolean;
    maxRequestsPerHour: number;
    maxRequestsPerUser: number;
    isActive: boolean;
}

export interface EnhancedUserConfig extends UserAiProviderConfig {
    providerMetadata?: AiProviderMetadata;
}

// standard AxiosError is imported if needed, but we use global handling


export function useAiProviders() {
    const queryClient = useQueryClient();

    const availableQuery = useQuery({
        queryKey: aiProviderKeys.available(),
        queryFn: () => aiProvidersApi.getAvailableProviders(),
    });

    const userConfigsQuery = useQuery({
        queryKey: aiProviderKeys.userConfigs(),
        queryFn: () => aiProvidersApi.getUserConfigs(),
    });

    const systemSettingsQuery = useQuery({
        queryKey: aiProviderKeys.systemSettings(),
        queryFn: async () => {
            const response: any = await aiProvidersApi.getSystemSettings();
            return (response.data || response) as SystemSettings;
        },
    });

    const createConfigMutation = useMutation({
        mutationFn: (data: CreateUserAiProviderDto) => aiProvidersApi.createUserConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('Neural gateway initialized');
        },
    });

    const updateConfigMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserAiProviderDto }) => aiProvidersApi.updateUserConfig(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfig(variables.id) });
            toast.success('Neural configuration synchronized');
        },
    });

    const deleteConfigMutation = useMutation({
        mutationFn: (id: string) => aiProvidersApi.deleteUserConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('Neural link purged');
        },
    });

    const verifyConfigMutation = useMutation({
        mutationFn: (id: string) => aiProvidersApi.verifyUserConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('API Signature verified');
        },
    });

    const syncModelsMutation = useMutation({
        mutationFn: async (id: string) => {
            const models = await aiProvidersApi.syncModels(id);
            return aiProvidersApi.updateUserConfig(id, { modelList: models });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('Entity models synchronized');
        },
    });

    const verifyModelsMutation = useMutation({
        mutationFn: ({ providerId, config, configId }: { providerId: string; config: AiProviderConfig; configId?: string }) =>
            aiProvidersApi.verifyModels(providerId, config, configId),
    });

    const updateSystemSettingsMutation = useMutation({
        mutationFn: (data: Partial<SystemSettings>) => aiProvidersApi.updateSystemSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.systemSettings() });
            toast.success('Matrix parameters updated');
        },
    });

    const enhancedUserConfigs: EnhancedUserConfig[] = (userConfigsQuery.data || []).map((config) => ({
        ...config,
        providerMetadata: (availableQuery.data || []).find((p) => p.id === config.providerId),
    }));

    return {
        availableProviders: (availableQuery.data || []) as AiProviderMetadata[],
        userConfigs: enhancedUserConfigs,
        systemSettings: (systemSettingsQuery.data || {
            defaultProviderId: '',
            defaultModel: '',
            minTemperature: 0,
            maxTemperature: 2,
            contentModeration: true,
            safeFallbacks: true,
            contextAware: true,
            maxRequestsPerHour: 1000,
            maxRequestsPerUser: 100,
        }) as SystemSettings,
        isLoading: availableQuery.isLoading || userConfigsQuery.isLoading || systemSettingsQuery.isLoading,
        isRefetching: availableQuery.isRefetching || userConfigsQuery.isRefetching || systemSettingsQuery.isRefetching,
        createConfig: createConfigMutation.mutateAsync,
        updateConfig: updateConfigMutation.mutateAsync,
        deleteConfig: deleteConfigMutation.mutateAsync,
        verifyConfig: verifyConfigMutation.mutateAsync,
        syncModels: syncModelsMutation.mutateAsync,
        verifyModels: verifyModelsMutation.mutateAsync,
        updateSystemSettings: updateSystemSettingsMutation.mutateAsync,
        isVerifyingModels: verifyModelsMutation.isPending,
        isMutating: createConfigMutation.isPending ||
            updateConfigMutation.isPending ||
            deleteConfigMutation.isPending ||
            verifyConfigMutation.isPending ||
            syncModelsMutation.isPending ||
            verifyModelsMutation.isPending ||
            updateSystemSettingsMutation.isPending,
        activeMutationId: createConfigMutation.isPending ? 'create' :
            updateConfigMutation.isPending ? 'update' :
                deleteConfigMutation.isPending ? 'delete' :
                    verifyConfigMutation.isPending ? 'verify' :
                        syncModelsMutation.isPending ? 'sync' :
                            verifyModelsMutation.isPending ? 'verify-models' :
                                updateSystemSettingsMutation.isPending ? 'system' : null
    };
}
