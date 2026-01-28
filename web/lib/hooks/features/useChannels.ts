'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getChannels,
    getIntegrations,
    disconnectChannel,
    deleteIntegration,
    createIntegration,
    updateIntegration,
    connectFacebook as connectFacebookApi
} from '@/lib/api/channels';
import toast from '@/lib/toast';
import { useUiStore } from '@/lib/store/zustand/ui-store';

export const channelKeys = {
    all: ['channels-feature'] as const,
    channels: (workspaceId?: string, params?: any) => [...channelKeys.all, 'connected', workspaceId, params] as const,
    integrations: (workspaceId?: string) => [...channelKeys.all, 'integrations', workspaceId] as const,
};

export interface UseChannelsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function useChannels(workspaceId?: string, params?: UseChannelsParams) {
    const queryClient = useQueryClient();
    const setGlobalLoading = useUiStore((state) => state.setGlobalLoading);

    const channelsQuery = useQuery({
        queryKey: channelKeys.channels(workspaceId, params),
        queryFn: () => getChannels({ ...params, workspaceId }),
        enabled: !!workspaceId,
        placeholderData: (previousData) => previousData,
    });

    const integrationsQuery = useQuery({
        queryKey: channelKeys.integrations(workspaceId),
        queryFn: () => getIntegrations(workspaceId),
        enabled: !!workspaceId,
    });

    const disconnectMutation = useMutation({
        mutationFn: (id: string) => disconnectChannel(id),
        onMutate: () => {
            setGlobalLoading('disconnect-channel', true, 'Disconnecting channel...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
            toast.success('Channel disconnected successfully');
        },
        onSettled: () => {
            setGlobalLoading('disconnect-channel', false);
        }
    });

    const deleteIntegrationMutation = useMutation({
        mutationFn: (id: string) => deleteIntegration(id),
        onMutate: () => {
            setGlobalLoading('delete-config', true, 'Deleting configuration...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.integrations(workspaceId) });
            toast.success('Configuration deleted successfully');
        },
        onSettled: () => {
            setGlobalLoading('delete-config', false);
        }
    });

    const saveIntegrationMutation = useMutation({
        mutationFn: ({ id, data }: { id?: string, data: any }) => {
            if (id) return updateIntegration(id, data);
            return createIntegration(data);
        },
        onMutate: () => {
            setGlobalLoading('save-config', true, 'Saving configuration...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.integrations(workspaceId) });
            toast.success('Configuration saved successfully');
        },
        onSettled: () => {
            setGlobalLoading('save-config', false);
        }
    });

    const connectFacebookMutation = useMutation({
        mutationFn: (data: any) => connectFacebookApi(data),
        onMutate: () => {
            setGlobalLoading('connect-facebook', true, 'Connecting Facebook page...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
        },
        onSettled: () => {
            setGlobalLoading('connect-facebook', false);
        }
    });

    return {
        channels: channelsQuery.data?.data || [],
        meta: channelsQuery.data?.meta,
        integrations: integrationsQuery.data || [],
        isLoading: !workspaceId || channelsQuery.isLoading || integrationsQuery.isLoading,
        isRefetching: channelsQuery.isRefetching || integrationsQuery.isRefetching,
        refetch: useCallback(() => {
            channelsQuery.refetch();
            integrationsQuery.refetch();
        }, [channelsQuery, integrationsQuery]),
        disconnect: disconnectMutation.mutateAsync,
        deleteIntegration: deleteIntegrationMutation.mutateAsync,
        saveIntegration: saveIntegrationMutation.mutateAsync,
        connectFacebook: connectFacebookMutation.mutateAsync,
        isMutating: disconnectMutation.isPending || deleteIntegrationMutation.isPending || saveIntegrationMutation.isPending || connectFacebookMutation.isPending
    };
}
