import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Template } from '../../domain/template';

import {
  FilterTemplateDto,
  SortTemplateDto,
} from '../../dto/query-template.dto';

export abstract class TemplateRepository {
  abstract create(data: DeepPartial<Template>): Promise<Template>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTemplateDto | null;
    sortOptions?: SortTemplateDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[Template[], number]>;

  abstract findById(id: Template['id']): Promise<NullableType<Template>>;
  abstract findByIds(ids: Template['id'][]): Promise<Template[]>;
  abstract findByNameAndWorkspace(
    name: string,
    workspaceId: string,
  ): Promise<NullableType<Template>>;
  abstract findByWorkspace(workspaceId: string): Promise<Template[]>;
  abstract findByCreationTool(creationToolId: string): Promise<Template[]>;

  abstract update(
    id: Template['id'],
    payload: DeepPartial<Template>,
  ): Promise<Template | null>;

  abstract bulkUpdate(
    ids: Template['id'][],
    payload: DeepPartial<Template>,
  ): Promise<void>;

  abstract remove(id: Template['id']): Promise<void>;

  abstract bulkRemove(ids: Template['id'][]): Promise<void>;
}
