import { axiosClient } from '../axios-client';
import { Notification } from '../types/notification';
import { PaginatedResponse } from '../types/pagination';

export interface GetNotificationsParams {
    workspaceId?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
}

export const notificationsApi = {
    getAll: async (params?: GetNotificationsParams) => {
        const response = await axiosClient.get<PaginatedResponse<Notification>>('/notifications', {
            params,
        });
        return response as unknown as PaginatedResponse<Notification>;
    },

    getUnreadCount: async (workspaceId?: string) => {
        const response = await axiosClient.get<{ count: number }>('/notifications/unread-count', {
            params: { workspaceId },
        });
        return response as unknown as { count: number };
    },

    markAsRead: async (id: string) => {
        const response = await axiosClient.post<Notification>(`/notifications/${id}/read`);
        return response as unknown as Notification;
    },

    markAllAsRead: async (workspaceId?: string) => {
        const response = await axiosClient.post<{ updated: number }>('/notifications/read-all', {
            workspaceId,
        });
        return response as unknown as { updated: number };
    }, // ... delete methods don't return data usually or void

    delete: async (id: string) => {
        await axiosClient.delete(`/notifications/${id}`);
    },

    deleteAll: async (workspaceId?: string) => {
        await axiosClient.delete('/notifications', {
            params: { workspaceId },
        });
    },
};
