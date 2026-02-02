import { useQuery } from '@tanstack/react-query';
import { aiProvidersApi } from '@/lib/api/ai-providers';

export const modelKeys = {
    all: ['models'] as const,
    list: (params: any) => [...modelKeys.all, 'list', params] as const,
};

export function useModels(params: { configId?: string; search?: string; limit?: number } = {}) {
    const { configId, search, limit = 50 } = params;

    const query = useQuery({
        queryKey: modelKeys.list({ configId, search, limit }),
        queryFn: async () => {
            if (!configId) return [];
            const response: any = await aiProvidersApi.getModels({
                limit,
                filters: JSON.stringify({
                    configId,
                    search,
                }),
            });
            const result = response.data || response;
            const data = Array.isArray(result) ? result : (result.data || []);
            return data.map((m: any) => m.name);
        },
        enabled: !!configId,
    });

    return {
        models: query.data || [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        refetch: query.refetch,
    };
}
