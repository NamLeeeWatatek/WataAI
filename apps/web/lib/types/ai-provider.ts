export enum AiProviderOwnerType {
    SYSTEM = 'system',
    USER = 'user',
    WORKSPACE = 'workspace',
}

export enum AiModelType {
    CHAT = 'chat',
    EMBEDDING = 'embedding',
    VISION = 'vision',
    IMAGE = 'image',
    OTHER = 'other',
}

// Matches backend ProviderConfig
export interface AiProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    baseURL?: string;
    apiVersion?: string;
    isVerified?: boolean;
    timeout?: number;
    useStream?: boolean;
    retryAttempts?: number;
    rateLimitPerMinute?: number;
    defaultModel?: string;
    contextWindow?: number;
    supportsFunctionCalling?: boolean;
    teamMembers?: string[];
    monthlyBudget?: number;
    budgetWarnings?: number;
    [key: string]: unknown;
}

export interface AiModel {
    id: string;
    name: string;
    displayName?: string;
    type: AiModelType;
    providerId: string;
    ownerType: AiProviderOwnerType;
    ownerId: string;
    configId?: string;
    metadata: Record<string, any>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAiProviderConfig {
    id: string;
    userId: string;
    providerId: string;
    displayName: string;
    config: AiProviderConfig;
    modelList: string[];
    models?: AiModel[];
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceAiProviderConfig {
    id: string;
    workspaceId: string;
    providerId: string;
    displayName: string;
    config: AiProviderConfig;
    modelList: string[];
    models?: AiModel[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AiProvider {
    id: string;
    key: string;
    label: string;
    icon?: string;
    description?: string;
    requiredFields: string[];
    optionalFields: string[];
    defaultValues: AiProviderConfig;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
