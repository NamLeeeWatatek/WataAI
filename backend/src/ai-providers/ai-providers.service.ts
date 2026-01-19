import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { SystemAiSettingsRepository } from './infrastructure/system/system-ai-settings.repository';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
  UpdateSystemAiSettingsDto,
  QueryAiModelDto,
} from './dto/ai-provider.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
  AiUsageStats,
  ChatMessage,
  SystemAiSettings,
  AiModel,
  AiModelType,
} from './domain/ai-provider';
import { AiProviderOwnerType } from './ai-providers.enum';
import { AiModelRepository } from './infrastructure/persistence/ai-model.repository';

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
    private readonly aiModelRepository: AiModelRepository,
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
  maskConfig(config: Record<string, unknown>): Record<string, unknown> {
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
      await this.aiModelService.verifyConnection(
        config.provider.key,
        config.config,
      );
    } catch (error) {
      this.logger.warn(
        `Verification failed for user ${userId} config ${id}: ${error instanceof Error ? error.message : String(error)} `,
      );
      throw new BadRequestException(
        `Verification failed: ${error instanceof Error ? error.message : String(error)} `,
      );
    }

    // Update verified status
    // Note: We need to preserve existing config data while setting isVerified=true
    const currentConfigData = config.config || {};
    await this.updateUserConfig(userId, id, {
      config: {
        ...currentConfigData,
        isVerified: true,
      },
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
      const config = await this.aiConfigService.getUserConfig(
        scopeId,
        configId,
      );
      return !!config;
    } else {
      const config = await this.aiConfigService.getWorkspaceConfig(
        scopeId,
        configId,
      );
      return !!config;
    }
  }

  async getConfigByProviderId(
    providerId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    return this.aiConfigService.getConfigByProviderId(
      providerId,
      scope,
      scopeId,
    );
  }

  async getConfigDetails(
    configId: string,
    userId: string,
    workspaceId?: string,
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    return this.aiConfigService.getConfigDetails(configId, userId, workspaceId);
  }

  async findModelsWithPagination(
    query: QueryAiModelDto,
  ): Promise<InfinityPaginationResponseDto<AiModel>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const data = await this.aiModelRepository.findManyWithPagination({
      filterOptions: query.filters,
      sortOptions: query.sort,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
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
  ): Promise<AiUsageStats> {
    return this.aiConfigService.getUsageStats(workspaceId, period);
  }

  // --- Chat & Generation Logic (Delegate to Model Service) ---

  private async resolveConfigParams(
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    baseUrl?: string,
    options?: Record<string, any>,
  ): Promise<{
    providerKey: string;
    apiKey: string;
    baseUrl?: string;
    modelName: string;
    options?: Record<string, any>;
  }> {
    const {
      name: modelName,
      configId,
      ownerId,
      ownerType,
    } = await this.resolveModel(model);

    const finalConfigId = providerConfigId || configId;
    const finalOwnerId = ownerId;
    const finalOwnerType = ownerType;

    let providerKey = '';
    let finalsApiKey = apiKey || '';
    let finalBaseUrl = baseUrl;
    let finalOptions = options || {};

    if (finalConfigId && finalOwnerId && finalOwnerType) {
      let config: UserAiProviderConfig | WorkspaceAiProviderConfig | null =
        null;
      if (finalOwnerType === AiProviderOwnerType.USER) {
        config = await this.aiConfigService.getUserConfig(
          finalOwnerId,
          finalConfigId,
        );
      } else {
        config = await this.aiConfigService.getWorkspaceConfig(
          finalOwnerId,
          finalConfigId,
        );
      }

      if (config && config.provider) {
        providerKey = config.provider.key.toLowerCase();
        finalsApiKey = (config.config.apiKey as string) || finalsApiKey;
        finalBaseUrl = (config.config.baseUrl as string) || finalBaseUrl;
        finalOptions = {
          ...config.config.aiParameters,
          ...finalOptions,
        };
      }
    }

    // Fallback/Legacy
    if (!providerKey && providerConfigId) {
      const validKeys = [
        'openai',
        'anthropic',
        'google',
        'ollama',
        'azure',
        'custom',
      ];
      if (validKeys.includes(providerConfigId.toLowerCase())) {
        providerKey = providerConfigId.toLowerCase();
      }
    }

    if (!providerKey) {
      throw new BadRequestException(
        `Could not resolve AI Provider configuration for model ${modelName}.`,
      );
    }

    return {
      providerKey,
      apiKey: finalsApiKey,
      baseUrl: finalBaseUrl,
      modelName,
      options: finalOptions,
    };
  }

  // Removed heuristic resolveProviderKey.
  // We now strictly rely on resolved model config or passed provider.

  private getProviderKeyFromConfig(
    config: UserAiProviderConfig | WorkspaceAiProviderConfig,
  ): string {
    if (!config.provider)
      throw new BadRequestException('Provider not loaded for config');
    return config.provider.key.toLowerCase();
  }

  private isUuid(val: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  }

  async resolveModel(modelIdOrName: string): Promise<{
    name: string;
    providerId?: string;
    configId?: string;
    ownerId?: string;
    ownerType?: string;
  }> {
    if (this.isUuid(modelIdOrName)) {
      const model = await this.aiModelRepository.findById(modelIdOrName);
      if (model) {
        return {
          name: model.name,
          providerId: model.providerId,
          configId: model.configId as string | undefined,
          ownerId: model.ownerId,
          ownerType: model.ownerType,
        };
      }
    }
    return { name: modelIdOrName };
  }

  async chat(
    prompt: string,
    model: string,
    providerConfigId?: string,
    apiKey?: string, // Legacy/Override
    workspaceId?: string, // Legacy/Override
    baseUrl?: string, // Legacy/Override
    useTools?: boolean,
  ): Promise<string> {
    const {
      name: modelName,
      configId,
      ownerId,
      ownerType,
    } = await this.resolveModel(model);

    const finalConfigId = providerConfigId || configId;
    const finalOwnerId = ownerId;
    const finalOwnerType = ownerType;

    // specific override if providerConfigId is passed but owner info is missing (ad-hoc config usage?)
    // This part is tricky without owner info.
    // If providerConfigId is passed, we might assume it's same scope as the caller?
    // But chat() doesn't have caller scope.
    // For now, let's assume if providerConfigId is passed, it might be a User config if we can't determine.
    // However, best to rely on model resolution.

    let providerKey = '';
    let finalsApiKey = apiKey || '';
    let finalBaseUrl = baseUrl;

    if (finalConfigId && finalOwnerId && finalOwnerType) {
      let config: UserAiProviderConfig | WorkspaceAiProviderConfig | null =
        null;
      if (finalOwnerType === AiProviderOwnerType.USER) {
        config = await this.aiConfigService.getUserConfig(
          finalOwnerId,
          finalConfigId,
        );
      } else {
        config = await this.aiConfigService.getWorkspaceConfig(
          finalOwnerId,
          finalConfigId,
        );
      }

      if (config && config.provider) {
        providerKey = config.provider.key.toLowerCase(); // e.g. 'openai'
        finalsApiKey = (config.config.apiKey as string) || finalsApiKey;
        finalBaseUrl = (config.config.baseUrl as string) || finalBaseUrl;
      }
    }

    // Fallback if apiKey is explicitly provided but no config (Ad-hoc)
    if (!providerKey && providerConfigId) {
      // If providerConfigId is actually a provider TYPE name (legacy support?)
      // The user said REMOVE full flow. So maybe we shouldn't support "openai" string as providerId.
      // But for safety let's allow "custom" or explicit types if provided matching our supported keys.
      const validKeys = [
        'openai',
        'anthropic',
        'google',
        'ollama',
        'azure',
        'custom',
      ];
      if (validKeys.includes(providerConfigId.toLowerCase())) {
        providerKey = providerConfigId.toLowerCase();
      }
    }

    if (!providerKey) {
      throw new BadRequestException(
        'Could not resolve AI Provider configuration for this model.',
      );
    }

    const messages = [{ role: 'user', content: prompt } as ChatMessage];

    return this.dispatchChat(
      providerKey,
      messages,
      modelName,
      finalsApiKey,
      finalBaseUrl,
      useTools,
    );
  }

  async generateEmbedding(
    text: string,
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    options?: { baseUrl?: string },
  ): Promise<number[]> {
    const {
      providerKey,
      apiKey: finalApiKey,
      baseUrl: finalBaseUrl,
      modelName,
    } = await this.resolveConfigParams(
      model,
      providerConfigId,
      apiKey,
      options?.baseUrl,
    );

    return this.aiModelService.generateEmbedding(
      text,
      providerKey,
      modelName,
      finalApiKey,
      finalBaseUrl,
    );
  }

  async generateEmbeddingUsingProvider(
    text: string,
    model: string,
    providerConfigId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<number[]> {
    let config: UserAiProviderConfig | WorkspaceAiProviderConfig;
    if (scope === 'user') {
      const c = await this.aiConfigService.getUserConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const apiKey = config.config.apiKey as string;
    const baseUrl = config.config.baseUrl as string | undefined;

    const { name: modelName } = await this.resolveModel(model);

    return this.aiModelService.generateEmbedding(
      text,
      config.provider.key.toLowerCase(),
      modelName,
      apiKey,
      baseUrl,
    );
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    baseUrl?: string,
  ): Promise<string> {
    const {
      providerKey,
      apiKey: finalApiKey,
      baseUrl: finalBaseUrl,
      modelName,
    } = await this.resolveConfigParams(
      model,
      providerConfigId,
      apiKey,
      baseUrl,
    );

    return this.dispatchChat(
      providerKey,
      messages,
      modelName,
      finalApiKey,
      finalBaseUrl,
    );
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    prompt?: string,
  ): Promise<string> {
    const {
      providerKey,
      apiKey: finalApiKey,
      modelName,
    } = await this.resolveConfigParams(model, providerConfigId, apiKey);

    if (providerKey === 'google') {
      return this.aiModelService.analyzeImageWithGoogle(
        imageBuffer,
        mimeType,
        modelName,
        finalApiKey,
        prompt,
      );
    }

    throw new BadRequestException(
      `Vision not supported for provider ${providerKey}`,
    );
  }

  async chatWithHistoryUsingProvider(
    messages: ChatMessage[],
    model: string,
    providerConfigId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
    options?: Record<string, any>,
  ): Promise<string> {
    let config: UserAiProviderConfig | WorkspaceAiProviderConfig;

    if (scope === 'user') {
      const c = await this.aiConfigService.getUserConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const providerKey = config.provider.key.toLowerCase();
    const apiKey = config.config.apiKey as string;
    const baseUrl = (config.config.baseUrl || config.config.baseURL) as
      | string
      | undefined;

    return this.dispatchChat(
      providerKey,
      messages,
      model,
      apiKey,
      baseUrl,
      undefined,
      { ...config.config?.aiParameters, ...options },
    );
  }

  private async dispatchChat(
    providerKey: string,
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    baseUrl?: string,
    useTools?: boolean,
    options?: Record<string, any>,
  ): Promise<string> {
    if (providerKey === 'google') {
      // 'gemini' is normalized to 'google' by resolveProviderKey
      return this.aiModelService.chatWithGoogleHistory(
        messages,
        model,
        apiKey,
        useTools,
        options,
      );
    }
    if (providerKey === 'openai' || providerKey === 'custom') {
      return this.aiModelService.chatWithOpenAIHistory(
        messages,
        model,
        apiKey,
        baseUrl,
        options,
      );
    }
    if (providerKey === 'anthropic') {
      return this.aiModelService.chatWithAnthropicHistory(
        messages,
        model,
        apiKey,
        options,
      );
    }
    if (providerKey === 'ollama') {
      return this.aiModelService.chatWithOllamaHistory(
        messages,
        model,
        baseUrl,
        apiKey,
        options,
      );
    }
    if (providerKey === 'azure') {
      return this.aiModelService.chatWithAzureHistory(
        messages,
        model,
        apiKey,
        baseUrl,
        options,
      );
    }

    throw new BadRequestException(`Unsupported provider: ${providerKey} `);
  }

  async chatStream(
    prompt: string,
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    workspaceId?: string,
    baseUrl?: string,
    useTools?: boolean,
    options?: Record<string, any>,
  ): Promise<AsyncGenerator<string>> {
    const {
      providerKey,
      apiKey: finalApiKey,
      baseUrl: finalBaseUrl,
      modelName,
      options: finalOptions,
    } = await this.resolveConfigParams(
      model,
      providerConfigId,
      apiKey,
      baseUrl,
      options,
    );

    const messages = [{ role: 'user', content: prompt } as ChatMessage];

    return this.dispatchChatStream(
      providerKey,
      messages,
      modelName,
      finalApiKey,
      finalBaseUrl,
      useTools,
      finalOptions,
    );
  }

  async chatWithHistoryStream(
    messages: ChatMessage[],
    model: string,
    providerConfigId?: string,
    apiKey?: string,
    baseUrl?: string,
    options?: Record<string, any>,
  ): Promise<AsyncGenerator<string>> {
    const {
      providerKey,
      apiKey: finalApiKey,
      baseUrl: finalBaseUrl,
      modelName,
      options: finalOptions,
    } = await this.resolveConfigParams(
      model,
      providerConfigId,
      apiKey,
      baseUrl,
      options,
    );

    return this.dispatchChatStream(
      providerKey,
      messages,
      modelName,
      finalApiKey,
      finalBaseUrl,
      undefined, // useTools not supported here
      finalOptions,
    );
  }

  async chatWithHistoryUsingProviderStream(
    messages: ChatMessage[],
    model: string,
    providerConfigId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
    options?: Record<string, any>,
  ): Promise<AsyncGenerator<string>> {
    let config: UserAiProviderConfig | WorkspaceAiProviderConfig;

    if (scope === 'user') {
      const c = await this.aiConfigService.getUserConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(
        scopeId,
        providerConfigId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const providerKey = config.provider.key.toLowerCase();
    const apiKey = config.config.apiKey as string;
    const baseUrl = (config.config.baseUrl || config.config.baseURL) as
      | string
      | undefined;

    return this.dispatchChatStream(
      providerKey,
      messages,
      model,
      apiKey,
      baseUrl,
      undefined,
      { ...config.config?.aiParameters, ...options },
    );
  }

  private async dispatchChatStream(
    providerKey: string,
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    baseUrl?: string,
    useTools?: boolean,
    options?: Record<string, any>,
  ): Promise<AsyncGenerator<string>> {
    if (providerKey === 'google') {
      return this.aiModelService.chatWithGoogleStream(
        messages,
        model,
        apiKey,
        useTools,
        options,
      );
    }
    if (providerKey === 'openai' || providerKey === 'custom') {
      return this.aiModelService.chatWithOpenAIStream(
        messages,
        model,
        apiKey,
        baseUrl,
        options,
      );
    }
    if (providerKey === 'anthropic') {
      return this.aiModelService.chatWithAnthropicStream(
        messages,
        model,
        apiKey,
        options,
      );
    }
    if (providerKey === 'ollama') {
      return this.aiModelService.chatWithOllamaStream(
        messages,
        model,
        baseUrl,
        apiKey,
        options,
      );
    }
    if (providerKey === 'azure') {
      return this.aiModelService.chatWithAzureStream(
        messages,
        model,
        apiKey,
        baseUrl,
        options,
      );
    }

    throw new BadRequestException(`Unsupported provider: ${providerKey} `);
  }

  async fetchProviderModels(
    configId: string,
    context: 'user' | 'workspace',
    contextId: string,
  ): Promise<AiModel[]> {
    let config: UserAiProviderConfig | WorkspaceAiProviderConfig;
    let ownerType: AiProviderOwnerType;
    let ownerId: string;

    if (context === 'user') {
      const c = await this.aiConfigService.getUserConfig(contextId, configId);
      if (!c) throw new NotFoundException('Config not found');
      config = c;
      ownerType = AiProviderOwnerType.USER;
      ownerId = contextId;
    } else {
      const c = await this.aiConfigService.getWorkspaceConfig(
        contextId,
        configId,
      );
      if (!c) throw new NotFoundException('Config not found');
      config = c;
      ownerType = AiProviderOwnerType.WORKSPACE;
      ownerId = contextId;
    }

    if (!config.provider) throw new BadRequestException('Provider not loaded');

    const remoteModels = await this.aiModelService.fetchRemoteModels(
      config.provider.key,
      config.config,
    );

    // PERSISTENCE LOGIC: Sync with AiModelEntity
    if (remoteModels.length > 0) {
      const providerId = config.providerId;

      // 1. Deactivate old models for this config
      await this.aiModelRepository.deactivateAllByConfigId(configId, ownerType);

      // 2. Prepare new models
      const modelsToSave: AiModel[] = remoteModels.map((name) => {
        const m = new AiModel();
        m.name = name;
        m.displayName = name; // Can be enhanced later
        m.type = name.toLowerCase().includes('embed')
          ? AiModelType.EMBEDDING
          : AiModelType.CHAT;
        m.providerId = providerId;
        m.ownerType = ownerType;
        m.ownerId = ownerId;
        m.configId = configId;
        m.isActive = true;
        m.metadata = {};
        return m;
      });

      // 3. Save all (will update existing ones or insert new ones depending on repo implementation)
      // For now, let's just save. If we want to avoid duplicates by 'name' within a config,
      // the repo could handle it. But our current RelationalRepo just saves.
      // Better: Delete old and save new for this specific sync session.
      await this.aiModelRepository.deleteByConfigId(configId, ownerType);
      await this.aiModelRepository.saveAll(modelsToSave);
      return modelsToSave;
    }

    return [];
  }

  async getModelsByConfig(
    configId: string,
    context: 'user' | 'workspace',
    contextId: string,
    type?: string,
  ): Promise<AiModel[]> {
    const ownerType =
      context === 'user'
        ? AiProviderOwnerType.USER
        : AiProviderOwnerType.WORKSPACE;

    return this.aiModelRepository.findByConfigId(configId, ownerType, type);
  }

  async fetchModelsFromDirectConfig(
    providerId: string,
    config: Record<string, unknown>,
  ): Promise<string[]> {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');
    return this.aiModelService.fetchRemoteModels(provider.key, config);
  }

  async fetchModelsWithPotentialMask(
    providerId: string,
    config: Record<string, unknown>,
    userId: string,
    configId?: string,
  ): Promise<string[]> {
    const finalConfig = { ...config };

    // If we have a configId, we try to resolve masked values
    if (configId) {
      const existingConfig = await this.aiConfigService.getUserConfig(
        userId,
        configId,
      );
      if (existingConfig && existingConfig.providerId === providerId) {
        // Merge decryption logic similar to update
        const decryptedExisting =
          this.aiEncryptionService.decryptConfig(existingConfig);

        Object.keys(finalConfig).forEach((key) => {
          const val = finalConfig[key];
          // If value seems to be a mask, replace with existing value
          if (typeof val === 'string' && val.includes('••••')) {
            if (decryptedExisting.config && decryptedExisting.config[key]) {
              finalConfig[key] = decryptedExisting.config[key];
            }
          }
        });
      }
    }

    return this.fetchModelsFromDirectConfig(providerId, finalConfig);
  }

  async generateSystemPrompt(params: {
    userId: string;
    description: string;
    template?: string;
    providerConfigId?: string;
    tone?: string;
    style?: string;
    additionalContext?: Record<string, unknown>;
  }): Promise<{
    prompt: string;
    improvements: string[];
    suggestions: string[];
  }> {
    try {
      this.logger.log(
        `[GeneratePrompt] Starting smart generation for user ${params.userId}`,
      );

      // 1. Resolve usable AI Provider
      // We prioritize a specific config if passed, otherwise use effective default
      let providerKey = '';
      let apiKey = '';
      let model = '';

      if (params.providerConfigId) {
        const config = await this.getUserConfig(
          params.userId,
          params.providerConfigId,
        );
        if (config && config.isActive) {
          providerKey = config.provider?.key || '';
          apiKey = config.config.apiKey || '';
          model = config.modelList?.[0] || 'default';
        }
      }

      if (!apiKey) {
        const resolved = await this.resolveEffectiveProvider(params.userId);
        providerKey = resolved.providerKey;
        apiKey = resolved.apiKey;
        model = resolved.model;
      }

      // 2. Construct Meta-Prompt
      const contextJson = params.additionalContext
        ? JSON.stringify(params.additionalContext)
        : 'None';
      const metaPrompt = `
      You are an expert AI Prompt Engineer and System Architect.
      Your goal is to generate a high - quality, production - ready "System Prompt" for another AI agent based on the user's requirements.

      USER REQUIREMENTS:
- Goal / Description: "${params.description}"
  - Desired Tone: ${params.tone || 'Professional and helpful'}
- Writing Style: ${params.style || 'Clear and concise'}
- Template / Format: ${params.template || 'Standard System Prompt'}
- Additional Context: ${contextJson}

INSTRUCTIONS:
1. Analyze the requirements deeply.
      2. Create a robust System Prompt that enforces the goal, tone, and style.
      3. Identify 3 specific improvements you made to the user's vague idea.
4. Suggest 3 follow - up ideas or constraints to make the agent better.

      OUTPUT FORMAT:
      You must respond with valid JSON ONLY.No markdown blocks.
      {
  "prompt": "The generated system prompt text...",
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
      "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
`;

      // 3. Call AI
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a JSON-speaking expert prompt engineer.',
        },
        { role: 'user', content: metaPrompt },
      ];

      // Use a "smart" model if possible (Gemini 1.5 Pro, GPT-4)
      // Logic inside dispatchChat handles strict model mapping usually, but we can try to hint for a better model if "default" was returned
      if (model === 'default' || model === 'gemini-1.5-flash') {
        // Upgrade to Pro if using Google for better reasoning? Or stick to Flash for speed.
        // Flash is usually fine for this.
      }

      const responseText = await this.dispatchChat(
        providerKey,
        messages,
        model,
        apiKey,
      );

      // 4. Parse JSON
      const cleaned = responseText.replace(/```json | ```/g, '').trim();
      const result = JSON.parse(cleaned);

      return {
        prompt: result.prompt || '',
        improvements: result.improvements || [],
        suggestions: result.suggestions || [],
      };
    } catch (error) {
      this.logger.warn(
        `[GeneratePrompt] Smart generation failed: ${error.message}. Falling back to heuristics.`,
      );

      // Fallback to simple string construction if AI fails
      const toneString = params.tone
        ? ` The response should be ${params.tone}.`
        : '';
      const styleString = params.style
        ? ` Write in a ${params.style} style.`
        : '';
      const basePrompt =
        params.template ||
        `You are an AI assistant designed to: ${params.description}.${toneString}${styleString} `;

      return {
        prompt: basePrompt,
        improvements: ['Fallback generation used due to AI service error'],
        suggestions: ['Check AI provider configuration'],
      };
    }
  }

  async enhancePrompt(
    userId: string,
    originalPrompt: string,
    type: 'image' | 'text' | 'code' | 'general' = 'general',
  ): Promise<string> {
    try {
      // 1. Resolve Provider & Configuration
      const { providerKey, apiKey, model } =
        await this.resolveEffectiveProvider(userId);

      // 2. Construct System Instruction
      const systemInstruction = this.getSystemInstruction(type);

      // 3. Prepare Chat Context
      const messages: ChatMessage[] = [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: `Original Input: "${originalPrompt}"\n\nEnhanced Prompt: `,
        },
      ];

      // 4. Dispatch
      const enhanced = await this.dispatchChat(
        providerKey,
        messages,
        model,
        apiKey,
      );

      return enhanced.replace(/^"|"$/g, '').trim();
    } catch (error) {
      this.logger.error(
        `[EnhancePrompt] Failed: ${error.message} `,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to generate AI response. Please check your AI settings.',
      );
    }
  }

  /**
   * Resolves the best available AI provider config (User > Workspace > System)
   */
  private async resolveEffectiveProvider(
    userId: string,
  ): Promise<{ providerKey: string; apiKey: string; model: string }> {
    // A. Check User Configs
    const userConfigs = await this.getUserConfigs(userId);
    const validUserConfigs = userConfigs.filter(
      (c) => c.isActive && c.config.isVerified,
    );

    // Preference order: OpenAI > Anthropic > Google > Ollama > Others
    const preferredOrder = ['openai', 'anthropic', 'google', 'ollama'];
    let selectedConfig =
      validUserConfigs.find((c) =>
        preferredOrder.includes(c.provider?.key || ''),
      ) || validUserConfigs[0];

    // Refinement: Try to pick matches from preferredOrder explicitly if multiple exist
    for (const key of preferredOrder) {
      const found = validUserConfigs.find((c) => c.provider?.key === key);
      if (found) {
        selectedConfig = found;
        break;
      }
    }

    if (selectedConfig && selectedConfig.provider) {
      const model =
        selectedConfig.modelList?.[0] ||
        this.getDefaultModelForProvider(selectedConfig.provider.key);
      return {
        providerKey: selectedConfig.provider.key,
        apiKey: selectedConfig.config.apiKey || '',
        model,
      };
    }

    // B. Check System Settings (No Workspace support yet for this specific feature)
    const systemSettings = await this.getSystemAiSettings();
    if (!systemSettings) throw new Error('No AI System Settings found');

    const providerKeyRaw = systemSettings.defaultProviderId || 'google';
    let providerKey = providerKeyRaw;
    let apiKey = '';
    let model = systemSettings.defaultModel || 'default';

    // Resolve UUIDs if necessary
    if (providerKeyRaw.match(/^[0-9a-fA-F-]{36}$/)) {
      // 1. Try finding as UserConfig (Admin's personal config used as system default)
      const userConfig =
        await this.aiConfigService.findUserConfigById(providerKeyRaw);
      if (userConfig && userConfig.provider) {
        providerKey = userConfig.provider.key;
        apiKey = userConfig.config.apiKey || '';
        if (!model || model === 'default')
          model = userConfig.modelList?.[0] || 'default';
      } else {
        // 2. Try finding as basic Provider Entity
        const providers = await this.getAvailableProviders();
        const found = providers.find((p) => p.id === providerKeyRaw);
        if (found) {
          providerKey = found.key;
          apiKey = await this.getApiKey(providerKey);
        } else {
          // Fallback
          apiKey = await this.getApiKey(providerKeyRaw);
        }
      }
    } else {
      // Standard Key
      apiKey = await this.getApiKey(providerKey);
    }

    // Final Model Validations
    if (!model || model === 'default') {
      model = this.getDefaultModelForProvider(providerKey);
    }

    return { providerKey, apiKey, model };
  }

  private getDefaultModelForProvider(providerKey: string): string {
    switch (providerKey) {
      case 'google':
        return 'gemini-1.5-flash';
      case 'openai':
        return 'gpt-4o-mini';
      case 'anthropic':
        return 'claude-3-haiku-20240307';
      default:
        return 'default';
    }
  }

  private getSystemInstruction(type: string): string {
    switch (type) {
      case 'image':
        return "You are an expert prompt engineer for image generation models. Enhance the user's prompt to be descriptive, visual, and artistic. Output ONLY the enhanced prompt.";
      case 'code':
        return "You are an expert software architect. Enhance the user's prompt to be a clear, technical requirement for code generation. Output ONLY the enhanced prompt.";
      case 'text':
      case 'general':
      default:
        return "You are an expert prompt engineer. Rewrite the user's prompt to be clear, detailed, and optimized for an LLM. Output ONLY the enhanced prompt.";
    }
  }

  // --- System Settings ---

  async getSystemAiSettings() {
    // Delegate to Repository directly for now (or move to ConfigService later)
    return this.systemAiSettingsRepository.findSystemSettings();
  }

  async updateSystemAiSettings(dto: UpdateSystemAiSettingsDto) {
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
    // Safety check: specific handling if providerKey is a UUID
    if (providerKey.match(/^[0-9a-fA-F-]{36}$/)) {
      console.log(
        `[getApiKey] Received UUID ${providerKey}, resolving to key...`,
      );
      const provider = await this.getProviderById(providerKey);
      if (provider) {
        console.log(`[getApiKey] Resolved UUID to ${provider.key} `);
        providerKey = provider.key;
      } else {
        console.warn(`[getApiKey] Could not resolve UUID ${providerKey} `);
      }
    }

    const key = providerKey.toUpperCase();
    console.log(`[getApiKey] Looking for env var for: ${key} `);

    if (key === 'GOOGLE' && process.env.GOOGLE_API_KEY)
      return process.env.GOOGLE_API_KEY;
    if (key === 'OPENAI' && process.env.OPENAI_API_KEY)
      return process.env.OPENAI_API_KEY;
    if (key === 'ANTHROPIC' && process.env.ANTHROPIC_API_KEY)
      return process.env.ANTHROPIC_API_KEY;

    // Check for other providers if generic naming convention is used
    const envKey = `${key} _API_KEY`;
    if (process.env[envKey]) return process.env[envKey];

    this.logger.error(
      `Missing API Key for provider: ${providerKey} (Env fallback checked)`,
    );
    throw new UnprocessableEntityException(
      `Missing API configuration for ${providerKey}.Please configure your own API key in Settings.`,
    );
  }
}
