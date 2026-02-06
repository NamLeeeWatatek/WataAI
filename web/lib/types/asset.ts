export enum AssetType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    DOCUMENT = 'DOCUMENT',
    TEXT = 'TEXT',
    OTHER = 'OTHER',
}

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    url: string;
    fileId?: string;
    jobId?: string;
    workspaceId: string;
    createdBy?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
