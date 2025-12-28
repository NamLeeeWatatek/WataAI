export interface Template {
    id: string;
    creationToolId?: string;
    name: string;
    description?: string;
    category?: string;
    prefilledData?: Record<string, any>;
    thumbnailUrl?: string;
    executionOverrides?: Record<string, any>;
    // Deprecated fields
    mediaFiles?: string[];
    inputSchema?: any[];
    formSchema?: any;
    executionConfig?: any;
    promptTemplate?: string;
    styleConfig?: Record<string, any>;
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

export interface QueryTemplateDto {
    workspaceId: string;
    creationToolId?: string;
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    filters?: Record<string, any>;
    sort?: any;
}
