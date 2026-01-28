import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios-client';
import { FormField } from '@/lib/api/creation-tools';
import { useCallback } from 'react';

export interface DynamicOption {
    label: string;
    value: string | number;
    id?: string;
    type?: string;
    status?: string;
    isPage?: boolean;
    pageId?: string;
    originalName?: string;
    baseChannelId?: string;
    [key: string]: unknown;
}

interface ChannelMetadata {
    pages?: Array<{
        id: string;
        name: string;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}

interface Channel {
    id: string;
    name: string;
    type: string;
    status: string;
    metadata?: ChannelMetadata;
}

export function useDynamicOptions(field: FormField) {
    const optionsConfig = typeof field.options === 'string' && field.options.startsWith('dynamic:')
        ? field.options.replace('dynamic:', '')
        : (field.type === 'channel-select' || field.type === 'channel-selector' ? 'channels'
            : field.type === 'template-selector' ? 'templates'
                : null);

    const selectFn = useCallback((rawData: Channel[] | { data: Channel[] } | DynamicOption[] | { data: DynamicOption[] } | { id: string; name: string }[]) => {
        if (!optionsConfig) return [];

        // Safety: Extract array even if API returns { data: [...], ... }
        const data = Array.isArray(rawData) ? rawData : (rawData?.data && Array.isArray(rawData.data) ? rawData.data : []);

        if (optionsConfig === 'channels') {
            // Professional transformation with TanStack Query 'select'
            // Flattens channels and their sub-pages into a single selectable list
            const channelData = data as Channel[];
            return channelData.flatMap((channel: Channel): DynamicOption[] => {
                // If channel has pages in metadata (e.g. Facebook), expand them
                if (channel.metadata?.pages && Array.isArray(channel.metadata.pages) && channel.metadata.pages.length > 0) {
                    return channel.metadata.pages.map((page) => ({
                        // Base properties first
                        ...page,
                        // Overrides
                        label: `${page.name} (${channel.name})`,
                        value: `${channel.id}:${page.id}`, // Composite ID
                        id: `${channel.id}:${page.id}`,
                        type: channel.type,
                        // Extra metadata
                        originalName: channel.name,
                        isPage: true,
                        pageId: page.id,
                        baseChannelId: channel.id
                    }));
                }

                // Default: Return the channel itself as a target
                return [{
                    ...channel,
                    label: channel.name || channel.type,
                    value: channel.id,
                    // Ensure consistent shape if needed, or allow loose shape since consumer checks types
                    isPage: false,
                    originalName: channel.name,
                    baseChannelId: channel.id,
                    pageId: undefined
                }];
            });
        }

        if (optionsConfig === 'templates') {
            // Return templates as DynamicOptions
            const templates = data as { id: string, name: string, description?: string, thumbnailUrl?: string }[];
            return templates.map(t => ({
                label: t.name,
                value: t.id,
                description: t.description,
                thumbnailUrl: t.thumbnailUrl
            })) as DynamicOption[];
        }

        // Default pass-through for other dynamic types (e.g. ai-models)
        return data as DynamicOption[];
    }, [optionsConfig]);

    const { data: options = [], isLoading, error } = useQuery({
        queryKey: ['dynamic-options', field.name, optionsConfig],
        queryFn: async () => {
            if (!optionsConfig) return [];

            if (optionsConfig.startsWith('ai-models:')) {
                const typeFilter = optionsConfig.split(':')[1];
                const response = await axiosClient.get<DynamicOption[]>(`/node-types/dynamic-options/ai-models?type=${typeFilter}`);
                return response.data;
            } else if (optionsConfig === 'channels') {
                const params: Record<string, string> = { status: 'active' };
                if (field.filterParams?.ids && field.filterParams.ids.length > 0) {
                    params.ids = field.filterParams.ids.join(',');
                }
                if (field.filterParams?.status) {
                    params.status = field.filterParams.status;
                }
                const response = await axiosClient.get<Channel[]>('/channels/', { params });
                return response.data;
            } else if (optionsConfig === 'templates') {
                const response = await axiosClient.get<{ id: string, name: string }[]>('/templates');
                // The API might return { data: [...] } or just [...] depending on implementation. 
                // Usually it's response.data. Assuming standard axiosClient behavior.
                return response.data;
            }
            return [];
        },
        select: selectFn, // Transformation happens here, memoized by TanStack Query
        enabled: !!optionsConfig,
        staleTime: 5 * 60 * 1000,
    });

    return { options, isLoading, error, optionsConfig };
}
