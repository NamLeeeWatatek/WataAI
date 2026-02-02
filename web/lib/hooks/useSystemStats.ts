import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import { CACHE_TIMES } from '@/lib/constants/app'

import { AdminStats } from '@/lib/types/stats'

export const systemStatsKeys = {
    all: ['system-stats'] as const,
    stats: (period?: string) => [...systemStatsKeys.all, { period }] as const,
}

export function useSystemStats(period: string = 'last_30_days') {
    return useQuery<AdminStats>({
        queryKey: systemStatsKeys.stats(period),
        queryFn: async () => {
            const response: any = await adminApi.getSystemStats({ period })
            const data = response.data || response
            return data as unknown as AdminStats
        },
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
    })
}
