import { axiosClient } from '../axios-client';
import { Category } from './categories';

export interface CreationTool {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    coverImage?: string;
    categories?: Category[];
    categoryIds?: string[];
    formConfig: FormConfig;
    executionFlow: ExecutionFlow;
    isActive: boolean;
    workspaceId?: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface FormConfig {
    fields: FormField[];
    layout?: 'single-column' | 'two-column' | 'wizard';
    submitLabel?: string;
}

export interface FormField {
    name: string;
    type:
    | 'text'
    | 'textarea'
    | 'string'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'boolean'
    | 'number'
    | 'file'
    | 'files'
    | 'slider'
    | 'color'
    | 'json'
    | 'key-value'
    | 'channel-select'
    | 'channel-selector'
    | 'multi-select';
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: any;
    options?: string | Array<{ label: string; value: any; icon?: string }>;
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        customMessage?: string;
    };
    showIf?: {
        field: string;
        operator: 'equals' | 'not-equals' | 'contains';
        value: any;
    };
}

// Polymorphic Execution Types
export type ExecutionType = 'ai-generation' | 'http-webhook' | 'workflow-chain';

export interface BaseExecutionConfig {
    type: ExecutionType;
}

export interface AiExecutionConfig extends BaseExecutionConfig {
    type: 'ai-generation';
    provider: 'openai' | 'anthropic' | 'gemini';
    model: string;
    parameters?: Record<string, any>;
    promptTemplate: string;
    includeTemplate?: boolean;
    useTools?: boolean;
}

export interface HttpExecutionConfig extends BaseExecutionConfig {
    type: 'http-webhook';
    urlTemplate: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    bodyTemplate?: string;
    timeoutMs?: number;
    retryCount?: number;
    successCondition?: string;
}

export type ExecutionFlow = AiExecutionConfig | HttpExecutionConfig;

export const creationToolsApi = {
    getActive: async (): Promise<CreationTool[]> => {
        // Active tokens only
        const data: any = await axiosClient.get('/creation-tools/active');
        return Array.isArray(data) ? data : [];
    },

    getAll: async (params?: { page?: number; limit?: number; filters?: any; sort?: any }): Promise<{ data: CreationTool[]; hasNextPage: boolean; total: number }> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters));
        if (params?.sort) queryParams.append('sort', JSON.stringify(params.sort));

        const response: any = await axiosClient.get(`/creation-tools?${queryParams.toString()}`);
        return response;
    },

    getAllAdmin: async (): Promise<CreationTool[]> => {
        // Fetch all tools (active & inactive) for admin management
        // Endpoint returns standard pagination: { data: [...], hasNextPage: boolean }
        const response: any = await axiosClient.get('/creation-tools?limit=100');
        // Handle both paginated response and direct array (legacy)
        return response?.data ? response.data : (Array.isArray(response) ? response : []);
    },

    getBySlug: async (slug: string): Promise<CreationTool> => {
        const data: any = await axiosClient.get(`/creation-tools/slug/${slug}`);
        return data;
    },

    getById: async (id: string): Promise<CreationTool> => {
        const data: any = await axiosClient.get(`/creation-tools/${id}`);
        return data;
    },

    create: async (data: Partial<CreationTool>): Promise<CreationTool> => {
        return await axiosClient.post('/creation-tools', data);
    },

    update: async (id: string, data: Partial<CreationTool>): Promise<CreationTool> => {
        return await axiosClient.patch(`/creation-tools/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/creation-tools/${id}`);
    },
};
