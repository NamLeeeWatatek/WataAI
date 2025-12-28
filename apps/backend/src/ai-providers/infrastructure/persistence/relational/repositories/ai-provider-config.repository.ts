import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';
import {
  AiProviderEntity,
  AiProviderConfigEntity,
  UserAiProviderConfigEntity,
  WorkspaceAiProviderConfigEntity,
  AiUsageLogEntity,
} from '../entities/ai-provider.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { AiProviderConfigRepository } from '../../ai-provider-config.repository';
import { AiProviderMapper } from '../mappers/ai-provider.mapper';
import { UserAiProviderConfigMapper } from '../mappers/user-ai-provider-config.mapper';
import { WorkspaceAiProviderConfigMapper } from '../mappers/workspace-ai-provider-config.mapper';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
} from '../../../../domain/ai-provider';

@Injectable()
export class AiProviderConfigRelationalRepository
  implements AiProviderConfigRepository
{
  constructor(
    @InjectRepository(AiProviderEntity)
    private readonly aiProviderRepository: Repository<AiProviderEntity>,
    @InjectRepository(AiProviderConfigEntity)
    private readonly configRepository: Repository<AiProviderConfigEntity>,
    @InjectRepository(UserAiProviderConfigEntity)
    private readonly userConfigRepository: Repository<UserAiProviderConfigEntity>,
    @InjectRepository(WorkspaceAiProviderConfigEntity)
    private readonly workspaceConfigRepository: Repository<WorkspaceAiProviderConfigEntity>,
    @InjectRepository(AiUsageLogEntity)
    private readonly usageLogRepository: Repository<AiUsageLogEntity>,
  ) {}

  // AiProvider operations
  async findAvailableProviders(): Promise<AiProvider[]> {
    const entities = await this.aiProviderRepository.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });
    return entities.map((entity) => AiProviderMapper.toDomain(entity));
  }

  async findProviderById(id: string): Promise<NullableType<AiProvider>> {
    const entity = await this.aiProviderRepository.findOne({
      where: { id, isActive: true },
    });
    return entity ? AiProviderMapper.toDomain(entity) : null;
  }

  // User config operations
  async createUserConfig(
    userId: string,
    data: {
      providerId: string;
      displayName: string;
      config: Record<string, any>;
      modelList: string[];
    },
  ): Promise<UserAiProviderConfig> {
    const fullData = {
      ...data,
      userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserAiProviderConfig;
    const persistenceModel = UserAiProviderConfigMapper.toPersistence(fullData);
    const newEntity = await this.userConfigRepository.save(
      this.userConfigRepository.create(persistenceModel),
    );
    return UserAiProviderConfigMapper.toDomain(newEntity);
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    const entities = await this.userConfigRepository.find({
      where: { userId },
      relations: ['provider'],
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) =>
      UserAiProviderConfigMapper.toDomain(entity),
    );
  }

  async getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const entity = await this.userConfigRepository.findOne({
      where: { id, userId },
      relations: ['provider'],
    });
    return entity ? UserAiProviderConfigMapper.toDomain(entity) : null;
  }

  async updateUserConfig(
    userId: string,
    id: string,
    payload: Partial<UserAiProviderConfig>,
  ): Promise<UserAiProviderConfig> {
    const entity = await this.userConfigRepository.findOne({
      where: { id, userId },
    });

    if (!entity) {
      throw new Error(`User config not found`);
    }

    const updatedEntity = await this.userConfigRepository.save(
      this.userConfigRepository.create(
        UserAiProviderConfigMapper.toPersistence({
          ...UserAiProviderConfigMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserAiProviderConfigMapper.toDomain(updatedEntity);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    await this.userConfigRepository.delete({ id, userId });
  }

  async verifyUserConfig(userId: string, id: string): Promise<boolean> {
    const config = await this.getUserConfig(userId, id);
    if (!config || !config.isActive) {
      return false;
    }

    // Basic validation - check if required fields are present
    const provider = config.provider;
    const decryptedConfig = config.config;

    if (!provider) {
      return false;
    }

    // Simple validation based on provider requirements
    const hasRequiredFields = provider.requiredFields.every(
      (field) =>
        decryptedConfig[field] && decryptedConfig[field].toString().trim(),
    );

    // For providers with no required fields (like ollama, custom), check for basic config
    if (!hasRequiredFields && provider.requiredFields.length === 0) {
      const hasApiKey = decryptedConfig.apiKey && decryptedConfig.apiKey.trim();
      const hasBaseUrl =
        decryptedConfig.baseUrl && decryptedConfig.baseUrl.trim();
      const hasSomeConfig = hasApiKey || hasBaseUrl;

      if (!hasSomeConfig) {
        return false; // Need at least something configured
      }
    } else if (!hasRequiredFields) {
      return false; // Required fields not present
    }

    // Mark as verified by updating only the config field
    const updatedConfigData = {
      config: {
        ...config.config,
        isVerified: true,
      },
    };

    await this.updateUserConfig(userId, id, updatedConfigData);
    return true;
  }

  // Workspace config operations
  async createWorkspaceConfig(
    workspaceId: string,
    data: {
      providerId: string;
      displayName: string;
      config: Record<string, any>;
      modelList: string[];
    },
  ): Promise<WorkspaceAiProviderConfig> {
    const fullData = {
      ...data,
      workspaceId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkspaceAiProviderConfig;
    const persistenceModel =
      WorkspaceAiProviderConfigMapper.toPersistence(fullData);
    const newEntity = await this.workspaceConfigRepository.save(
      this.workspaceConfigRepository.create(persistenceModel),
    );
    return WorkspaceAiProviderConfigMapper.toDomain(newEntity);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const entities = await this.workspaceConfigRepository.find({
      where: { workspaceId },
      relations: ['provider'],
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) =>
      WorkspaceAiProviderConfigMapper.toDomain(entity),
    );
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    const entity = await this.workspaceConfigRepository.findOne({
      where: { id, workspaceId },
      relations: ['provider'],
    });
    return entity ? WorkspaceAiProviderConfigMapper.toDomain(entity) : null;
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    payload: Partial<WorkspaceAiProviderConfig>,
  ): Promise<WorkspaceAiProviderConfig> {
    const entity = await this.workspaceConfigRepository.findOne({
      where: { id, workspaceId },
    });

    if (!entity) {
      throw new Error(`Workspace config not found`);
    }

    const updatedEntity = await this.workspaceConfigRepository.save(
      this.workspaceConfigRepository.create(
        WorkspaceAiProviderConfigMapper.toPersistence({
          ...WorkspaceAiProviderConfigMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WorkspaceAiProviderConfigMapper.toDomain(updatedEntity);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    await this.workspaceConfigRepository.delete({ id, workspaceId });
  }

  // Additional methods
  async getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      provider?: string;
      limit?: number;
    },
  ): Promise<any[]> {
    let query = this.usageLogRepository
      .createQueryBuilder('log')
      .where('log.workspace_id = :workspaceId', { workspaceId });

    if (options?.startDate) {
      query = query.andWhere('log.requested_at >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options?.endDate) {
      query = query.andWhere('log.requested_at <= :endDate', {
        endDate: options.endDate,
      });
    }

    if (options?.provider) {
      query = query.andWhere('log.provider = :provider', {
        provider: options.provider,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return query.orderBy('log.requested_at', 'DESC').getMany();
  }

  async getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<any> {
    // TODO: Implement actual usage stats calculation
    return {};
  }

  async getApiKeyByProviderId(
    providerId: string,
    scope?: 'user' | 'workspace' | 'system',
  ): Promise<any> {
    if (scope === 'system') {
      const config = await this.configRepository.findOne({
        where: {
          providerId,
          ownerType: AiProviderOwnerType.SYSTEM,
          isActive: true,
        },
      });
      return config?.apiKey || null;
    }

    // For user/workspace, we might need to look into their respective entities
    // since they store configs in JSONB.
    if (scope === 'user') {
      const config = await this.userConfigRepository.findOne({
        where: { providerId, isActive: true },
      });
      return config?.config?.apiKey || null;
    }

    if (scope === 'workspace') {
      const config = await this.workspaceConfigRepository.findOne({
        where: { providerId, isActive: true },
      });
      return config?.config?.apiKey || null;
    }

    // Default: try system first
    const systemConfig = await this.configRepository.findOne({
      where: {
        providerId,
        ownerType: AiProviderOwnerType.SYSTEM,
        isActive: true,
      },
    });
    return systemConfig?.apiKey || null;
  }

  async getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]> {
    const entities = await this.workspaceConfigRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['provider'],
    });
    return entities
      .map((entity) => entity.provider)
      .filter(Boolean) as AiProvider[];
  }

  async getUserProviders(userId: string): Promise<AiProvider[]> {
    const entities = await this.userConfigRepository.find({
      where: { userId, isActive: true },
      relations: ['provider'],
    });
    return entities
      .map((entity) => entity.provider)
      .filter(Boolean) as AiProvider[];
  }

  async getConfigByProviderId(
    providerId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<any> {
    if (scope === 'user') {
      const entity = await this.userConfigRepository.findOne({
        where: { userId: scopeId, providerId, isActive: true },
        relations: ['provider'],
      });
      return entity ? UserAiProviderConfigMapper.toDomain(entity) : null;
    } else {
      const entity = await this.workspaceConfigRepository.findOne({
        where: { workspaceId: scopeId, providerId, isActive: true },
        relations: ['provider'],
      });
      return entity ? WorkspaceAiProviderConfigMapper.toDomain(entity) : null;
    }
  }

  // Usage logs
  async logUsage(data: {
    workspaceId: string;
    userId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost?: number;
  }): Promise<any> {
    const log = this.usageLogRepository.create({
      ...data,
      cost: data.cost ?? 0,
      requestedAt: new Date(),
    });
    return this.usageLogRepository.save(log);
  }
}
