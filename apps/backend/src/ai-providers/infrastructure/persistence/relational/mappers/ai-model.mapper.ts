import { AiModel } from '../../../../domain/ai-provider';
import { AiModelEntity } from '../entities/ai-model.entity';

export class AiModelMapper {
  static toDomain(raw: AiModelEntity): AiModel {
    const domain = new AiModel();
    domain.id = raw.id;
    domain.name = raw.name;
    domain.displayName = raw.displayName;
    domain.type = raw.type;
    domain.providerId = raw.providerId;
    domain.ownerType = raw.ownerType;
    domain.ownerId = raw.ownerId;
    domain.configId = raw.configId;
    domain.metadata = raw.metadata;
    domain.isActive = raw.isActive;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: AiModel): Partial<AiModelEntity> {
    return {
      id: domain.id,
      name: domain.name,
      displayName: domain.displayName,
      type: domain.type,
      providerId: domain.providerId,
      ownerType: domain.ownerType,
      ownerId: domain.ownerId,
      configId: domain.configId,
      metadata: domain.metadata,
      isActive: domain.isActive,
    };
  }
}
