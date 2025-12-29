import { Template } from '../../../../domain/template';
import { TemplateEntity } from '../entities/template.entity';
import { CreationToolMapper } from '../../../../../creation-tools/infrastructure/persistence/relational/mappers/creation-tool.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';

export class TemplateMapper {
  static toDomain(raw: TemplateEntity): Template {
    const domainEntity = new Template();
    domainEntity.id = raw.id;
    domainEntity.creationToolId = raw.creationToolId;
    if (raw.creationTool) {
      domainEntity.creationTool = CreationToolMapper.toDomain(raw.creationTool);
    }
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.prefilledData = raw.prefilledData;
    domainEntity.thumbnailUrl = raw.thumbnailUrl;
    domainEntity.icon = raw.icon;
    domainEntity.executionOverrides = raw.executionOverrides;
    domainEntity.prompt = raw.prompt;
    domainEntity.mediaFiles = raw.mediaFiles;
    domainEntity.styleConfig = raw.styleConfig;
    if (raw.category) {
      domainEntity.category = CategoryMapper.toDomain(raw.category);
    }
    domainEntity.isActive = raw.isActive;
    domainEntity.createdBy = raw.createdBy;
    domainEntity.workspaceId = raw.workspaceId;
    domainEntity.promptTemplate = raw.promptTemplate;
    domainEntity.executionConfig = raw.executionConfig;
    domainEntity.formSchema = raw.formSchema;
    domainEntity.inputSchema = raw.inputSchema;
    domainEntity.sortOrder = raw.sortOrder;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Template): TemplateEntity {
    const persistenceEntity = new TemplateEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.creationToolId = domainEntity.creationToolId;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description;
    persistenceEntity.prefilledData = domainEntity.prefilledData;
    persistenceEntity.thumbnailUrl = domainEntity.thumbnailUrl;
    persistenceEntity.icon = domainEntity.icon;
    persistenceEntity.executionOverrides = domainEntity.executionOverrides;
    persistenceEntity.prompt = domainEntity.prompt;
    persistenceEntity.mediaFiles = domainEntity.mediaFiles;
    persistenceEntity.styleConfig = domainEntity.styleConfig;
    if (domainEntity.category) {
      persistenceEntity.category = CategoryMapper.toPersistence(
        domainEntity.category,
      );
    }
    persistenceEntity.isActive = domainEntity.isActive ?? true;
    persistenceEntity.createdBy = domainEntity.createdBy;
    persistenceEntity.workspaceId = domainEntity.workspaceId;
    persistenceEntity.promptTemplate = domainEntity.promptTemplate;
    persistenceEntity.executionConfig = domainEntity.executionConfig;
    persistenceEntity.formSchema = domainEntity.formSchema;
    persistenceEntity.inputSchema = domainEntity.inputSchema;
    persistenceEntity.sortOrder = domainEntity.sortOrder ?? 0;

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
