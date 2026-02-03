import { useQuery } from '@tanstack/react-query';
import { creationToolsApi, FormField } from '@/lib/api/creation-tools';
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
            const channelData = data as Channel[];
            return channelData.flatMap((channel: Channel): DynamicOption[] => {
                const baseOption: DynamicOption = {
                    ...channel,
                    label: channel.name || channel.type,
                    value: channel.id,
                    isPage: false,
                    originalName: channel.name,
                    baseChannelId: channel.id,
                    pageId: undefined
                };

                const pageOptions: DynamicOption[] = [];
                if (channel.metadata?.pages && Array.isArray(channel.metadata.pages)) {
                    const pages = channel.metadata.pages.map(page => ({
                        label: page.name,
                        value: `${channel.id}:${page.id}`,
                        id: `${channel.id}:${page.id}`,
                        type: channel.type,
                        status: channel.status,
                        isPage: true,
                        pageId: page.id,
                        originalName: page.name,
                        baseChannelId: channel.id
                    }));
                    pageOptions.push(...pages);
                }

                // If pages exist, we prioritized them, but we still return baseOption
                // so users can see the main connection (though it might fail if no default page is set).
                return [baseOption, ...pageOptions];
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

            const params: Record<string, string> = { status: 'active' };
            if (optionsConfig === 'channels' && field.filterParams) {
                if (field.filterParams.ids?.length) params.ids = field.filterParams.ids.join(',');
                if (field.filterParams.status) params.status = field.filterParams.status;
            }

            const response = await creationToolsApi.getDynamicOptions(optionsConfig, params);
            return response.data || response;
        },
        select: selectFn, // Transformation happens here, memoized by TanStack Query
        enabled: !!optionsConfig,
        staleTime: 5 * 60 * 1000,
    });

    return { options, isLoading, error, optionsConfig };
}
