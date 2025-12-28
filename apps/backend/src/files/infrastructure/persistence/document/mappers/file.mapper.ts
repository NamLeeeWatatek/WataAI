import { FileType } from '../../../../domain/file';
import { FileSchemaClass } from '../entities/file.schema';

export class FileMapper {
  static toDomain(raw: FileSchemaClass): FileType {
    const domainEntity = new FileType();
    domainEntity.id = raw._id.toString();
    domainEntity.path = raw.path;
    domainEntity.bucket = raw.bucket;
    domainEntity.isTemp = (raw as any).isTemp;
    return domainEntity;
  }
  static toPersistence(domainEntity: FileType): FileSchemaClass {
    const persistenceSchema = new FileSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.path = domainEntity.path;
    persistenceSchema.bucket = domainEntity.bucket;
    (persistenceSchema as any).isTemp = domainEntity.isTemp;
    return persistenceSchema;
  }
}
