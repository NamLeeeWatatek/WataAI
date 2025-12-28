import { axiosClient } from '../axios-client';
import { PaginatedResponse } from '../types/pagination';

export interface AuditLog {
    id: string;
    userId: string;
    workspaceId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export const auditApi = {
    getLogs: (workspaceId: string, params?: any) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/logs/${workspaceId}`, { params }),

    getMyActivity: (workspaceId: string, params?: any) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/my-activity/${workspaceId}`, { params }),

    getDataAccessLogs: (workspaceId: string, params?: any) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/data-access/${workspaceId}`, { params }),

    cleanup: (daysOld: number) =>
        axiosClient.post('/audit/cleanup', null, { params: { daysOld } }),
};
