import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Project } from '../../domain/project';

export abstract class ProjectRepository {
  abstract create(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Project>;

  abstract findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]>;

  abstract findById(id: Project['id']): Promise<NullableType<Project>>;

  abstract update(
    id: Project['id'],
    payload: DeepPartial<Project>,
  ): Promise<Project | null>;

  abstract remove(id: Project['id']): Promise<void>;
}
