import { FileType } from '../../../../domain/file';
import { FileEntity } from '../entities/file.entity';

export class FileMapper {
  static toDomain(raw: FileEntity): FileType {
    const domainEntity = new FileType();
    domainEntity.id = raw.id;
    domainEntity.path = raw.path;
    domainEntity.bucket = raw.bucket;
    domainEntity.originalName = raw.originalName;
    domainEntity.size = raw.size;
    domainEntity.mimeType = raw.mimeType;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdBy = raw.createdBy;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.isTemp = raw.isTemp;
    return domainEntity;
  }

  static toPersistence(domainEntity: FileType): FileEntity {
    const persistenceEntity = new FileEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.path = domainEntity.path;
    persistenceEntity.bucket = domainEntity.bucket;
    persistenceEntity.originalName = domainEntity.originalName;
    persistenceEntity.size = domainEntity.size;
    persistenceEntity.mimeType = domainEntity.mimeType;
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.createdBy = domainEntity.createdBy;
    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.isTemp !== undefined) {
      persistenceEntity.isTemp = domainEntity.isTemp;
    }
    return persistenceEntity;
  }
}
