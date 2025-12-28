import { WorkspaceAiProviderConfig } from '../../../../domain/ai-provider';
import { WorkspaceAiProviderConfigEntity } from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';

export class WorkspaceAiProviderConfigMapper {
  static toDomain(
    raw: WorkspaceAiProviderConfigEntity,
  ): WorkspaceAiProviderConfig {
    const domainEntity = new WorkspaceAiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.providerId = raw.providerId;
    domainEntity.displayName = raw.displayName;
    domainEntity.config = raw.config;
    domainEntity.modelList = raw.modelList;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    if (raw.provider) {
      domainEntity.provider = AiProviderMapper.toDomain(raw.provider);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: WorkspaceAiProviderConfig,
  ): WorkspaceAiProviderConfigEntity {
    const persistenceEntity = new WorkspaceAiProviderConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.providerId = domainEntity.providerId;
    persistenceEntity.displayName = domainEntity.displayName;
    persistenceEntity.config = domainEntity.config;
    persistenceEntity.modelList = domainEntity.modelList;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
