import { Injectable } from '@nestjs/common';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';
import {
  AiProviderEntity,
  AiProviderConfigEntity,
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
  AiUsageLog,
  AiUsageStats,
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
    @InjectRepository(AiUsageLogEntity)
    private readonly usageLogRepository: Repository<AiUsageLogEntity>,
  ) {}

  // AiProvider operations
  async findAvailableProviders(): Promise<AiProvider[]> {
    const entities = await this.aiProviderRepository.find({
      where: { isActive: true },
      order: { label: 'ASC' },
      relations: ['configs'],
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
      config: Record<string, unknown>;
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

    // Convert to persistence entity using the mapper logic which sets ownerType=USER
    const persistenceModel = UserAiProviderConfigMapper.toPersistence(fullData);

    const newEntity = await this.configRepository.save(
      this.configRepository.create(persistenceModel),
    );
    return UserAiProviderConfigMapper.toDomain(newEntity);
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    const entities = await this.configRepository.find({
      where: {
        ownerType: AiProviderOwnerType.USER,
        ownerId: userId,
      },
      relations: ['provider', 'models'],
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
    const entity = await this.configRepository.findOne({
      where: {
        id,
        ownerType: AiProviderOwnerType.USER,
        ownerId: userId,
      },
      relations: ['provider', 'models'],
    });
    return entity ? UserAiProviderConfigMapper.toDomain(entity) : null;
  }

  async findUserConfigById(
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const entity = await this.configRepository.findOne({
      where: {
        id,
        ownerType: AiProviderOwnerType.USER,
      },
      relations: ['provider'],
    });
    return entity ? UserAiProviderConfigMapper.toDomain(entity) : null;
  }

  async updateUserConfig(
    userId: string,
    id: string,
    payload: DeepPartial<UserAiProviderConfig>,
  ): Promise<UserAiProviderConfig> {
    const entity = await this.configRepository.findOne({
      where: {
        id,
        ownerType: AiProviderOwnerType.USER,
        ownerId: userId,
      },
    });

    if (!entity) {
      throw new Error(`User config not found`);
    }

    // Convert existing entity to domain to merge payload
    const domainEntity = UserAiProviderConfigMapper.toDomain(entity);
    const updatedDomain = {
      ...domainEntity,
      ...payload,
    } as UserAiProviderConfig;
    const persistenceModel =
      UserAiProviderConfigMapper.toPersistence(updatedDomain);

    const updatedEntity = await this.configRepository.save(
      this.configRepository.create(persistenceModel),
    );

    return UserAiProviderConfigMapper.toDomain(updatedEntity);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    await this.configRepository.delete({
      id,
      ownerType: AiProviderOwnerType.USER,
      ownerId: userId,
    });
  }

  async verifyUserConfig(userId: string, id: string): Promise<boolean> {
    const config = await this.getUserConfig(userId, id);
    if (!config || !config.isActive) {
      return false;
    }

    const provider = config.provider;
    const decryptedConfig = config.config;

    if (!provider) {
      return false;
    }

    const hasRequiredFields = provider.requiredFields.every(
      (field) =>
        decryptedConfig[field] && decryptedConfig[field].toString().trim(),
    );

    if (!hasRequiredFields && provider.requiredFields.length === 0) {
      const hasApiKey =
        decryptedConfig.apiKey && (decryptedConfig.apiKey as string).trim();
      const hasBaseUrl =
        decryptedConfig.baseUrl && (decryptedConfig.baseUrl as string).trim();
      const hasSomeConfig = hasApiKey || hasBaseUrl;

      if (!hasSomeConfig) {
        return false;
      }
    } else if (!hasRequiredFields) {
      return false;
    }

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
      config: Record<string, unknown>;
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
    const newEntity = await this.configRepository.save(
      this.configRepository.create(persistenceModel),
    );
    return WorkspaceAiProviderConfigMapper.toDomain(newEntity);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const entities = await this.configRepository.find({
      where: {
        ownerType: AiProviderOwnerType.WORKSPACE,
        ownerId: workspaceId,
      },
      relations: ['provider', 'models'],
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
    const entity = await this.configRepository.findOne({
      where: {
        id,
        ownerType: AiProviderOwnerType.WORKSPACE,
        ownerId: workspaceId,
      },
      relations: ['provider', 'models'],
    });
    return entity ? WorkspaceAiProviderConfigMapper.toDomain(entity) : null;
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    payload: DeepPartial<WorkspaceAiProviderConfig>,
  ): Promise<WorkspaceAiProviderConfig> {
    const entity = await this.configRepository.findOne({
      where: {
        id,
        ownerType: AiProviderOwnerType.WORKSPACE,
        ownerId: workspaceId,
      },
    });

    if (!entity) {
      throw new Error(`Workspace config not found`);
    }

    const domainEntity = WorkspaceAiProviderConfigMapper.toDomain(entity);
    const updatedDomain = {
      ...domainEntity,
      ...payload,
    } as WorkspaceAiProviderConfig;
    const persistenceModel =
      WorkspaceAiProviderConfigMapper.toPersistence(updatedDomain);

    const updatedEntity = await this.configRepository.save(
      this.configRepository.create(persistenceModel),
    );

    return WorkspaceAiProviderConfigMapper.toDomain(updatedEntity);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    await this.configRepository.delete({
      id,
      ownerType: AiProviderOwnerType.WORKSPACE,
      ownerId: workspaceId,
    });
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
  ): Promise<AiUsageLog[]> {
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
  ): Promise<AiUsageStats> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const queryInfo = this.usageLogRepository
      .createQueryBuilder('log')
      .where('log.workspace_id = :workspaceId', { workspaceId })
      .andWhere('log.requested_at >= :startDate', { startDate });

    const totalStats = await queryInfo
      .select('SUM(log.input_tokens)', 'totalInputTokens')
      .addSelect('SUM(log.output_tokens)', 'totalOutputTokens')
      .addSelect('SUM(log.cost)', 'totalCost')
      .addSelect('COUNT(log.id)', 'totalRequests')
      .getRawOne();

    const providerStats = await this.usageLogRepository
      .createQueryBuilder('log')
      .where('log.workspace_id = :workspaceId', { workspaceId })
      .andWhere('log.requested_at >= :startDate', { startDate })
      .select('log.provider', 'provider')
      .addSelect('SUM(log.input_tokens)', 'inputTokens')
      .addSelect('SUM(log.output_tokens)', 'outputTokens')
      .addSelect('SUM(log.cost)', 'cost')
      .addSelect('COUNT(log.id)', 'requests')
      .groupBy('log.provider')
      .getRawMany();

    const modelStats = await this.usageLogRepository
      .createQueryBuilder('log')
      .where('log.workspace_id = :workspaceId', { workspaceId })
      .andWhere('log.requested_at >= :startDate', { startDate })
      .select('log.model', 'model')
      .addSelect('SUM(log.input_tokens)', 'inputTokens')
      .addSelect('SUM(log.output_tokens)', 'outputTokens')
      .addSelect('SUM(log.cost)', 'cost')
      .addSelect('COUNT(log.id)', 'requests')
      .groupBy('log.model')
      .getRawMany();

    const byProvider: Record<
      string,
      {
        inputTokens: number;
        outputTokens: number;
        cost: number;
        requests: number;
      }
    > = {};

    providerStats.forEach((p) => {
      byProvider[p.provider] = {
        inputTokens: Number(p.inputTokens || 0),
        outputTokens: Number(p.outputTokens || 0),
        cost: Number(p.cost || 0),
        requests: Number(p.requests || 0),
      };
    });

    const byModel: Record<
      string,
      {
        inputTokens: number;
        outputTokens: number;
        cost: number;
        requests: number;
      }
    > = {};

    modelStats.forEach((m) => {
      byModel[m.model] = {
        inputTokens: Number(m.inputTokens || 0),
        outputTokens: Number(m.outputTokens || 0),
        cost: Number(m.cost || 0),
        requests: Number(m.requests || 0),
      };
    });

    return {
      totalInputTokens: Number(totalStats.totalInputTokens || 0),
      totalOutputTokens: Number(totalStats.totalOutputTokens || 0),
      totalCost: Number(totalStats.totalCost || 0),
      totalRequests: Number(totalStats.totalRequests || 0),
      byProvider,
      byModel,
    };
  }

  async getApiKeyByProviderId(
    providerId: string,
    scope?: 'user' | 'workspace' | 'system',
  ): Promise<NullableType<string>> {
    let ownerType = AiProviderOwnerType.SYSTEM;
    // We don't have the ownerId here, so this is just a quick check for existence or system config.
    // If getting user/workspace config without ID, it's ambiguous. But we'll try to follow scope hint.

    if (scope === 'user') ownerType = AiProviderOwnerType.USER;
    if (scope === 'workspace') ownerType = AiProviderOwnerType.WORKSPACE;

    const config = await this.configRepository.findOne({
      where: {
        providerId,
        ownerType,
        isActive: true,
      },
      order: { createdAt: 'DESC' }, // Unsafe assumption but consistent with "first found"
    });

    return ((config?.config as any)?.apiKey as string) || null;
  }

  async getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]> {
    const entities = await this.configRepository.find({
      where: {
        ownerType: AiProviderOwnerType.WORKSPACE,
        ownerId: workspaceId,
        isActive: true,
      },
      relations: ['provider'],
    });
    return entities
      .map((entity) => entity.provider)
      .filter(Boolean) as AiProvider[];
  }

  async getUserProviders(userId: string): Promise<AiProvider[]> {
    const entities = await this.configRepository.find({
      where: {
        ownerType: AiProviderOwnerType.USER,
        ownerId: userId,
        isActive: true,
      },
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
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    const ownerType =
      scope === 'user'
        ? AiProviderOwnerType.USER
        : AiProviderOwnerType.WORKSPACE;

    const entity = await this.configRepository.findOne({
      where: {
        ownerType,
        ownerId: scopeId,
        providerId,
        isActive: true,
      },
      relations: ['provider', 'models'],
    });

    if (!entity) return null;

    if (scope === 'user') {
      return UserAiProviderConfigMapper.toDomain(entity);
    } else {
      return WorkspaceAiProviderConfigMapper.toDomain(entity);
    }
  }

  async getConfigById(
    id: string,
  ): Promise<NullableType<UserAiProviderConfig | WorkspaceAiProviderConfig>> {
    const entity = await this.configRepository.findOne({
      where: { id },
      relations: ['provider', 'models'],
    });

    if (!entity) return null;

    if (entity.ownerType === AiProviderOwnerType.USER) {
      return UserAiProviderConfigMapper.toDomain(entity);
    } else {
      return WorkspaceAiProviderConfigMapper.toDomain(entity);
    }
  }

  async logUsage(data: {
    workspaceId: string;
    userId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost?: number;
  }): Promise<AiUsageLog> {
    const log = this.usageLogRepository.create({
      ...data,
      cost: data.cost ?? 0,
      requestedAt: new Date(),
    });
    return this.usageLogRepository.save(log);
  }
}
