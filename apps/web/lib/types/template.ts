/**
 * Template Type Definitions
 * Strongly typed interfaces for template management
 */

/** Form field schema definition */
export interface FormFieldSchema {
    name: string
    type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file' | 'date' | 'color'
    label: string
    placeholder?: string
    required?: boolean
    options?: Array<{ label: string; value: string }>
    defaultValue?: string | number | boolean
    validation?: {
        min?: number
        max?: number
        pattern?: string
        message?: string
    }
}

/** Execution configuration for templates */
export interface ExecutionConfig {
    timeout?: number
    retryCount?: number
    parallelExecution?: boolean
    priority?: 'low' | 'normal' | 'high'
    webhookUrl?: string
}

/** Style configuration for templates */
export interface StyleConfig {
    theme?: 'light' | 'dark' | 'auto'
    accentColor?: string
    fontFamily?: string
    borderRadius?: number
    [key: string]: unknown
}

/** Sort configuration */
export interface SortConfig {
    field: string
    order: 'asc' | 'desc'
}

/** Filter configuration */
export interface FilterConfig {
    field: string
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
    value: string | number | boolean | string[]
}

export interface Template {
    id: string;
    creationToolId?: string;
    name: string;
    description?: string;
    category?: string;
    prefilledData?: Record<string, unknown>;
    thumbnailUrl?: string;
    icon?: string;
    executionOverrides?: Record<string, unknown>;
    // Deprecated fields - kept for backward compatibility
    mediaFiles?: string[];
    inputSchema?: FormFieldSchema[];
    formSchema?: Record<string, FormFieldSchema>;
    executionConfig?: ExecutionConfig;
    promptTemplate?: string;
    styleConfig?: StyleConfig;
    // Meta
    createdAt: string;
    updatedAt: string;
    workspaceId: string;
    isActive: boolean;
    sortOrder?: number;
}

export interface CreateTemplateDto extends Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>> {
    name: string;
    creationToolId?: string;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
    id: string;
}

/** Simple filter object for common use cases */
export interface SimpleFilters {
    creationToolId?: string;
    name?: string;
    category?: string;
    isActive?: boolean;
    [key: string]: string | boolean | undefined;
}

export interface QueryTemplateDto {
    workspaceId: string;
    creationToolId?: string;
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    filters?: SimpleFilters | FilterConfig[];
    sort?: SortConfig;
}
