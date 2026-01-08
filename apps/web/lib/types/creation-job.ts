/**
 * Creation Job Type Definitions
 */

export enum CreationJobStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
}

/** Creation tool metadata within a job */
export interface CreationToolInfo {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    category?: string;
}

/** Input data for creation jobs */
export interface CreationJobInput {
    templateId?: string;
    parameters?: Record<string, unknown>;
    files?: string[];
    options?: Record<string, unknown>;
    [key: string]: unknown;
}

/** Output data from creation jobs */
export interface CreationJobOutput {
    result?: unknown;
    files?: string[];
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface CreationJob {
    id: string;
    status: CreationJobStatus;
    creationToolId: string;
    creationTool?: CreationToolInfo;
    inputData: CreationJobInput;
    outputData?: CreationJobOutput;
    progress: number;
    createdBy?: string;
    workspaceId?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCreationJobDto {
    creationToolId: string;
    inputData: CreationJobInput;
}
