import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import {
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiProvider,
} from '../../domain/ai-provider';

export abstract class AiProviderConfigRepository {
  // AiProvider operations
  abstract findAvailableProviders(): Promise<AiProvider[]>;
  abstract findProviderById(id: string): Promise<NullableType<AiProvider>>;

  // User config operations
  abstract createUserConfig(
    userId: string,
    data: {
      providerId: string;
      displayName: string;
      config: Record<string, any>;
      modelList: string[];
    },
  ): Promise<UserAiProviderConfig>;

  abstract getUserConfigs(userId: string): Promise<UserAiProviderConfig[]>;
  abstract getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>>;

  abstract updateUserConfig(
    userId: string,
    id: string,
    payload: DeepPartial<UserAiProviderConfig>,
  ): Promise<UserAiProviderConfig>;

  abstract deleteUserConfig(userId: string, id: string): Promise<void>;
  abstract verifyUserConfig(userId: string, id: string): Promise<boolean>;

  // Workspace config operations
  abstract createWorkspaceConfig(
    workspaceId: string,
    data: {
      providerId: string;
      displayName: string;
      config: Record<string, any>;
      modelList: string[];
    },
  ): Promise<WorkspaceAiProviderConfig>;

  abstract getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]>;
  abstract getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>>;

  abstract updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    payload: DeepPartial<WorkspaceAiProviderConfig>,
  ): Promise<WorkspaceAiProviderConfig>;

  abstract deleteWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<void>;

  // Usage logs and additional methods
  abstract getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      provider?: string;
      limit?: number;
    },
  ): Promise<any[]>;

  abstract getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<any>;

  abstract getApiKeyByProviderId(
    providerId: string,
    scope?: 'user' | 'workspace' | 'system',
  ): Promise<any>;
  abstract getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]>;
  abstract getUserProviders(userId: string): Promise<AiProvider[]>;
  abstract getConfigByProviderId(
    providerId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<any>;

  // Usage logs
  abstract logUsage(data: {
    workspaceId: string;
    userId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost?: number;
  }): Promise<any>;
}
