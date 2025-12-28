export enum CreationJobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface CreationJob {
    id: string;
    status: CreationJobStatus;
    creationToolId: string;
    creationTool?: {
        name: string;
        slug: string;
        [key: string]: any;
    };
    inputData: any;
    outputData?: any;
    progress: number;
    createdBy?: string;
    workspaceId?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCreationJobDto {
    creationToolId: string;
    inputData: any;
}
