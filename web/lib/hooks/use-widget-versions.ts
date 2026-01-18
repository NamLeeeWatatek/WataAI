'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from '@/lib/toast';
import axiosClient from '@/lib/axios-client';
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
 * Generic fetcher function that uses axiosClient to make API requests.
 * Removes the API_BASE prefix from the URL since axiosClient handles it.
 */
const fetcher = async <T>(url: string): Promise<T> => {
    return axiosClient.get<T>(url.replace(API_BASE, '')) as unknown as T;
};

export function useWidgetVersions(botId: string) {
    const queryClient = useQueryClient();
    const { data, error, isLoading } = useQuery<WidgetVersion[]>({
        queryKey: ['widget-versions', botId],
        queryFn: () => fetcher(`${API_BASE}/bots/${botId}/widget/versions`),
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
        queryFn: () => fetcher(`${API_BASE}/bots/${botId}/widget/versions/${versionId}`),
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
        queryFn: () => fetcher(`${API_BASE}/bots/${botId}/widget/deployments`),
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
    const { accessToken: token } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createVersion = async (data: {
        version: string;
        config: any;
        changelog?: string;
        notes?: string;
    }) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await axiosClient.post(`/bots/${botId}/widget/versions`, data);
            toast.success('Version created successfully');
            return result as any;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateVersion = async (
        versionId: string,
        data: {
            config?: any;
            changelog?: string;
            notes?: string;
        },
    ) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await axiosClient.patch(`/bots/${botId}/widget/versions/${versionId}`, data);
            toast.success('Version updated successfully');
            return result as any;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const publishVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await axiosClient.post(`/bots/${botId}/widget/versions/${versionId}/publish`);
            toast.success('Version published successfully');
            return result as any;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const rollbackVersion = async (versionId: string, reason: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await axiosClient.post(`/bots/${botId}/widget/versions/${versionId}/rollback`, { reason });
            toast.success('Rollback successful');
            return result as any;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const archiveVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosClient.post(`/bots/${botId}/widget/versions/${versionId}/archive`);
            toast.success('Version archived successfully');
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosClient.delete(`/bots/${botId}/widget/versions/${versionId}`);
            toast.success('Version deleted successfully');
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        createVersion,
        updateVersion,
        publishVersion,
        rollbackVersion,
        archiveVersion,
        deleteVersion,
        isSubmitting,
    };
}
