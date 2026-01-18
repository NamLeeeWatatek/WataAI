/**
 * Metadata API
 * Categories, Tags, and AI Models
 */
import axiosClient from '../axios-client'
import type { Category, Tag } from '@/lib/types'

// Model-related types
export interface ModelOption {
    provider: string
    model_name: string
    display_name: string
    description?: string
    api_key_configured: boolean
    is_available: boolean
    capabilities: string[]
    max_tokens: number
    is_default?: boolean
    is_recommended?: boolean
}

export interface ProviderModelsResponse {
    models: ModelOption[]
}

export const metadataApi = {
    async getCategories(entityType: string): Promise<Category[]> {
        return axiosClient.get<Category[]>(`/metadata/categories?entity_type=${entityType}`) as unknown as Category[]
    },

    async getTags(): Promise<Tag[]> {
        return axiosClient.get<Tag[]>('/metadata/tags') as unknown as Tag[]
    },

    async getModels(): Promise<ProviderModelsResponse[]> {
        return axiosClient.get<ProviderModelsResponse[]>('/ai-providers/models') as unknown as ProviderModelsResponse[]
    }
}
