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
    channels: (workspaceId?: string) => [...channelKeys.all, 'connected', workspaceId] as const,
    integrations: (workspaceId?: string) => [...channelKeys.all, 'integrations', workspaceId] as const,
};

export function useChannels(workspaceId?: string) {
    const queryClient = useQueryClient();

    const channelsQuery = useQuery({
        queryKey: channelKeys.channels(workspaceId),
        queryFn: () => getChannels(workspaceId),
        enabled: !!workspaceId,
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
            toast.success('Channel disconnected successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to disconnect channel');
        }
    });

    const deleteIntegrationMutation = useMutation({
        mutationFn: (id: string) => deleteIntegration(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.integrations(workspaceId) });
            toast.success('Configuration deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete configuration');
        }
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
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save configuration');
        }
    });

    const connectFacebookMutation = useMutation({
        mutationFn: (data: any) => connectFacebook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to connect Facebook page');
        }
    });

    return {
        channels: channelsQuery.data || [],
        integrations: integrationsQuery.data || [],
        isLoading: channelsQuery.isLoading || integrationsQuery.isLoading,
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
