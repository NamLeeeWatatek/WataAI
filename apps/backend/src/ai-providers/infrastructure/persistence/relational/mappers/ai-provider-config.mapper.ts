import { AiProviderConfig } from '../../../../domain/ai-provider';
import { AiProviderConfigEntity } from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';

export class AiProviderConfigMapper {
  static toDomain(raw: AiProviderConfigEntity): AiProviderConfig {
    const domainEntity = new AiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.providerId = raw.providerId;
    domainEntity.model = raw.model;
    domainEntity.apiKey = raw.apiKey;
    domainEntity.baseUrl = raw.baseUrl;
    domainEntity.apiVersion = raw.apiVersion;
    domainEntity.timeout = raw.timeout;
    domainEntity.useStream = raw.useStream;

    domainEntity.ownerType = raw.ownerType;
    domainEntity.ownerId = raw.ownerId;
    domainEntity.isDefault = raw.isDefault;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    if (raw.provider) {
      domainEntity.provider = AiProviderMapper.toDomain(raw.provider);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: AiProviderConfig): AiProviderConfigEntity {
    const persistenceEntity = new AiProviderConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.providerId = domainEntity.providerId;
    persistenceEntity.model = domainEntity.model;
    persistenceEntity.apiKey = domainEntity.apiKey;
    persistenceEntity.baseUrl = domainEntity.baseUrl;
    persistenceEntity.apiVersion = domainEntity.apiVersion;
    persistenceEntity.timeout = domainEntity.timeout;
    persistenceEntity.useStream = domainEntity.useStream;

    persistenceEntity.ownerType = domainEntity.ownerType;
    persistenceEntity.ownerId = domainEntity.ownerId;
    persistenceEntity.isDefault = domainEntity.isDefault;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
