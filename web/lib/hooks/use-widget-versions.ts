'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from '@/lib/toast';
import { botsApi } from '@/lib/api/bots';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface WidgetVersion {
    id: string;
    version: string;
    status: 'draft' | 'published' | 'archived';
    isActive: boolean;
    publishedAt?: string;
    changelog?: string;
    createdAt: string;
}

interface WidgetVersionDetail extends WidgetVersion {
    botId: string;
    config: any;
    publishedBy?: string;
    cdnUrl?: string;
    notes?: string;
    updatedAt: string;
}

interface WidgetDeployment {
    id: string;
    botId: string;
    widgetVersionId: string;
    version: string;
    deploymentType: 'publish' | 'rollback' | 'canary';
    previousVersionId?: string;
    previousVersion?: string;
    rollbackReason?: string;
    trafficPercentage: number;
    status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';
    deployedAt: string;
    deployedBy?: string;
}

/**
 * Fetcher logic moved to botsApi
 */

export function useWidgetVersions(botId: string) {
    const queryClient = useQueryClient();
    const { data, error, isLoading } = useQuery<WidgetVersion[]>({
        queryKey: ['widget-versions', botId],
        queryFn: () => botsApi.getWidgetVersions(botId),
        enabled: !!botId,
    });

    const mutate = () => {
        queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
    };

    return {
        versions: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetVersion(botId: string, versionId: string) {
    const queryClient = useQueryClient();
    const { data, error, isLoading } = useQuery<WidgetVersionDetail>({
        queryKey: ['widget-version', botId, versionId],
        queryFn: () => botsApi.getWidgetVersion(botId, versionId),
        enabled: !!(botId && versionId),
    });

    const mutate = () => {
        queryClient.invalidateQueries({ queryKey: ['widget-version', botId, versionId] });
    };

    return {
        version: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetDeployments(botId: string) {
    const queryClient = useQueryClient();
    const { data, error, isLoading } = useQuery<WidgetDeployment[]>({
        queryKey: ['widget-deployments', botId],
        queryFn: () => botsApi.getWidgetDeployments(botId),
        enabled: !!botId,
    });

    const mutate = () => {
        queryClient.invalidateQueries({ queryKey: ['widget-deployments', botId] });
    };

    return {
        deployments: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetVersionActions(botId: string) {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: any) => botsApi.createWidgetVersion(botId, data),
        onSuccess: () => {
            toast.success('Version created successfully');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const updateMutation = useMutation({
        mutationFn: ({ versionId, data }: { versionId: string, data: any }) =>
            botsApi.updateWidgetVersion(botId, versionId, data),
        onSuccess: (_, { versionId }) => {
            toast.success('Version updated successfully');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
            queryClient.invalidateQueries({ queryKey: ['widget-version', botId, versionId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const publishMutation = useMutation({
        mutationFn: (versionId: string) => botsApi.publishWidgetVersion(botId, versionId),
        onSuccess: (_, versionId) => {
            toast.success('Version published successfully');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
            queryClient.invalidateQueries({ queryKey: ['widget-version', botId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['widget-deployments', botId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const rollbackMutation = useMutation({
        mutationFn: ({ versionId, reason }: { versionId: string, reason: string }) =>
            botsApi.rollbackWidgetVersion(botId, versionId, reason),
        onSuccess: (_, { versionId }) => {
            toast.success('Rollback successful');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
            queryClient.invalidateQueries({ queryKey: ['widget-deployments', botId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const archiveMutation = useMutation({
        mutationFn: (versionId: string) => botsApi.archiveWidgetVersion(botId, versionId),
        onSuccess: (_, versionId) => {
            toast.success('Version archived successfully');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    const deleteMutation = useMutation({
        mutationFn: (versionId: string) => botsApi.deleteWidgetVersion(botId, versionId),
        onSuccess: () => {
            toast.success('Version deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['widget-versions', botId] });
        },
        onError: (error: any) => toast.error(error.message)
    });

    return {
        createVersion: createMutation.mutateAsync,
        updateVersion: updateMutation.mutateAsync,
        publishVersion: publishMutation.mutateAsync,
        rollbackVersion: rollbackMutation.mutateAsync,
        archiveVersion: archiveMutation.mutateAsync,
        deleteVersion: deleteMutation.mutateAsync,
        isSubmitting: createMutation.isPending || updateMutation.isPending ||
            publishMutation.isPending || rollbackMutation.isPending ||
            archiveMutation.isPending || deleteMutation.isPending,
    };
}
