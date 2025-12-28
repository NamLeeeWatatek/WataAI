import { GenerationJob } from '../../../../domain/generation-job';
import { GenerationJobEntity } from '../entities/generation-job.entity';

export class GenerationJobMapper {
  static toDomain(raw: GenerationJobEntity): GenerationJob {
    const domainEntity = new GenerationJob();
    domainEntity.id = raw.id;
    domainEntity.templateId = raw.templateId;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.userId = raw.userId;
    domainEntity.inputData = raw.inputData;
    domainEntity.outputData = raw.outputData;
    domainEntity.status = raw.status;
    domainEntity.error = raw.error;
    domainEntity.projectId = raw.projectId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    if (raw.template) {
      domainEntity.template = raw.template;
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: GenerationJob): GenerationJobEntity {
    const persistenceEntity = new GenerationJobEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.templateId = domainEntity.templateId;
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.userId = domainEntity.userId;
    persistenceEntity.inputData = domainEntity.inputData;
    persistenceEntity.outputData = domainEntity.outputData;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.error = domainEntity.error;
    persistenceEntity.projectId = domainEntity.projectId;

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
