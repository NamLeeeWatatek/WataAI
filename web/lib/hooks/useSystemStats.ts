import { useQuery } from '@tanstack/react-query'
import axiosClient from '@/lib/axios-client'
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
            const response = await axiosClient.get('/stats/system', {
                params: { period }
            })
            return response as unknown as AdminStats
        },
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
    })
}
