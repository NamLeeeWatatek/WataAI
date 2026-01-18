import apiClient from '../axios-client'
import { User } from '../types/user'
import { RoleEntity, PermissionEntity } from '../types/permissions'
import { PaginationParams, PaginatedResponse } from '../types/pagination'

export interface CreateRoleDto {
    name: string;
    description?: string;
    permissionIds?: string[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissionIds?: string[];
}

export interface CreatePermissionDto {
    resource: string;
    action: string;
    description: string;
}

export const adminApi = {
    // Users
    getUsers: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
        return apiClient.get('/users', { params })
    },

    updateUser: async (id: string, data: Partial<User> | Record<string, unknown>): Promise<User> => {
        return apiClient.patch(`/users/${id}`, data)
    },

    // Roles
    getRoles: async (params?: { search?: string }): Promise<RoleEntity[]> => {
        return apiClient.get('/roles', { params })
    },

    getRole: async (id: number): Promise<RoleEntity> => {
        return apiClient.get(`/roles/${id}`)
    },

    createRole: async (data: CreateRoleDto): Promise<RoleEntity> => {
        return apiClient.post('/roles', data)
    },

    updateRole: async (id: number, data: UpdateRoleDto): Promise<RoleEntity> => {
        return apiClient.patch(`/roles/${id}`, data)
    },

    deleteRole: async (id: number): Promise<void> => {
        return apiClient.delete(`/roles/${id}`)
    },

    // Permissions
    getPermissions: async (params?: { search?: string }): Promise<PermissionEntity[]> => {
        return apiClient.get('/permissions', { params })
    },

    createPermission: async (data: CreatePermissionDto): Promise<PermissionEntity> => {
        return apiClient.post('/permissions', data)
    },

    deletePermission: async (id: string): Promise<void> => {
        return apiClient.delete(`/permissions/${id}`)
    }
}
