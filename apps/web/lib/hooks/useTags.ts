import { useQuery } from '@tanstack/react-query'
import { metadataApi } from '@/lib/api/metadata'
import { Tag } from '@/lib/types'
import { CACHE_TIMES } from '@/lib/constants/app'

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: () => [...tagKeys.lists()] as const,
}

export function useTags() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: () => metadataApi.getTags(),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  })
}
