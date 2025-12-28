import { axiosClient } from '../axios-client';

export interface UserAiProvider {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  apiKeyMasked?: string;  // ✅ Masked API key for display (e.g., "sk-...xyz123")
  modelList?: string[];
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  quotaUsed: number;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateUserAiProviderDto {
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  apiKey: string;
  modelList?: string[];
}

export interface UpdateUserAiProviderDto {
  displayName?: string;
  apiKey?: string;
  modelList?: string[];
  isActive?: boolean;
}

export const aiProvidersApi = {
  // Available providers (global list)
  getAvailableProviders: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers') as unknown as UserAiProvider[],

  // User provider configs
  getUserConfigs: () =>
    axiosClient.get<UserAiProvider[]>('/ai-providers/user/configs') as unknown as UserAiProvider[],

  getUserConfig: (id: string) =>
    axiosClient.get<UserAiProvider>(`/ai-providers/user/configs/${id}`) as unknown as UserAiProvider,

  createUserConfig: (data: CreateUserAiProviderDto) =>
    axiosClient.post<UserAiProvider>('/ai-providers/user/configs', data) as unknown as UserAiProvider,

  updateUserConfig: (id: string, data: UpdateUserAiProviderDto) =>
    axiosClient.patch<UserAiProvider>(`/ai-providers/user/configs/${id}`, data) as unknown as UserAiProvider,

  deleteUserConfig: (id: string) =>
    axiosClient.delete(`/ai-providers/user/configs/${id}`) as unknown as void,

  verifyUserConfig: (id: string) =>
    axiosClient.post<UserAiProvider>(`/ai-providers/user/configs/${id}/verify`) as unknown as UserAiProvider,

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
    axiosClient.get('/ai-providers/models') as unknown as any,
};
