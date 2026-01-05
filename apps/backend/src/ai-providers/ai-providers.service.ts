import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { SystemAiSettingsRepository } from './infrastructure/system/system-ai-settings.repository';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
} from './dto/ai-provider.dto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
  ChatMessage,
} from './domain/ai-provider';

export type { ChatMessage };
import { AiConfigService } from './services/ai-config.service';
import { AiEncryptionService } from './services/ai-encryption.service';
import { AiModelService } from './services/ai-model.service';

@Injectable()
export class AiProvidersService {
  private readonly logger = new Logger(AiProvidersService.name);

  constructor(
    private readonly aiConfigService: AiConfigService,
    private readonly aiEncryptionService: AiEncryptionService,
    private readonly aiModelService: AiModelService,
    private readonly systemAiSettingsRepository: SystemAiSettingsRepository,
  ) { }

  /**
   * Encrypt an API key
   * @deprecated Use AiEncryptionService.encryptApiKey
   */
  encryptApiKey(apiKey: string): string {
    return this.aiEncryptionService.encryptApiKey(apiKey);
  }

  /**
   * Decrypt an API key
   * @deprecated Use AiEncryptionService.decryptApiKey
   */
  decryptApiKey(encryptedApiKey: string): string {
    return this.aiEncryptionService.decryptApiKey(encryptedApiKey);
  }

  /**
   * Mask sensitive fields in config
   */
  maskConfig(config: any): any {
    return this.aiEncryptionService.maskConfig(config);
  }

  // --- Provider Management (Delegate to Config) ---
  async getAvailableProviders(): Promise<AiProvider[]> {
    return this.aiConfigService.getAvailableProviders();
  }

  async getProviderById(id: string): Promise<NullableType<AiProvider>> {
    return this.aiConfigService.getProviderById(id);
  }

  // --- User Configuration (Delegate to Config) ---
  async createUserConfig(
    userId: string,
    dto: CreateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    return this.aiConfigService.createUserConfig(userId, dto);
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    return this.aiConfigService.getUserConfigs(userId);
  }

  async getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    return this.aiConfigService.getUserConfig(userId, id);
  }

  async updateUserConfig(
    userId: string,
    id: string,
    dto: UpdateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    return this.aiConfigService.updateUserConfig(userId, id, dto);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    return this.aiConfigService.deleteUserConfig(userId, id);
  }

  async verifyUserConfig(userId: string, id: string): Promise<boolean> {
    const config = await this.getUserConfig(userId, id);
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    if (!config.provider) {
      throw new BadRequestException('Provider not linked to configuration');
    }

    // Delegate verification logic to Model Service
    try {
      await this.aiModelService.verifyConnection(config.provider.key, config.config);
    } catch (error) {
      this.logger.warn(`Verification failed for user ${userId} config ${id}: ${error.message}`);
      throw new BadRequestException(`Verification failed: ${error.message}`);
    }

    // Update verified status
    // Note: We need to preserve existing config data while setting isVerified=true
    const currentConfigData = config.config || {};
    await this.updateUserConfig(userId, id, {
      config: {
        ...currentConfigData,
        isVerified: true,
      }
    });

    return true;
  }

  // --- Workspace Configuration (Delegate to Config) ---
  async createWorkspaceConfig(
    workspaceId: string,
    dto: CreateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    return this.aiConfigService.createWorkspaceConfig(workspaceId, dto);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    return this.aiConfigService.getWorkspaceConfigs(workspaceId);
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    return this.aiConfigService.getWorkspaceConfig(workspaceId, id);
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    dto: UpdateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    return this.aiConfigService.updateWorkspaceConfig(workspaceId, id, dto);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    return this.aiConfigService.deleteWorkspaceConfig(workspaceId, id);
  }

  async configExists(
    configId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<boolean> {
    // Explicitly check if config exists in the given scope
    if (scope === 'user') {
      const config = await this.aiConfigService.getUserConfig(scopeId, configId);
      return !!config;
    } else {
      const config = await this.aiConfigService.getWorkspaceConfig(scopeId, configId);
      return !!config;
    }
  }

  async getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      provider?: string;
      limit?: number;
    },
  ): Promise<AiUsageLog[]> {
    return this.aiConfigService.getUsageLogs(workspaceId, options);
  }

  async getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<Record<string, any>> {
    return this.aiConfigService.getUsageStats(workspaceId, period);
  }


  // --- Chat & Generation Logic (Delegate to Model Service) ---

  async chat(
    prompt: string,
    model: string,
    provider?: string,
    apiKey?: string,
    workspaceId?: string,
    baseUrl?: string,
    useTools?: boolean,
  ): Promise<string> {
    // Simple heuristic or use provided provider
    let providerKey = provider || 'auto';

    if (providerKey === 'auto') {
      providerKey = 'google';
      if (model.startsWith('gpt')) providerKey = 'openai';
      if (model.startsWith('claude')) providerKey = 'anthropic';
      if ((model.includes('llama') || model.includes('mistral')) && !model.includes('gpt')) providerKey = 'ollama';
    }

    const key = apiKey || await this.getApiKey(providerKey);
    const messages = [{ role: 'user', content: prompt } as ChatMessage];

    if (providerKey === 'google') {
      // Pass useTools if available
      return this.aiModelService.chatWithGoogleHistory(messages, model, key, useTools);
    }
    if (providerKey === 'openai') {
      return this.aiModelService.chatWithOpenAIHistory(messages, model, key, baseUrl);
    }
    if (providerKey === 'anthropic') {
      return this.aiModelService.chatWithAnthropicHistory(messages, model, key);
    }
    if (providerKey === 'ollama') {
      return this.aiModelService.chatWithOllamaHistory(messages, model, baseUrl, key);
    }

    return '';
  }

  async generateEmbedding(
    text: string,
    provider: string,
    model: string,
    apiKey?: string,
    options?: { baseUrl?: string }
  ): Promise<number[]> {
    return this.aiModelService.generateEmbedding(text, provider, model, apiKey, options?.baseUrl);
  }

  async generateEmbeddingUsingProvider(
    text: string,
    model: string,
    providerConfigId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<number[]> {
    let config: any;
    if (scope === 'user') {
      const c = await this.aiConfigService.getUserConfig(scopeId, providerConfigId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(scopeId, providerConfigId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }
    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const apiKey = config.config.apiKey;
    return this.aiModelService.generateEmbedding(text, config.provider.key.toLowerCase(), model, apiKey);
  }

  async chatWithHistory(messages: ChatMessage[], model: string, apiKey?: string, baseUrl?: string): Promise<string> {
    // Simple heuristic to determine provider (same as chat)
    let providerKey = 'google';
    if (model.startsWith('gpt')) providerKey = 'openai';
    if (model.startsWith('claude')) providerKey = 'anthropic';
    if ((model.includes('llama') || model.includes('mistral')) && !model.includes('gpt')) providerKey = 'ollama';

    const key = apiKey || await this.getApiKey(providerKey);

    if (providerKey === 'google') {
      return this.aiModelService.chatWithGoogleHistory(messages, model, key);
    }
    if (providerKey === 'openai') {
      return this.aiModelService.chatWithOpenAIHistory(messages, model, key);
    }
    if (providerKey === 'anthropic') {
      return this.aiModelService.chatWithAnthropicHistory(messages, model, key);
    }
    if (providerKey === 'ollama') {
      return this.aiModelService.chatWithOllamaHistory(messages, model);
    }
    return '';
  }

  async chatWithHistoryUsingProvider(
    messages: ChatMessage[],
    model: string,
    providerConfigId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<string> {
    let config: any;
    if (scope === 'user') {
      const c = await this.aiConfigService.getUserConfig(scopeId, providerConfigId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(scopeId, providerConfigId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const key = config.provider.key.toLowerCase();
    // Config object contains apiKey etc.
    const apiKey = config.config.apiKey;

    // Generic/OpenAI Compatible (OpenAI, Ollama, Custom)
    const baseURL = config.config.baseUrl || config.config.baseURL;

    if (key === 'google') {
      return this.aiModelService.chatWithGoogleHistory(messages, model, apiKey);
    }
    if (key === 'openai') {
      return this.aiModelService.chatWithOpenAIHistory(messages, model, apiKey, baseURL);
    }
    if (key === 'anthropic') {
      return this.aiModelService.chatWithAnthropicHistory(messages, model, apiKey);
    }
    if (key === 'ollama') {
      return this.aiModelService.chatWithOllamaHistory(messages, model, baseURL, apiKey);
    }

    return '';
  }

  async fetchProviderModels(
    configId: string,
    context: 'user' | 'workspace',
    contextId: string,
  ): Promise<string[]> {
    let config: UserAiProviderConfig | WorkspaceAiProviderConfig;
    if (context === 'user') {
      const c = await this.aiConfigService.getUserConfig(contextId, configId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(contextId, configId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    return this.aiModelService.fetchRemoteModels(config.provider.key, config.config);
  }

  async fetchModelsFromDirectConfig(providerId: string, config: any): Promise<string[]> {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');
    return this.aiModelService.fetchRemoteModels(provider.key, config);
  }

  async generateSystemPrompt(params: {
    userId: string;
    description: string;
    template?: string;
    providerConfigId?: string;
    tone?: string;
    style?: string;
    additionalContext?: Record<string, any>;
  }) {
    return this.aiModelService.generateSystemPrompt(params);
  }

  // --- System Settings ---

  async getSystemAiSettings() {
    // Delegate to Repository directly for now (or move to ConfigService later)
    return this.systemAiSettingsRepository.findSystemSettings();
  }

  async updateSystemAiSettings(dto: Record<string, any>) {
    return this.systemAiSettingsRepository.updateSystemSettings(dto);
  }

  async getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]> {
    // Logic to filter available providers? Or just return all available?
    // Usually all providers are available to add.
    return this.getAvailableProviders();
  }

  async getUserProviders(userId: string): Promise<AiProvider[]> {
    return this.getAvailableProviders();
  }

  private async getApiKey(providerKey: string): Promise<string> {
    // 1. Check System Settings (DB)
    // const settings = await this.getSystemAiSettings(); // TODO: Add keys to system settings

    // 2. Fallback to Env Vars (via ConfigService if available, or process.env for now)
    const key = providerKey.toUpperCase();
    if (key === 'GOOGLE') return process.env.GOOGLE_API_KEY || '';
    if (key === 'OPENAI') return process.env.OPENAI_API_KEY || '';
    if (key === 'ANTHROPIC') return process.env.ANTHROPIC_API_KEY || '';

    return '';
  }
}
