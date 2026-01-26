export enum PublicationStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    SCHEDULED = 'SCHEDULED',
}

export interface CreationJobPublication {
    id: string;
    jobId: string;
    channelId: string;
    platform: string;
    status: PublicationStatus;
    externalId?: string;
    url?: string;
    metadata?: Record<string, any>;
    error?: string;
    content?: string;
    createdAt: string;
    updatedAt: string;
}
