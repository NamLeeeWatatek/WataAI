import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios-client';
import { FormField } from '@/lib/api/creation-tools';

export interface DynamicOption {
    label: string;
    value: string | number;
    [key: string]: any;
}

export function useDynamicOptions(field: FormField) {
    const optionsConfig = typeof field.options === 'string' && field.options.startsWith('dynamic:')
        ? field.options.replace('dynamic:', '')
        : (field.type === 'channel-select' || field.type === 'channel-selector' ? 'channels' : null);

    const { data: options = [], isLoading, error } = useQuery({
        queryKey: ['dynamic-options', field.name, optionsConfig],
        queryFn: async () => {
            if (!optionsConfig) return [];

            if (optionsConfig.startsWith('ai-models:')) {
                const typeFilter = optionsConfig.split(':')[1];
                // Cast to unknown then any[] because axios interceptor unwraps the response
                const response = await axiosClient.get<any[]>(`/node-types/dynamic-options/ai-models?type=${typeFilter}`);
                return response as unknown as any[];
            } else if (optionsConfig === 'channels') {
                const response = await axiosClient.get<any[]>('/channels/');
                return response as unknown as any[];
            }
            return [];
        },
        enabled: !!optionsConfig,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    return { options, isLoading, error, optionsConfig };
}
