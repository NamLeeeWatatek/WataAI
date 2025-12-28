import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { CreationTool } from '../../domain/creation-tool';
import {
  FilterCreationToolDto,
  SortCreationToolDto,
} from '../../dto/query-creation-tool.dto';

export abstract class CreationToolRepository {
  abstract create(data: DeepPartial<CreationTool>): Promise<CreationTool>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCreationToolDto | null;
    sortOptions?: SortCreationToolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[CreationTool[], number]>;

  abstract findAll(filters?: {
    isActive?: boolean;
    workspaceId?: string;
  }): Promise<CreationTool[]>;

  abstract findById(
    id: CreationTool['id'],
  ): Promise<NullableType<CreationTool>>;

  abstract findBySlug(slug: string): Promise<NullableType<CreationTool>>;

  abstract findByWorkspace(workspaceId: string): Promise<CreationTool[]>;

  abstract update(
    id: CreationTool['id'],
    payload: DeepPartial<CreationTool>,
  ): Promise<CreationTool | null>;

  abstract remove(id: CreationTool['id']): Promise<void>;
}
