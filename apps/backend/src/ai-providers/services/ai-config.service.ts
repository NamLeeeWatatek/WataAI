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
} from '../domain/ai-provider';
import { NullableType } from '../../utils/types/nullable.type';

@Injectable()
export class AiConfigService {
  constructor(
    private readonly aiProviderConfigRepository: AiProviderConfigRepository,
    private readonly aiEncryptionService: AiEncryptionService,
  ) { }

  // Provider access
  async getAvailableProviders(): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.findAvailableProviders();
  }

  async getProviderById(id: string): Promise<NullableType<AiProvider>> {
    return this.aiProviderConfigRepository.findProviderById(id);
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

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(updatedConfig);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
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

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(config);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const configs =
      await this.aiProviderConfigRepository.getWorkspaceConfigs(workspaceId);

    // Decrypt sensitive fields
    return configs.map((config) =>
      this.aiEncryptionService.decryptConfig(config),
    );
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getWorkspaceConfig(
      workspaceId,
      id,
    );
    return config ? this.aiEncryptionService.decryptConfig(config) : null;
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

    // Decrypt for return
    return this.aiEncryptionService.decryptConfig(updatedConfig);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
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
