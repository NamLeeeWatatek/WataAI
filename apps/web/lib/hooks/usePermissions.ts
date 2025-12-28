/**
 * Permissions Hook
 * Provides permission checking and capabilities for components
 */
import { useQuery } from '@tanstack/react-query'
import { permissionsApi } from '@/lib/api/permissions'
import type { UserCapabilities, ResourceType } from '@/lib/types/permissions'
import { useAppSelector } from '@/lib/store/hooks'

export function usePermissions() {
  const { currentWorkspace } = useAppSelector(state => state.workspace)

  const { data: capabilities, isLoading, error } = useQuery<UserCapabilities>({
    queryKey: ['permissions', 'capabilities', currentWorkspace?.id],
    queryFn: permissionsApi.getMyCapabilities,
    // Only fetch if we have a workspace or if we want to fallback to system?
    // Actually backend handles no-workspaceID by return system perms.
    enabled: true,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const hasPermission = (permission: string): boolean => {
    return capabilities?.permissions?.includes(permission) ?? false
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }

  const canCreate = (resource: ResourceType): boolean => {
    return capabilities?.can_create?.[resource] ?? false
  }

  const canRead = (resource: ResourceType): boolean => {
    return capabilities?.can_read?.[resource] ?? false
  }

  const canUpdate = (resource: ResourceType): boolean => {
    return capabilities?.can_update?.[resource] ?? false
  }

  const canDelete = (resource: ResourceType): boolean => {
    return capabilities?.can_delete?.[resource] ?? false
  }

  const canExecute = (resource: 'flow'): boolean => {
    return capabilities?.can_execute?.[resource] ?? false
  }

  const isAdmin = (): boolean => {
    return capabilities?.features?.is_admin ?? false
  }

  const isSuperAdmin = (): boolean => {
    return capabilities?.features?.is_super_admin ?? false
  }

  const canAccessWidget = (widgetId: keyof UserCapabilities['widgets']): boolean => {
    return capabilities?.widgets?.[widgetId] ?? false
  }

  const canAccessFeature = (featureId: keyof UserCapabilities['features']): boolean => {
    return capabilities?.features?.[featureId] ?? false
  }

  return {
    capabilities,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExecute,
    isAdmin,
    isSuperAdmin,
    canAccessWidget,
    canAccessFeature,
  }
}

