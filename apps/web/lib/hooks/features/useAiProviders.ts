'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiProvidersApi, type AiProviderMetadata } from '@/lib/api/ai-providers';
import toast from '@/lib/toast';
import axiosClient from '@/lib/axios-client';

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
        queryFn: () => axiosClient.get('/ai-providers/system/settings') as Promise<SystemSettings>,
    });

    const createConfigMutation = useMutation({
        mutationFn: (data: any) => Promise.resolve(aiProvidersApi.createUserConfig(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('Neural gateway initialized');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to initialize gateway');
        }
    });

    const updateConfigMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => Promise.resolve(aiProvidersApi.updateUserConfig(id, data)),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfig(variables.id) });
            toast.success('Neural configuration synchronized');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to synchronize configuration');
        }
    });

    const deleteConfigMutation = useMutation({
        mutationFn: (id: string) => Promise.resolve(aiProvidersApi.deleteUserConfig(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('Neural link purged');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to purge link');
        }
    });

    const verifyConfigMutation = useMutation({
        mutationFn: (id: string) => Promise.resolve(aiProvidersApi.verifyUserConfig(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.userConfigs() });
            toast.success('API Signature verified');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Verification protocol failed');
        }
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
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Model synchronization failed');
        }
    });

    const verifyModelsMutation = useMutation({
        mutationFn: ({ providerId, config }: { providerId: string; config: any }) =>
            aiProvidersApi.verifyModels(providerId, config),
    });

    const updateSystemSettingsMutation = useMutation({
        mutationFn: (data: Partial<SystemSettings>) => axiosClient.patch('/ai-providers/system/settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiProviderKeys.systemSettings() });
            toast.success('Matrix parameters updated');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update matrix');
        }
    });

    const enhancedUserConfigs = (userConfigsQuery.data || []).map((config: any) => ({
        ...config,
        provider: (availableQuery.data || []).find((p: any) => p.id === config.providerId),
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
