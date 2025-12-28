import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { GenerationJob } from '../../domain/generation-job';

export abstract class GenerationJobRepository {
  abstract create(
    data: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<GenerationJob>;

  abstract findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<GenerationJob[]>;

  abstract findById(
    id: GenerationJob['id'],
  ): Promise<NullableType<GenerationJob>>;

  abstract update(
    id: GenerationJob['id'],
    payload: DeepPartial<GenerationJob>,
  ): Promise<GenerationJob | null>;

  abstract remove(id: GenerationJob['id']): Promise<void>;
}
