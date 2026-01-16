import { WorkspaceAiProviderConfig } from '../../../../domain/ai-provider';
import { AiProviderConfigEntity } from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';
import { AiModelMapper } from './ai-model.mapper';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';

export class WorkspaceAiProviderConfigMapper {
  static toDomain(raw: AiProviderConfigEntity): WorkspaceAiProviderConfig {
    const domainEntity = new WorkspaceAiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.workspaceId = raw.ownerId!;
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

    if (raw.models) {
      domainEntity.models = raw.models.map((m) => AiModelMapper.toDomain(m));
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: WorkspaceAiProviderConfig,
  ): AiProviderConfigEntity {
    const persistenceEntity = new AiProviderConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.ownerType = AiProviderOwnerType.WORKSPACE;
    persistenceEntity.ownerId = domainEntity.workspaceId;
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
