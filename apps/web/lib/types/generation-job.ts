import { Template } from './template';

export enum GenerationJobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export interface GenerationJob {
    id: string;
    templateId: string;
    template?: Template;
    workspaceId: string;
    userId: string;
    status: GenerationJobStatus;
    inputData: Record<string, any>;
    result?: any;
    error?: string;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
}

export interface CreateGenerationJobDto {
    templateId: string;
    inputData: Record<string, any>;
}
