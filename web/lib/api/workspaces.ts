/**
 * Workspaces API
 */
import axiosClient from '../axios-client'

export interface Workspace {
    id: string
    name: string
    slug: string
    ownerId: string
    createdAt: string
    updatedAt: string
}

export enum WorkspaceRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    VIEWER = 'viewer',
}

export interface WorkspaceMember {
    workspaceId: string
    userId: string
    roleId: number
    role: {
        id: number
        name: string
    }
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        avatarUrl: string
    }
    joinedAt: string
}

export interface CreateInvitationDto {
    email: string
    role?: WorkspaceRole
}

export interface WorkspaceInvitation {
    id: string
    email: string
    roleId: number
    expiresAt: string
    createdAt: string
    role?: {
        name: string
    }
}

export const workspacesApi = {
    async getCurrent(): Promise<Workspace> {
        return axiosClient.get<Workspace>('/workspaces/current') as unknown as Workspace
    },

    async getAll(): Promise<Workspace[]> {
        return axiosClient.get<Workspace[]>('/workspaces') as unknown as Workspace[]
    },

    async getMembers(id: string): Promise<WorkspaceMember[]> {
        return axiosClient.get<WorkspaceMember[]>(`/workspaces/${id}/members`) as unknown as WorkspaceMember[]
    },

    async inviteMember(workspaceId: string, data: CreateInvitationDto) {
        return axiosClient.post(`/workspaces/invitations/${workspaceId}`, data)
    },

    async removeMember(workspaceId: string, userId: string) {
        return axiosClient.delete(`/workspaces/${workspaceId}/members/${userId}`)
    },

    async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
        return axiosClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role })
    },

    async getPendingInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
        return axiosClient.get<WorkspaceInvitation[]>(`/workspaces/invitations/${workspaceId}`) as unknown as WorkspaceInvitation[]
    }
}
