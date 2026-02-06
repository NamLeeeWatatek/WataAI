import { CreationTool } from '../../../../domain/creation-tool';
import { CreationToolEntity } from '../entities/creation-tool.entity';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';

export class CreationToolMapper {
  static toDomain(raw: CreationToolEntity): CreationTool {
    const domainEntity = new CreationTool();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.slug = raw.slug;
    domainEntity.description = raw.description;
    domainEntity.icon = raw.icon;
    domainEntity.coverImage = raw.coverImage;
    if (raw.categories) {
      domainEntity.categories = raw.categories.map((c) =>
        CategoryMapper.toDomain(c),
      );
    }
    domainEntity.formConfig = raw.formConfig;
    domainEntity.executionFlow = raw.executionFlow;
    domainEntity.actions = raw.actions;
    domainEntity.isActive = raw.isActive;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.knowledgeBaseId = raw.knowledgeBaseId;
    domainEntity.sortOrder = raw.sortOrder;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: CreationTool): CreationToolEntity {
    const persistenceEntity = new CreationToolEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.slug = domainEntity.slug;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.icon = domainEntity.icon;
    persistenceEntity.coverImage = domainEntity.coverImage;
    if (domainEntity.categories) {
      persistenceEntity.categories = domainEntity.categories.map((c) =>
        CategoryMapper.toPersistence(c),
      );
    }
    persistenceEntity.formConfig = domainEntity.formConfig;
    persistenceEntity.executionFlow = domainEntity.executionFlow;
    persistenceEntity.actions = domainEntity.actions;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.workspaceId = domainEntity.workspaceId ?? undefined;
    persistenceEntity.knowledgeBaseId =
      domainEntity.knowledgeBaseId ?? undefined;
    persistenceEntity.sortOrder = domainEntity.sortOrder;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
