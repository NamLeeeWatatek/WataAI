import { AiProviderConfig } from '../../../../domain/ai-provider';
import { AiProviderConfigEntity } from '../entities/ai-provider.entity';
import { AiProviderMapper } from './ai-provider.mapper';

export class AiProviderConfigMapper {
  static toDomain(raw: AiProviderConfigEntity): AiProviderConfig {
    const domainEntity = new AiProviderConfig();
    domainEntity.id = raw.id;
    domainEntity.providerId = raw.providerId;

    // Map config fields from the JSONB column
    const config = raw.config || {};
    domainEntity.model = config.model as string;
    domainEntity.apiKey = config.apiKey as string;
    domainEntity.baseUrl = (config.baseUrl || config.baseURL) as string;
    domainEntity.apiVersion = config.apiVersion as string;
    domainEntity.timeout = config.timeout as number;
    domainEntity.useStream = config.useStream as boolean;

    // domainEntity.config and .modelList do not exist on AiProviderConfig

    domainEntity.ownerType = raw.ownerType;
    domainEntity.ownerId = raw.ownerId || '';
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

    // Construct config JSONB object
    const config: Record<string, any> = {};
    if (domainEntity.apiKey) config.apiKey = domainEntity.apiKey;
    if (domainEntity.baseUrl) config.baseUrl = domainEntity.baseUrl;
    if (domainEntity.apiVersion) config.apiVersion = domainEntity.apiVersion;
    if (domainEntity.timeout) config.timeout = domainEntity.timeout;
    if (domainEntity.useStream) config.useStream = domainEntity.useStream;
    // Note: model is often not stored in config but passed dynamically, or in modelList
    // But if we want to persist a default model selection:
    if (domainEntity.model) config.model = domainEntity.model;

    persistenceEntity.config = config;
    persistenceEntity.modelList = []; // AiProviderConfig doesn't have modelList

    persistenceEntity.ownerType = domainEntity.ownerType;
    persistenceEntity.ownerId = domainEntity.ownerId;
    persistenceEntity.isDefault = domainEntity.isDefault;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
