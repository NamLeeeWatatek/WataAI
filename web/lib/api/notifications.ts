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
    getAll: async (params?: GetNotificationsParams): Promise<PaginatedResponse<Notification>> => {
        return axiosClient.get('/notifications', {
            params,
        }) as any;
    },

    getUnreadCount: async (workspaceId?: string): Promise<{ count: number }> => {
        return axiosClient.get('/notifications/unread-count', {
            params: { workspaceId },
        }) as any;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        return axiosClient.post(`/notifications/${id}/read`) as any;
    },

    markAllAsRead: async (workspaceId?: string): Promise<{ updated: number }> => {
        return axiosClient.post('/notifications/read-all', {
            workspaceId,
        }) as any;
    },
    // ... delete methods don't return data usually or void

    delete: async (id: string) => {
        await axiosClient.delete(`/notifications/${id}`);
    },

    deleteAll: async (workspaceId?: string) => {
        await axiosClient.delete('/notifications', {
            params: { workspaceId },
        });
    },
};
