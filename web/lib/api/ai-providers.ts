import { axiosClient } from '../axios-client';
import type { AiProviderConfig, UserAiProviderConfig, AiModel, WorkspaceAiProviderConfig } from '../types/ai-provider';

/** AI Model information */
export interface AiModelInfo {
  id: string;
  name: string;
  providerId: string;
  maxTokens?: number;
  contextWindow?: number;
  isAvailable: boolean;
}

/** AI Model Provider with available models (for execution config) */
export interface AiModelProvider {
  providerId: string;
  providerKey: string;
  providerName: string;
  configId?: string;
  models: AiModel[];
}

// Re-export or alias for compatibility if needed, but prefer UserAiProviderConfig
export type UserAiProvider = UserAiProviderConfig;

export interface CreateUserAiProviderDto {
  providerId: string;
  displayName: string;
  config: AiProviderConfig;
  modelList?: string[];
}

export interface UpdateUserAiProviderDto {
  displayName?: string;
  config?: AiProviderConfig;
  modelList?: string[];
  isActive?: boolean;
}

export interface AiProviderMetadata {
  id: string;
  key: string;
  label: string;
  icon?: string;
  description?: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultValues: AiProviderConfig;
  isActive: boolean;
}

export const aiProvidersApi = {
  // Available providers (global list)
  getAvailableProviders: (): Promise<AiProviderMetadata[]> =>
    axiosClient.get('/ai-providers'),

  // User provider configs
  getUserConfigs: (): Promise<UserAiProviderConfig[]> =>
    axiosClient.get('/ai-providers/user/configs'),

  getUserConfig: (id: string): Promise<UserAiProviderConfig> =>
    axiosClient.get(`/ai-providers/user/configs/${id}`),

  createUserConfig: (data: CreateUserAiProviderDto): Promise<UserAiProviderConfig> =>
    axiosClient.post('/ai-providers/user/configs', data),

  updateUserConfig: (id: string, data: UpdateUserAiProviderDto): Promise<UserAiProviderConfig> =>
    axiosClient.patch(`/ai-providers/user/configs/${id}`, data),

  deleteUserConfig: (id: string): Promise<void> =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`),

  verifyUserConfig: (id: string): Promise<UserAiProviderConfig> =>
    axiosClient.post(`/ai-providers/user/configs/${id}/verify`),

  // Legacy methods (for backward compatibility)
  getUserProviders: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers/user/configs') as unknown as UserAiProvider[],

  getUserProvider: (id: string) =>
    axiosClient.get<UserAiProvider>(`/ai-providers/user/configs/${id}`) as unknown as UserAiProvider,

  createUserProvider: (data: CreateUserAiProviderDto) =>
    axiosClient.post<UserAiProvider>('/ai-providers/user/configs', data) as unknown as UserAiProvider,

  updateUserProvider: (id: string, data: UpdateUserAiProviderDto) =>
    axiosClient.patch<UserAiProvider>(`/ai-providers/user/configs/${id}`, data) as unknown as UserAiProvider,

  deleteUserProvider: (id: string) =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`) as unknown as void,

  verifyUserProvider: (id: string) =>
    axiosClient.post<UserAiProvider>(`/ai-providers/user/configs/${id}/verify`) as unknown as UserAiProvider,

  // Models
  getAvailableModels: () =>
    axiosClient.get('/ai-providers/user/models') as unknown as Promise<AiModelProvider[]>,

  getWorkspaceModels: (workspaceId: string) =>
    axiosClient.get(`/ai-providers/workspace/${workspaceId}/models`) as unknown as Promise<AiModelProvider[]>,

  getWorkspaceConfigs: (workspaceId: string) =>
    axiosClient.get<WorkspaceAiProviderConfig[]>(`/ai-providers/workspace/${workspaceId}/configs`) as unknown as Promise<WorkspaceAiProviderConfig[]>,

  getUserModelsByConfig: (configId: string, type?: string) =>
    axiosClient.get<AiModel[]>(`/ai-providers/user/config/${configId}/models`, { params: { type } }) as unknown as Promise<AiModel[]>,

  getWorkspaceModelsByConfig: (workspaceId: string, configId: string, type?: string) =>
    axiosClient.get<AiModel[]>(`/ai-providers/workspace/${workspaceId}/config/${configId}/models`, { params: { type } }) as unknown as Promise<AiModel[]>,

  verifyModels: (providerId: string, config: AiProviderConfig, configId?: string) =>
    axiosClient.post<string[]>('/ai-providers/verify-models', { providerId, config, configId }) as unknown as Promise<string[]>,

  syncModels: (id: string) =>
    axiosClient.get<string[]>(`/ai-providers/fetch-models/${id}/user`) as unknown as Promise<string[]>,

  enhancePrompt: (prompt: string, type: 'image' | 'text' | 'code' | 'general' = 'general') =>
    axiosClient.post<{ enhancedPrompt: string }>('/ai-providers/enhance-prompt', { prompt, type }) as unknown as Promise<{ enhancedPrompt: string }>,

  getConfigDetails: (id: string, workspaceId?: string) =>
    axiosClient.get<UserAiProviderConfig | WorkspaceAiProviderConfig>(`/ai-providers/unified-config/${id}/details`, { params: { workspaceId } }) as unknown as Promise<UserAiProviderConfig | WorkspaceAiProviderConfig>,

  getModels: (params: { limit?: number; filters?: string }) =>
    axiosClient.get('/ai-providers/models', { params }),

  getSystemSettings: () =>
    axiosClient.get('/ai-providers/system/settings'),

  updateSystemSettings: (data: any) =>
    axiosClient.patch('/ai-providers/system/settings', data),
};
