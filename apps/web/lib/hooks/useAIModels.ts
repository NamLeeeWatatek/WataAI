import { useState, useEffect } from 'react'
import { axiosClient } from '@/lib/axios-client'

export interface AIModel {
    provider: string
    model_name: string
    display_name: string
    api_key_configured: boolean
    is_available: boolean
    capabilities: string[]
    max_tokens?: number
    description?: string
    is_default?: boolean
    is_recommended?: boolean
}

export interface AIProvider {
    provider: string
    models: AIModel[]
}

export interface UseAIModelsReturn {
    models: AIModel[]
    providers: AIProvider[]
    loading: boolean
    error: string | null
    getModelsByProvider: (provider: string) => AIModel[]
    getAvailableModels: () => AIModel[]
    getModelOptions: () => { value: string; label: string; description?: string }[]
    getDefaultModel: () => string
}

/**
 * Reusable hook for fetching and managing AI models
 * Single source of truth for AI model data across the app
 */
export function useAIModels(): UseAIModelsReturn {
    const [providers, setProviders] = useState<AIProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadModels()
    }, [])

    const loadModels = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axiosClient.get<AIProvider[]>('/ai-providers/models') as unknown as AIProvider[]
            setProviders(response || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load models')
        } finally {
            setLoading(false)
        }
    }

    const models = providers?.flatMap(p => p.models) || []

    const getModelsByProvider = (provider: string): AIModel[] => {
        return providers.find(p => p.provider === provider)?.models || []
    }

    const getAvailableModels = (): AIModel[] => {
        return models.filter(m => m?.is_available === true)
    }

    const getModelOptions = () => {
        return getAvailableModels().map(m => ({
            value: m.model_name,
            label: m.display_name,
            description: m.description
        }))
    }

    const getDefaultModel = () => {
        if (!providers || providers.length === 0) return ''
        const allModels = providers.flatMap(p => p.models)
        const defaultModel = allModels.find(m => m.is_default)
        const availableModel = allModels.find(m => m.is_available)
        return defaultModel?.model_name || availableModel?.model_name || allModels[0]?.model_name || ''
    }

    return {
        models,
        providers,
        loading,
        error,
        getModelsByProvider,
        getAvailableModels,
        getModelOptions,
        getDefaultModel
    }
}
