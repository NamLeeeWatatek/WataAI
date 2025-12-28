import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesApi } from '@/lib/api/templates'
import type { Template, CreateTemplateDto, UpdateTemplateDto, QueryTemplateDto } from '@/lib/types/template'

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params?: QueryTemplateDto) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  workspace: (workspaceId: string) => [...templateKeys.all, 'workspace', workspaceId] as const,
}

export function useTemplates(params?: QueryTemplateDto) {
  const queryClient = useQueryClient()

  const {
    data: templatesResult,
    isLoading: loading,
    error,
    refetch: refreshTemplates,
  } = useQuery({
    queryKey: templateKeys.list(params),
    queryFn: async () => {
      return await templatesApi.findAll(params)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })

  // Mutations can be re-implemented if needed, for now we focus on reading/execution
  // keeping the structure to avoid breaking other imports, but methods might throw or need impl

  const createTemplate = useCallback(async (data: CreateTemplateDto) => {
    // Implement if needed
    throw new Error('Not implemented yet')
  }, [])

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateDto) => {
    // Implement if needed
    throw new Error('Not implemented yet')
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    // Implement if needed
    throw new Error('Not implemented yet')
  }, [])

  const activateTemplate = useCallback(async (id: string) => {
    // Implement if needed
    throw new Error('Not implemented yet')
  }, [])

  const deactivateTemplate = useCallback(async (id: string) => {
    // Implement if needed
    throw new Error('Not implemented yet')
  }, [])

  const executeTemplate = useCallback(async (id: string, data: any) => {
    const { generationJobsApi } = await import('@/lib/api/generation-jobs');
    return generationJobsApi.create({ templateId: id, inputData: data });
  }, [])

  return {
    templates: templatesResult?.data || [],
    totalCount: 0, // templatesResult?.total || 0, // Check response type
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    deactivateTemplate,
    executeTemplate,
    refreshTemplates,
  }
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.findOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useTemplatesByWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: templateKeys.workspace(workspaceId),
    queryFn: () => templatesApi.findByWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}
