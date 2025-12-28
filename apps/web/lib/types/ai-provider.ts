export enum AiProviderOwnerType {
    SYSTEM = 'system',
    USER = 'user',
    WORKSPACE = 'workspace',
}

export interface AiProviderConfig {
    id: string;
    providerId: string;
    model: string;
    apiKey: string; // Should be handled with care (e.g. masked on fetch)
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
    useStream: boolean;
    ownerType: AiProviderOwnerType;
    ownerId?: string;
    isDefault: boolean;
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
    defaultValues: Record<string, any>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
