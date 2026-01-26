import { CreationJobPublication } from '../../../../domain/creation-job-publication';
import { CreationJobPublicationEntity } from '../entities/creation-job-publication.entity';

export class CreationJobPublicationMapper {
  static toDomain(raw: CreationJobPublicationEntity): CreationJobPublication {
    const domain = new CreationJobPublication();
    domain.id = raw.id;
    domain.jobId = raw.jobId;
    domain.channelId = raw.channelId;
    domain.platform = raw.platform;
    domain.status = raw.status;
    domain.externalId = raw.externalId;
    domain.url = raw.url;
    domain.metadata = raw.metadata;
    domain.error = raw.error;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(
    domain: CreationJobPublication,
  ): CreationJobPublicationEntity {
    const persistence = new CreationJobPublicationEntity();
    if (domain.id) {
      persistence.id = domain.id;
    }
    persistence.jobId = domain.jobId;
    persistence.channelId = domain.channelId;
    persistence.platform = domain.platform;
    persistence.status = domain.status;
    persistence.externalId = domain.externalId;
    persistence.url = domain.url;
    persistence.metadata = domain.metadata;
    persistence.error = domain.error;
    return persistence;
  }
}
