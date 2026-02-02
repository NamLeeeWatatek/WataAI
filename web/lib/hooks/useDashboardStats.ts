import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import { CACHE_TIMES } from '@/lib/constants/app'
import type { DashboardStats } from '@/lib/types'

// ✅ Query keys pattern - following TanStack Query v5 best practices
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
}

/**
 * Fetch dashboard statistics
 * Uses TanStack Query v5 for caching and state management
 */
// Update hook signature to accept dateRange
export function useDashboardStats(
    initialData?: DashboardStats,
    dateRange?: { from?: Date; to?: Date }
) {
    return useQuery({
        queryKey: [...dashboardKeys.stats(), dateRange],
        queryFn: async () => {
            const params: any = {};
            if (dateRange?.from) params.startDate = dateRange.from.toISOString();
            if (dateRange?.to) params.endDate = dateRange.to.toISOString();

            const response: any = await adminApi.getDashboardStats(params);
            const data = response.data || response;
            return data as unknown as DashboardStats
        },
        initialData,
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
    })
}
