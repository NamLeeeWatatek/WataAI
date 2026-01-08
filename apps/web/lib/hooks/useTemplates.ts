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
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      templatesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => templatesApi.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => templatesApi.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) })
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Omit<UpdateTemplateDto, 'id'> }) => templatesApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => templatesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });

  const executeTemplate = useCallback(async (id: string, data: any) => {
    // Note: This matches the old implementation, optionally could be a mutation too
    const { generationJobsApi } = await import('@/lib/api/generation-jobs');
    return generationJobsApi.create({ templateId: id, inputData: data });
  }, [])

  return {
    templates: templatesResult?.data || [],
    totalCount: templatesResult?.total || 0,
    loading,
    error,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: (id: string, data: UpdateTemplateDto) => updateMutation.mutateAsync({ id, data }),
    deleteTemplate: deleteMutation.mutateAsync,
    activateTemplate: activateMutation.mutateAsync,
    deactivateTemplate: deactivateMutation.mutateAsync,
    bulkUpdateTemplates: bulkUpdateMutation.mutateAsync,
    bulkDeleteTemplates: bulkDeleteMutation.mutateAsync,
    executeTemplate,
    refreshTemplates,
  }
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.findOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTemplatesByWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: templateKeys.workspace(workspaceId),
    queryFn: () => templatesApi.findByWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  })
}
