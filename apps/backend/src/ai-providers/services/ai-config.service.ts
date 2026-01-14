import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AiProviderConfigRepository } from '../infrastructure/persistence/ai-provider-config.repository';
import { EncryptionService } from '../../shared/services/encryption.service';
import { AiEncryptionService } from './ai-encryption.service';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
} from '../dto/ai-provider.dto';
import {
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiProvider,
  AiUsageLog,
  AiUsageStats,
  AiModel,
  AiModelType,
} from '../domain/ai-provider';
import { NullableType } from '../../utils/types/nullable.type';
import { AiModelRepository } from '../infrastructure/persistence/ai-model.repository';
import { AiProviderOwnerType } from '../ai-providers.enum';

@Injectable()
export class AiConfigService {
  constructor(
    private readonly aiProviderConfigRepository: AiProviderConfigRepository,
    private readonly aiEncryptionService: AiEncryptionService,
    private readonly aiModelRepository: AiModelRepository,
  ) { }

  // Provider access
  async getAvailableProviders(): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.findAvailableProviders();
  }

  async getProviderById(id: string): Promise<NullableType<AiProvider>> {
    return this.aiProviderConfigRepository.findProviderById(id);
  }

  async getConfigByProviderId(
    providerId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getConfigByProviderId(
      providerId,
      scope,
      scopeId,
    );
    // The repository should return a mapped domain object. We just decrypt it.
    // Note: The decryptConfig type definition might need to handle the union type if not generic.
    // Assuming decryptConfig accepts any config structure with a 'config' property.
    return config
      ? this.aiEncryptionService.decryptConfig(config as any)
      : null;
  }

  // Helper to sync models from string list to Entity table (Upsert Strategy)
  private async syncModelsFromList(
    configId: string,
    ownerType: AiProviderOwnerType,
    ownerId: string,
    providerId: string,
    modelList: string[],
  ): Promise<void> {
    if (!modelList) return;

    // 1. Get existing models
    const existingModels = await this.aiModelRepository.findByConfigId(
      configId,
      ownerType,
    );

    const modelsToSave: AiModel[] = [];
    const processedNames = new Set<string>();

    // 2. Process incoming list (Insert or Update)
    for (const name of modelList) {
      processedNames.add(name);
      const existing = existingModels.find((m) => m.name === name);

      if (existing) {
        // Activate if it was inactive
        if (!existing.isActive) {
          existing.isActive = true;
          modelsToSave.push(existing);
        }
        // Metadata is PRESERVED here because we use the existing entity
      } else {
        // Create new
        const m = new AiModel();
        m.name = name;
        m.displayName = name; // Default display name = name

        const lower = name.toLowerCase();
        // Improve heuristic for Ollama (nomic-embed-text) and others
        const isEmbedding =
          lower.includes('embed') ||
          lower.includes('bert') ||
          lower.includes('ada-002') ||
          lower.includes('text-embedding');

        m.type = isEmbedding ? AiModelType.EMBEDDING : AiModelType.CHAT;

        m.providerId = providerId;
        m.ownerType = ownerType;
        m.ownerId = ownerId;
        m.configId = configId;
        m.isActive = true;
        m.metadata = {};
        modelsToSave.push(m);
      }
    }

    // 3. Process removed models (Deactivate instead of Delete)
    for (const existing of existingModels) {
      if (!processedNames.has(existing.name)) {
        if (existing.isActive) {
          existing.isActive = false;
          modelsToSave.push(existing);
        }
      }
    }

    // 4. Save changes
    if (modelsToSave.length > 0) {
      await this.aiModelRepository.saveAll(modelsToSave);
    }
  }

  // User configuration methods
  async createUserConfig(
    userId: string,
    dto: CreateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    const encryptedConfig = this.aiEncryptionService.encryptConfig(dto.config);
    const config = await this.aiProviderConfigRepository.createUserConfig(
      userId,
      {
        providerId: dto.providerId,
        displayName: dto.displayName,
        config: encryptedConfig,
        modelList: dto.modelList || [],
      },
    );

    // Sync models to DB
    if (dto.modelList && dto.modelList.length > 0) {
      await this.syncModelsFromList(
        config.id,
        AiProviderOwnerType.USER,
        userId,
        dto.providerId,
        dto.modelList,
      );
    }

    // Decrypt for return
    config.config = this.aiEncryptionService.decryptConfig(config.config);
    return config;
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    const configs =
      await this.aiProviderConfigRepository.getUserConfigs(userId);

    // Get available providers to populate provider relations
    const availableProviders =
      await this.aiProviderConfigRepository.findAvailableProviders();

    // Decrypt sensitive fields and populate provider relationship
    return configs.map((config) => ({
      ...config,
      config: this.aiEncryptionService.decryptConfig(config.config),
      // Populate provider from availableProviders if not loaded by relationship
      provider:
        config.provider ||
        availableProviders.find((p) => p.id === config.providerId),
    }));
  }

  async getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getUserConfig(
      userId,
      id,
    );
    return config ? this.aiEncryptionService.decryptConfig(config) : null;
  }

  async findUserConfigById(
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.findUserConfigById(id);
    return config ? this.aiEncryptionService.decryptConfig(config) : null;
  }

  async updateUserConfig(
    userId: string,
    id: string,
    dto: UpdateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getUserConfig(
      userId,
      id,
    );
    if (!existing) {
      throw new NotFoundException('User AI provider config not found');
    }

    // Merge configs, encrypt before save
    // Smart merge: ignore masked values
    const existingDecrypted = this.aiEncryptionService.decryptConfig(existing);
    const mergedConfig = { ...existingDecrypted.config };

    if (dto.config) {
      Object.entries(dto.config).forEach(([key, val]) => {
        if (val !== '••••••••••••') {
          mergedConfig[key] = val;
        }
      });
    }
    const encryptedConfig = this.aiEncryptionService.encryptConfig({
      ...dto,
      config: mergedConfig,
    });
    const updateDto = { ...dto, config: encryptedConfig.config };

    const updatedConfig =
      await this.aiProviderConfigRepository.updateUserConfig(
        userId,
        id,
        updateDto,
      );

    // Sync models to DB (if modelList provided)
    if (dto.modelList) {
      await this.syncModelsFromList(
        id,
        AiProviderOwnerType.USER,
        userId,
        updatedConfig.providerId,
        dto.modelList,
      );
    }

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(updatedConfig);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    await this.aiModelRepository.deleteByConfigId(id, AiProviderOwnerType.USER);
    return this.aiProviderConfigRepository.deleteUserConfig(userId, id);
  }

  // Workspace configuration methods
  async createWorkspaceConfig(
    workspaceId: string,
    dto: CreateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    const encryptedConfig = this.aiEncryptionService.encryptConfig(dto);
    const config = await this.aiProviderConfigRepository.createWorkspaceConfig(
      workspaceId,
      {
        providerId: dto.providerId,
        displayName: dto.displayName,
        config: encryptedConfig.config,
        modelList: dto.modelList || [],
      },
    );

    // Sync models to DB
    if (dto.modelList && dto.modelList.length > 0) {
      await this.syncModelsFromList(
        config.id,
        AiProviderOwnerType.WORKSPACE,
        workspaceId,
        dto.providerId,
        dto.modelList,
      );
    }

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(config);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const configs =
      await this.aiProviderConfigRepository.getWorkspaceConfigs(workspaceId);

    // Get available providers to populate provider relations
    const availableProviders =
      await this.aiProviderConfigRepository.findAvailableProviders();

    // Decrypt sensitive fields and populate provider relationship
    return configs.map((config) => ({
      ...config,
      config: this.aiEncryptionService.decryptConfig(config.config),
      provider:
        config.provider ||
        availableProviders.find((p) => p.id === config.providerId),
    }));
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getWorkspaceConfig(
      workspaceId,
      id,
    );
    if (!config) return null;

    // Ensure provider is populated if missing from repo relations (fallback)
    if (!config.provider) {
      const provider = await this.aiProviderConfigRepository.findProviderById(config.providerId);
      if (provider) config.provider = provider;
    }

    return this.aiEncryptionService.decryptConfig(config);
  }

  // Unified Config Retrieval (User or Workspace)
  async getConfigDetails(
    configId: string,
    userId: string,
    workspaceId?: string
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    // 1. Try User Config
    const userConfig = await this.getUserConfig(userId, configId);
    if (userConfig) return userConfig;

    // 2. Try Workspace Config
    if (workspaceId) {
      const workspaceConfig = await this.getWorkspaceConfig(workspaceId, configId);
      if (workspaceConfig) return workspaceConfig;
    }

    // 3. Last Resort: Try Generic Config ID (e.g., System or Shared)
    const genericConfig = await this.aiProviderConfigRepository.getConfigById(configId);
    if (genericConfig) return genericConfig;

    return null;
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    dto: UpdateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getWorkspaceConfig(
      workspaceId,
      id,
    );
    if (!existing) {
      throw new NotFoundException('Workspace AI provider config not found');
    }

    // Merge configs, encrypt before save
    // Smart merge: ignore masked values
    const existingDecrypted = this.aiEncryptionService.decryptConfig(existing);
    const mergedConfig = { ...existingDecrypted.config };

    if (dto.config) {
      Object.entries(dto.config).forEach(([key, val]) => {
        if (val !== '••••••••••••') {
          mergedConfig[key] = val;
        }
      });
    }
    const encryptedConfig = this.aiEncryptionService.encryptConfig({
      ...dto,
      config: mergedConfig,
    });
    const updateDto = { ...dto, config: encryptedConfig.config };

    const updatedConfig =
      await this.aiProviderConfigRepository.updateWorkspaceConfig(
        workspaceId,
        id,
        updateDto,
      );

    // Sync models to DB
    if (dto.modelList) {
      await this.syncModelsFromList(
        id,
        AiProviderOwnerType.WORKSPACE,
        workspaceId,
        updatedConfig.providerId,
        dto.modelList,
      );
    }

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(updatedConfig);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    await this.aiModelRepository.deleteByConfigId(
      id,
      AiProviderOwnerType.WORKSPACE,
    );
    return this.aiProviderConfigRepository.deleteWorkspaceConfig(
      workspaceId,
      id,
    );
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
    return this.aiProviderConfigRepository.getUsageLogs(workspaceId, options);
  }

  async getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<AiUsageStats> {
    return this.aiProviderConfigRepository.getUsageStats(workspaceId, period);
  }
}
