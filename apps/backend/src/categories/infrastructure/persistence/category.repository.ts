import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Category } from '../../domain/category';

export abstract class CategoryRepository {
  abstract create(
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Category>;

  abstract findAllWithPagination(
    paginationOptions: IPaginationOptions & { type?: string; search?: string },
  ): Promise<[Category[], number]>;

  abstract findById(id: Category['id']): Promise<NullableType<Category>>;

  abstract findBySlug(slug: Category['slug']): Promise<NullableType<Category>>;

  abstract update(
    id: Category['id'],
    payload: DeepPartial<Category>,
  ): Promise<Category | null>;

  abstract remove(id: Category['id']): Promise<void>;
}
