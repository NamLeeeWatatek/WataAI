export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'job_progress' | 'job_created';

export interface Notification {
    id: string;
    userId: string;
    workspaceId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    metadata?: Record<string, any>;
    data?: any;
}

export enum JobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
}
