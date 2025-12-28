import { CreationJob } from '../../../../domain/creation-jobs';
import { CreationJobEntity } from '../entities/creation-jobs.entity';
import { CreationToolMapper } from '../../../../../creation-tools/infrastructure/persistence/relational/mappers/creation-tool.mapper';

export class CreationJobsMapper {
  static toDomain(raw: CreationJobEntity): CreationJob {
    const domainEntity = new CreationJob();
    domainEntity.id = raw.id;
    domainEntity.status = raw.status;
    domainEntity.creationToolId = raw.creationToolId;
    domainEntity.inputData = raw.inputData;
    domainEntity.outputData = raw.outputData;
    domainEntity.progress = raw.progress;
    domainEntity.createdBy = raw.createdBy;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.error = raw.error;

    domainEntity.updatedAt = raw.updatedAt;
    if (raw.creationTool) {
      domainEntity.creationTool = CreationToolMapper.toDomain(raw.creationTool);
    }
    return domainEntity;
  }

  static toPersistence(domainEntity: CreationJob): CreationJobEntity {
    const persistenceEntity = new CreationJobEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.creationToolId = domainEntity.creationToolId;
    persistenceEntity.inputData = domainEntity.inputData;
    persistenceEntity.outputData = domainEntity.outputData;
    persistenceEntity.progress = domainEntity.progress;
    persistenceEntity.createdBy = domainEntity.createdBy;
    persistenceEntity.workspaceId = domainEntity.workspaceId;

    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.error = domainEntity.error;

    return persistenceEntity;
  }
}
