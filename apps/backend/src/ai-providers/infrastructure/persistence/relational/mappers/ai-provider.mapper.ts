import { AiProvider } from '../../../../domain/ai-provider';
import { AiProviderEntity } from '../entities/ai-provider.entity';

export class AiProviderMapper {
  static toDomain(raw: AiProviderEntity): AiProvider {
    const domainEntity = new AiProvider();
    domainEntity.id = raw.id;
    domainEntity.key = raw.key;
    domainEntity.label = raw.label;
    domainEntity.icon = raw.icon;
    domainEntity.description = raw.description;
    domainEntity.requiredFields = raw.requiredFields;
    domainEntity.optionalFields = raw.optionalFields;
    domainEntity.defaultValues = raw.defaultValues;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: AiProvider): AiProviderEntity {
    const persistenceEntity = new AiProviderEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.key = domainEntity.key;
    persistenceEntity.label = domainEntity.label;
    persistenceEntity.icon = domainEntity.icon;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.requiredFields = domainEntity.requiredFields;
    persistenceEntity.optionalFields = domainEntity.optionalFields;
    persistenceEntity.defaultValues = domainEntity.defaultValues;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
