import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { categoriesApi, Category } from '@/lib/api/categories'
import { CACHE_TIMES } from '@/lib/constants/app'

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (entityType: string) => [...categoryKeys.lists(), entityType] as const,
  infinite: (entityType: string) => [...categoryKeys.lists(), 'infinite', entityType] as const,
}

export function useCategories(entityType: string) {
  return useQuery({
    queryKey: categoryKeys.list(entityType),
    queryFn: async () => {
      const response = await categoriesApi.findAll({ type: entityType, limit: 100, page: 1 });
      return response.data;
    },
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled: !!entityType,
  })
}

export function useInfiniteCategories(entityType: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: categoryKeys.infinite(entityType),
    queryFn: ({ pageParam = 1 }) =>
      categoriesApi.findAll({ type: entityType, limit, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    enabled: !!entityType,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      // Fetch categories for common entity types
      const entityTypes = ['bot', 'channel', 'flow', 'template', 'creation-tool']
      const results = await Promise.allSettled(
        entityTypes.map(type => categoriesApi.findAll({ type, limit: 100, page: 1 }))
      )

      const categories: Category[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          categories.push(...result.value.data)
        } else {
          console.warn(`Failed to load categories for ${entityTypes[index]}:`, result.reason)
        }
      })

      return categories
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}
