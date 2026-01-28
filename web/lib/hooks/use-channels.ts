import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getChannels,
    getIntegrations,
    disconnectChannel,
    deleteIntegration,
    createIntegration,
    updateIntegration,
    getChannelTypes,
    getChannelCategories,
} from '@/lib/api/channels'
import { useUiStore } from '@/lib/store/zustand/ui-store'
import { toast } from 'sonner'

export const CHANNELS_QUERY_KEY = ['channels']
export const INTEGRATIONS_QUERY_KEY = ['integrations']
export const CHANNEL_TYPES_QUERY_KEY = ['channel-types']

export const useChannels = (params?: any) => {
    return useQuery({
        queryKey: [...CHANNELS_QUERY_KEY, params],
        queryFn: () => getChannels(params),
    })
}

export const useIntegrations = (workspaceId?: string) => {
    return useQuery({
        queryKey: [...INTEGRATIONS_QUERY_KEY, workspaceId],
        queryFn: () => getIntegrations(workspaceId),
    })
}

export const useChannelTypes = () => {
    return useQuery({
        queryKey: CHANNEL_TYPES_QUERY_KEY,
        queryFn: getChannelTypes,
    })
}

export const useChannelCategories = () => {
    return useQuery({
        queryKey: ['channel-categories'],
        queryFn: getChannelCategories,
    })
}

export const useChannelMutations = () => {
    const queryClient = useQueryClient()
    const { setGlobalLoading } = useUiStore()

    const disconnectMutation = useMutation({
        mutationFn: disconnectChannel,
        onMutate: () => {
            setGlobalLoading('disconnect-channel', true, 'Disconnecting channel...')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY })
            toast.success('Channel disconnected successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to disconnect channel')
        },
        onSettled: () => {
            setGlobalLoading('disconnect-channel', false)
        },
    })

    const deleteConfigMutation = useMutation({
        mutationFn: deleteIntegration,
        onMutate: () => {
            setGlobalLoading('delete-config', true, 'Deleting configuration...')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
            toast.success('Configuration deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete configuration')
        },
        onSettled: () => {
            setGlobalLoading('delete-config', false)
        },
    })

    const createConfigMutation = useMutation({
        mutationFn: (data: any) => createIntegration(data),
        onMutate: () => {
            setGlobalLoading('create-config', true, 'Creating configuration...')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
            toast.success('Configuration created successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create configuration')
        },
        onSettled: () => {
            setGlobalLoading('create-config', false)
        },
    })

    const updateConfigMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateIntegration(id, data),
        onMutate: () => {
            setGlobalLoading('update-config', true, 'Updating configuration...')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
            toast.success('Configuration updated successfully')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update configuration')
        },
        onSettled: () => {
            setGlobalLoading('update-config', false)
        },
    })

    return {
        disconnectChannel: disconnectMutation.mutateAsync,
        deleteConfig: deleteConfigMutation.mutateAsync,
        createConfig: createConfigMutation.mutateAsync,
        updateConfig: updateConfigMutation.mutateAsync,
        isDisconnecting: disconnectMutation.isPending,
        isDeletingConfig: deleteConfigMutation.isPending,
        isCreatingConfig: createConfigMutation.isPending,
        isUpdatingConfig: updateConfigMutation.isPending,
    }
}
