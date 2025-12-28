import { Character } from '../../../../domain/character';
import { CharacterEntity } from '../entities/character.entity';

export class CharacterMapper {
  static toDomain(raw: CharacterEntity): Character {
    const domainEntity = new Character();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.metadata = raw.metadata;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Character): CharacterEntity {
    const persistenceEntity = new CharacterEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.metadata = domainEntity.metadata;
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
