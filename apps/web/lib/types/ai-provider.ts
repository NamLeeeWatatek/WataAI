export enum AiProviderOwnerType {
    SYSTEM = 'system',
    USER = 'user',
    WORKSPACE = 'workspace',
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

export interface UserAiProviderConfig {
    id: string;
    userId: string;
    providerId: string;
    displayName: string;
    config: AiProviderConfig;
    modelList: string[];
    isActive: boolean;
    isDefault: boolean;
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
