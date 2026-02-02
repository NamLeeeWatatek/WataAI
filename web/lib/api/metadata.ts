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
        return axiosClient.get(`/metadata/categories?entity_type=${entityType}`)
    },

    async getTags(): Promise<Tag[]> {
        return axiosClient.get('/metadata/tags')
    },

    async createTag(data: Partial<Tag>): Promise<Tag> {
        return axiosClient.post('/metadata/tags', data)
    },

    async updateTag(id: string | number, data: Partial<Tag>): Promise<Tag> {
        return axiosClient.patch(`/metadata/tags/${id}`, data)
    },

    async deleteTag(id: string | number): Promise<void> {
        await axiosClient.delete(`/metadata/tags/${id}`)
    },

    async getModels(): Promise<ProviderModelsResponse[]> {
        return axiosClient.get('/ai-providers/models')
    }
}
