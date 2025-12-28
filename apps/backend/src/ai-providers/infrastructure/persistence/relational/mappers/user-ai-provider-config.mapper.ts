import {
  UserAiProviderConfig,
  AiProvider,
} from '../../../../domain/ai-provider';
import {
  UserAiProviderConfigEntity,
  AiProviderEntity,
} from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';

export class UserAiProviderConfigMapper {
  static toDomain(raw: UserAiProviderConfigEntity): UserAiProviderConfig {
    const domainEntity = new UserAiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
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
    domainEntity: UserAiProviderConfig,
  ): UserAiProviderConfigEntity {
    const persistenceEntity = new UserAiProviderConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.userId = domainEntity.userId;
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
  static toDomain(raw: UserAiProviderConfigEntity): UserAiProviderConfig {
    return UserAiProviderConfigMapper.toDomain(raw);
  }

  static toPersistence(
    domainEntity: UserAiProviderConfig,
  ): UserAiProviderConfigEntity {
    return UserAiProviderConfigMapper.toPersistence(domainEntity);
  }
}
