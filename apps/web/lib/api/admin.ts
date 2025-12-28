import apiClient from '../axios-client'
import { User } from '../types/user'
import { Role, PermissionEntity, RoleEntity } from '../types/permissions'

export const adminApi = {
    // Users
    getUsers: async (params: any): Promise<any> => {
        return apiClient.get('/users', { params }) as any
    },

    updateUser: async (id: string, data: Partial<User>): Promise<any> => {
        return apiClient.patch(`/users/${id}`, data) as any
    },

    // Roles
    getRoles: async (params?: { search?: string }): Promise<RoleEntity[]> => {
        return apiClient.get('/roles', { params }) as any
    },

    getRole: async (id: number): Promise<RoleEntity> => {
        return apiClient.get(`/roles/${id}`) as any
    },

    createRole: async (data: { name: string, description?: string, permissionIds?: string[] }): Promise<RoleEntity> => {
        return apiClient.post('/roles', data) as any
    },

    updateRole: async (id: number, data: { name?: string, description?: string, permissionIds?: string[] }): Promise<RoleEntity> => {
        return apiClient.patch(`/roles/${id}`, data) as any
    },

    deleteRole: async (id: number): Promise<any> => {
        return apiClient.delete(`/roles/${id}`) as any
    },

    // Permissions
    getPermissions: async (params?: { search?: string }): Promise<PermissionEntity[]> => {
        return apiClient.get('/permissions', { params }) as any
    },

    createPermission: async (data: { resource: string, action: string, description: string }): Promise<PermissionEntity> => {
        return apiClient.post('/permissions', data) as any
    },

    deletePermission: async (id: string): Promise<any> => {
        return apiClient.delete(`/permissions/${id}`) as any
    }
}
