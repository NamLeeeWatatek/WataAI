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


export interface GetLogsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    action?: string;
    startDate?: string; // ISO Date string
    endDate?: string;   // ISO Date string
    search?: string;
}

export const auditApi = {
    getLogs: (workspaceId: string, params?: GetLogsParams) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/logs/${workspaceId}`, { params }),

    getMyActivity: (workspaceId: string, params?: GetLogsParams) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/my-activity/${workspaceId}`, { params }),

    getDataAccessLogs: (workspaceId: string, params?: GetLogsParams) =>
        axiosClient.get<PaginatedResponse<AuditLog>>(`/audit/data-access/${workspaceId}`, { params }),

    cleanup: (daysOld: number) =>
        axiosClient.post('/audit/cleanup', null, { params: { daysOld } }),
};
