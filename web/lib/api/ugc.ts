import { axiosClient } from '../axios-client';

export interface RunUgcDto {
    templateId: string;
    inputs: Record<string, any>;
    workspaceId?: string;
}

export interface UgcGenerationResult {
    jobId: string;
    status: 'completed' | 'failed' | 'processing';
    result?: string;
    error?: string;
}

export interface Execution {
    id: string
    flow_id: string
    status: 'completed' | 'failed' | 'running' | 'pending'
    started_at: string
    completed_at?: string
    duration_ms?: number
    error_message?: string
    total_nodes: number
    completed_nodes: number
}

export interface ExecutionArtifact {
    id: string
    execution_id: string
    file_id: string
    artifact_type: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other'
    name: string
    description?: string
    metadata?: Record<string, any>
    size?: number
    mime_type?: string
    download_url: string
    created_at: string
    updated_at: string
}

export const ugcApi = {
    generate: async (data: RunUgcDto): Promise<UgcGenerationResult> => {
        const response = await axiosClient.post<UgcGenerationResult>('/ugc-factory/generate', data);
        return response as unknown as UgcGenerationResult;
    },

    getExecutions: async (flowId: string, limit = 100): Promise<Execution[]> => {
        return axiosClient.get<Execution[]>(`/executions/?flow_id=${flowId}&limit=${limit}`) as unknown as Execution[]
    },

    getExecutionArtifacts: async (executionId: string): Promise<ExecutionArtifact[]> => {
        return axiosClient.get<ExecutionArtifact[]>(`/execution-artifacts/?execution_id=${executionId}`) as unknown as ExecutionArtifact[]
    },

    deleteArtifact: async (artifactId: string): Promise<void> => {
        return axiosClient.delete(`/execution-artifacts/${artifactId}`) as unknown as void
    }
}

