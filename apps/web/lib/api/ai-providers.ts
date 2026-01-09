import { axiosClient } from '../axios-client';
import type { AiProviderConfig, UserAiProviderConfig } from '../types/ai-provider';

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
  models: string[];
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
  getAvailableProviders: () =>
    axiosClient.get<AiProviderMetadata[]>('/ai-providers') as unknown as AiProviderMetadata[],

  // User provider configs
  getUserConfigs: () =>
    axiosClient.get<UserAiProviderConfig[]>('/ai-providers/user/configs') as unknown as UserAiProviderConfig[],

  getUserConfig: (id: string) =>
    axiosClient.get<UserAiProviderConfig>(`/ai-providers/user/configs/${id}`) as unknown as UserAiProviderConfig,

  createUserConfig: (data: CreateUserAiProviderDto) =>
    axiosClient.post<UserAiProviderConfig>('/ai-providers/user/configs', data) as unknown as UserAiProviderConfig,

  updateUserConfig: (id: string, data: UpdateUserAiProviderDto) =>
    axiosClient.patch<UserAiProviderConfig>(`/ai-providers/user/configs/${id}`, data) as unknown as UserAiProviderConfig,

  deleteUserConfig: (id: string) =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`) as unknown as void,

  verifyUserConfig: (id: string) =>
    axiosClient.post<UserAiProviderConfig>(`/ai-providers/user/configs/${id}/verify`) as unknown as UserAiProviderConfig,

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

  verifyModels: (providerId: string, config: AiProviderConfig) =>
    axiosClient.post<string[]>('/ai-providers/verify-models', { providerId, config }) as unknown as Promise<string[]>,

  syncModels: (id: string) =>
    axiosClient.get<string[]>(`/ai-providers/fetch-models/${id}/user`) as unknown as Promise<string[]>,
};
