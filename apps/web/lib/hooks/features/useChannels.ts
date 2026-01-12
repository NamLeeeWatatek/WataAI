'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getChannels,
    getIntegrations,
    disconnectChannel,
    deleteIntegration,
    createIntegration,
    updateIntegration,
    connectFacebook
} from '@/lib/api/channels';
import toast from '@/lib/toast';

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

    const channelsQuery = useQuery({
        queryKey: channelKeys.channels(workspaceId, params),
        queryFn: () => getChannels({ ...params, workspaceId }),
        enabled: !!workspaceId,
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });

    const integrationsQuery = useQuery({
        queryKey: channelKeys.integrations(workspaceId),
        queryFn: () => getIntegrations(workspaceId),
        enabled: !!workspaceId,
    });

    const disconnectMutation = useMutation({
        mutationFn: (id: string) => disconnectChannel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
            // Ideally we should invalidate all channel queries, or at least the current one
            toast.success('Channel disconnected successfully');
        },
    });

    const deleteIntegrationMutation = useMutation({
        mutationFn: (id: string) => deleteIntegration(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.integrations(workspaceId) });
            toast.success('Configuration deleted successfully');
        },
    });

    const saveIntegrationMutation = useMutation({
        mutationFn: ({ id, data }: { id?: string, data: any }) => {
            if (id) return updateIntegration(id, data);
            return createIntegration(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.integrations(workspaceId) });
            toast.success('Configuration saved successfully');
        },
    });

    const connectFacebookMutation = useMutation({
        mutationFn: (data: any) => connectFacebook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
        },
    });

    return {
        channels: channelsQuery.data?.data || [],
        meta: channelsQuery.data?.meta,
        integrations: integrationsQuery.data || [],
        isLoading: !workspaceId || channelsQuery.isLoading || integrationsQuery.isLoading,
        isRefetching: channelsQuery.isRefetching || integrationsQuery.isRefetching,
        refetch: () => {
            channelsQuery.refetch();
            integrationsQuery.refetch();
        },
        disconnect: disconnectMutation.mutateAsync,
        deleteIntegration: deleteIntegrationMutation.mutateAsync,
        saveIntegration: saveIntegrationMutation.mutateAsync,
        connectFacebook: connectFacebookMutation.mutateAsync,
        isMutating: disconnectMutation.isPending || deleteIntegrationMutation.isPending || saveIntegrationMutation.isPending || connectFacebookMutation.isPending
    };
}
