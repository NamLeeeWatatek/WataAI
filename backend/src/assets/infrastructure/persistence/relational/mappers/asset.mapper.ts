import { Asset } from '../../../../domain/asset';
import { AssetEntity } from '../entities/asset.entity';

export class AssetMapper {
  static toDomain(raw: AssetEntity): Asset {
    const domainEntity = new Asset();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.type = raw.type;
    domainEntity.url = raw.url;
    domainEntity.fileId = raw.fileId;
    domainEntity.jobId = raw.jobId;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdBy = raw.createdBy;
    domainEntity.metadata = raw.metadata;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Asset): AssetEntity {
    const persistenceEntity = new AssetEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.url = domainEntity.url;
    persistenceEntity.fileId = domainEntity.fileId;
    persistenceEntity.jobId = domainEntity.jobId;
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.createdBy = domainEntity.createdBy;
    persistenceEntity.metadata = domainEntity.metadata;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
