import {
  UserAiProviderConfig,
  AiProvider,
} from '../../../../domain/ai-provider';
import {
  AiProviderConfigEntity,
  AiProviderEntity,
} from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';
import { AiModelMapper } from './ai-model.mapper';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';

export class UserAiProviderConfigMapper {
  static toDomain(raw: AiProviderConfigEntity): UserAiProviderConfig {
    const domainEntity = new UserAiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.ownerId!;
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
    domainEntity: UserAiProviderConfig,
  ): AiProviderConfigEntity {
    const persistenceEntity = new AiProviderConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.ownerType = AiProviderOwnerType.USER;
    persistenceEntity.ownerId = domainEntity.userId;
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

export class AiProviderConfigMapper {
  static toDomain(raw: AiProviderConfigEntity): UserAiProviderConfig {
    return UserAiProviderConfigMapper.toDomain(raw);
  }

  static toPersistence(
    domainEntity: UserAiProviderConfig,
  ): AiProviderConfigEntity {
    return UserAiProviderConfigMapper.toPersistence(domainEntity);
  }
}
