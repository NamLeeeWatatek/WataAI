import { Category } from '../../../../domain/category';
import { CategoryEntity } from '../entities/category.entity';

export class CategoryMapper {
  static toDomain(raw: CategoryEntity): Category {
    const category = new Category();
    category.id = raw.id;
    category.name = raw.name;
    category.slug = raw.slug;
    category.description = raw.description;
    category.icon = raw.icon;
    category.type = raw.type || 'system';
    category.createdAt = raw.createdAt;
    category.updatedAt = raw.updatedAt;
    category.deletedAt = raw.deletedAt;
    return category;
  }

  static toPersistence(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    if (category.id && typeof category.id === 'string') {
      entity.id = category.id;
    }
    entity.name = category.name;
    entity.slug = category.slug;
    entity.description = category.description;
    entity.icon = category.icon;
    entity.type = category.type || 'system';
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;
    entity.deletedAt = category.deletedAt;
    return entity;
  }
}
