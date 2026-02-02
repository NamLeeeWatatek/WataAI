'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { botsApi, type Bot } from '@/lib/api/bots';
import toast from '@/lib/toast';

export const botKeys = {
    all: ['bots'] as const,
    lists: () => [...botKeys.all, 'list'] as const,
    list: (workspaceId: string, filters: any) => [...botKeys.lists(), workspaceId, filters] as const,
    details: () => [...botKeys.all, 'detail'] as const,
    detail: (id: string) => [...botKeys.details(), id] as const,
    channels: (id: string) => [...botKeys.detail(id), 'channels'] as const,
};

export function useBots(workspaceId?: string, filters: any = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: botKeys.list(workspaceId || '', filters),
        queryFn: async () => {
            if (!workspaceId) return { data: [], total: 0 };
            const response = await botsApi.getAll(workspaceId, filters);
            return {
                data: response.data || [],
                total: response.total || (response.data?.length || 0),
            };
        },
        enabled: !!workspaceId,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => botsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
            toast.success('Bot created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => botsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
            queryClient.invalidateQueries({ queryKey: botKeys.detail(variables.id) });
            toast.success('Bot updated successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => botsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
            toast.success('Bot deleted successfully');
        },
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => botsApi.activate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
            queryClient.invalidateQueries({ queryKey: botKeys.detail(id) });
            toast.success('Bot activated');
        },
    });

    const pauseMutation = useMutation({
        mutationFn: (id: string) => botsApi.pause(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
            queryClient.invalidateQueries({ queryKey: botKeys.detail(id) });
            toast.success('Bot paused');
        },
    });

    return {
        ...query,
        createBot: createMutation.mutateAsync,
        updateBot: updateMutation.mutateAsync,
        deleteBot: deleteMutation.mutateAsync,
        activateBot: activateMutation.mutateAsync,
        pauseBot: pauseMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || activateMutation.isPending || pauseMutation.isPending,
    };
}

export function useBot(id: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: botKeys.detail(id),
        queryFn: () => botsApi.getOne(id),
        enabled: !!id && id !== 'undefined' && id !== 'null',
    });

    const channelsQuery = useQuery({
        queryKey: botKeys.channels(id),
        queryFn: () => botsApi.getChannels(id),
        enabled: !!id && id !== 'undefined' && id !== 'null',
    });

    const appearanceQuery = useQuery({
        queryKey: [...botKeys.detail(id), 'appearance'],
        queryFn: () => botsApi.getWidgetAppearance(id),
        enabled: !!id && id !== 'undefined' && id !== 'null',
    });

    const updateAppearanceMutation = useMutation({
        mutationFn: (data: any) => botsApi.updateWidgetAppearance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'appearance'] });
            toast.success('Visual identity synchronized');
        },
    });

    const kbQuery = useQuery({
        queryKey: [...botKeys.detail(id), 'knowledge-bases'],
        queryFn: () => botsApi.getLinkedKnowledgeBases(id),
        enabled: !!id && id !== 'undefined' && id !== 'null',
    });

    const linkKbMutation = useMutation({
        mutationFn: (kbId: string) => botsApi.linkKnowledgeBase(id, kbId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'knowledge-bases'] });
            toast.success('Linked successfully');
        },
    });

    const unlinkKbMutation = useMutation({
        mutationFn: (kbId: string) => botsApi.unlinkKnowledgeBase(id, kbId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'knowledge-bases'] });
            toast.success('Knowledge base unlinked');
        },
    });

    const toggleKbMutation = useMutation({
        mutationFn: ({ kbId, isActive }: { kbId: string, isActive: boolean }) => botsApi.toggleKnowledgeBase(id, kbId, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'knowledge-bases'] });
        },
    });

    const functionsQuery = useQuery({
        queryKey: [...botKeys.detail(id), 'functions'],
        queryFn: () => botsApi.getFunctions(id),
        enabled: !!id && id !== 'undefined' && id !== 'null',
    });

    const createFunctionMutation = useMutation({
        mutationFn: (data: any) => botsApi.createFunction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'functions'] });
            toast.success('Function created');
        },
    });

    const updateFunctionMutation = useMutation({
        mutationFn: ({ functionId, data }: { functionId: string; data: any }) => botsApi.updateFunction(functionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...botKeys.detail(id), 'functions'] });
            toast.success('Function updated');
        },
    });

    return {
        bot: query.data,
        channels: channelsQuery.data || [],
        appearance: appearanceQuery.data,
        linkedKnowledgeBases: kbQuery.data || [],
        functions: functionsQuery.data || [],
        isLoading: query.isLoading || channelsQuery.isLoading || appearanceQuery.isLoading || kbQuery.isLoading || functionsQuery.isLoading,
        isError: query.isError || channelsQuery.isError || appearanceQuery.isError || kbQuery.isError || functionsQuery.isError,
        updateAppearance: updateAppearanceMutation.mutateAsync,
        isUpdatingAppearance: updateAppearanceMutation.isPending,
        linkKB: linkKbMutation.mutateAsync,
        unlinkKB: unlinkKbMutation.mutateAsync,
        toggleKB: toggleKbMutation.mutateAsync,
        createFunction: createFunctionMutation.mutateAsync,
        updateFunction: updateFunctionMutation.mutateAsync,
        isSavingFunction: createFunctionMutation.isPending || updateFunctionMutation.isPending,
        refetch: () => {
            query.refetch();
            channelsQuery.refetch();
            appearanceQuery.refetch();
            kbQuery.refetch();
            functionsQuery.refetch();
        },
    };
}

export function useBotFunction() {
    const executeMutation = useMutation({
        mutationFn: (data: { functionId: string; input: any }) => botsApi.executeGenericFunction(data),
    });

    return {
        execute: executeMutation.mutateAsync,
        isExecuting: executeMutation.isPending,
    };
}
