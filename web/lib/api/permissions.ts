/**
 * Permissions API Client
 */
import axiosClient from '@/lib/axios-client'
import type {
  UserCapabilities,
  PermissionCheckRequest,
  PermissionCheckResponse,
  WidgetConfig,
  RoleInfo,
  ResourcePermissions,
  ResourceType
} from '@/lib/types/permissions'

export const permissionsApi = {
  getMyCapabilities: async (): Promise<UserCapabilities> => {
    return axiosClient.get('/permissions/me/capabilities')
  },

  checkPermissions: async (permissions: string[]): Promise<PermissionCheckResponse> => {
    return axiosClient.post('/permissions/check', { permissions })
  },

  getAllRoles: async (): Promise<RoleInfo[]> => {
    return axiosClient.get('/permissions/roles')
  },

  getAvailableWidgets: async (): Promise<WidgetConfig[]> => {
    return axiosClient.get('/permissions/widgets')
  },

  getResourcePermissions: async (resourceType: ResourceType): Promise<ResourcePermissions> => {
    return axiosClient.get(`/permissions/resources/${resourceType}`)
  }
}

