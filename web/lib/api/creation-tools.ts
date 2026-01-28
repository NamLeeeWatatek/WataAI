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
    executionFlow?: ExecutionFlow; // Optional - can use step-level execution
    isActive: boolean;
    metadata?: Record<string, any>;
    workspaceId?: string;
    knowledgeBaseId?: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    actions?: TriggerAction[];
}

/**
 * Trigger Action - Manual actions available for a product/result
 */
export interface TriggerAction {
    id: string;
    name: string;
    description?: string;
    icon?: string;

    // Optional: Specific fields required only for this manual action (e.g., "Post Caption")
    formConfig?: {
        fields: FormField[];
    };

    // The actual execution logic for this action
    execution: StepExecutionConfig;
}

// --- New Nested Layout Types ---

export interface FieldRow {
    id: string;
    fields: string[];
}

export interface ZoneConfig {
    id: string;
    title: string;
    width?: string;
    fieldRows: FieldRow[];
}

export interface LayoutRow {
    id: string;
    zones: ZoneConfig[];
}

export interface StepLayout {
    rows: LayoutRow[];
}

// Step-level execution configuration
export interface StepExecutionConfig {
    type: 'ai-generation' | 'http-webhook';
    trigger: 'immediate' | 'onApproval' | 'manual';
    inputSources?: {
        fromSteps?: string[];
        fromFields?: string[];
    };
    config: AiExecutionConfig | HttpExecutionConfig;
}

export interface FormStep {
    id: string;
    title: string;
    description?: string;
    layout: StepLayout;
    execution?: StepExecutionConfig; // NEW: Optional step execution
    requiresApproval?: boolean; // NEW: Pause after this step
}

export interface FormConfig {
    fields: FormField[];
    steps: FormStep[];
    layout?: string;
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
    | 'template-selector'
    | 'multi-select'
    | 'page-selector'
    | 'result-preview'
    | 'canvas-editor';
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: any;
    options?: string | Array<{ label: string; value: any; icon?: string }>;
    multiple?: boolean;
    config?: Record<string, any>; // For canvas-editor and other complex fields
    useForPostGen?: boolean; // NEW: Flag to use this field in Post Generation Dialog
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
    filterParams?: {
        ids?: string[];
        [key: string]: any;
    };
}

// Polymorphic Execution Types
export type ExecutionType = 'ai-generation' | 'http-webhook' | 'workflow-chain';

export interface BaseExecutionConfig {
    type: ExecutionType;
}

export interface AiExecutionConfig extends BaseExecutionConfig {
    type: 'ai-generation';
    provider: string;
    aiConfigId?: string;
    model: string;
    parameters?: Record<string, any>;
    promptTemplate: string;
    includeTemplate?: boolean;
    knowledgeBaseId?: string;
    useTools?: boolean;
}

export interface HttpExecutionConfig extends BaseExecutionConfig {
    type: 'http-webhook';
    urlTemplate: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    bodyTemplate?: string | Record<string, any>;
    timeoutMs?: number;
    retryCount?: number;
    successCondition?: string;
    asyncPattern?: boolean;
}

export interface WorkflowExecutionConfig extends BaseExecutionConfig {
    type: 'workflow-chain';
    steps: Array<{
        id: string;
        title: string;
        execution: AiExecutionConfig | HttpExecutionConfig;
        inputMapping?: Record<string, string>;
    }>;
}

export type ExecutionFlow = AiExecutionConfig | HttpExecutionConfig | WorkflowExecutionConfig;

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
    exportTools: async (ids?: string[]): Promise<CreationTool[]> => {
        return await axiosClient.post('/creation-tools/export', { ids });
    },
    importTools: async (tools: any[]): Promise<{ success: number; failed: number }> => {
        return await axiosClient.post('/creation-tools/import', { tools });
    },

    executeStep: async (
        toolId: string,
        stepId: string,
        stepData: Record<string, any>,
        previousResults?: Record<string, any>,
        jobId?: string
    ): Promise<any> => {
        return await axiosClient.post(`/creation-tools/${toolId}/steps/${stepId}/execute`, {
            stepData,
            previousResults,
            jobId
        });
    },

    clone: async (id: string): Promise<CreationTool> => {
        return await axiosClient.post(`/creation-tools/${id}/clone`);
    },
};
