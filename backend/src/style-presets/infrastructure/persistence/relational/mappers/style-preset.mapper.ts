import { StylePreset } from '../../../../domain/style-preset';
import { StylePresetEntity } from '../entities/style-preset.entity';

export class StylePresetMapper {
  static toDomain(raw: StylePresetEntity): StylePreset {
    const domainEntity = new StylePreset();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.config = raw.config;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: StylePreset): StylePresetEntity {
    const persistenceEntity = new StylePresetEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.config = domainEntity.config;
    persistenceEntity.workspaceId = domainEntity.workspaceId;

    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
      persistenceEntity.updatedAt = domainEntity.updatedAt;
    }
    if (domainEntity.deletedAt) {
      persistenceEntity.deletedAt = domainEntity.deletedAt;
    }

    return persistenceEntity;
  }
}
