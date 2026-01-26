import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { CreationJob } from '../../domain/creation-jobs';

export abstract class CreationJobsRepository {
  abstract create(
    data: Omit<CreationJob, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CreationJob>;

  abstract findAllWithPagination({
    paginationOptions,
    filterOptions,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions: {
      workspaceId: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      status?: string[];
    };
  }): Promise<{ data: CreationJob[]; count: number }>;

  abstract findById(
    id: CreationJob['id'],
    workspaceId: string,
  ): Promise<NullableType<CreationJob>>;

  abstract findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]>;

  abstract update(
    id: CreationJob['id'],
    workspaceId: string,
    payload: DeepPartial<CreationJob>,
  ): Promise<CreationJob | null>;

  abstract remove(id: CreationJob['id'], workspaceId: string): Promise<void>;

  abstract removeMany(
    ids: CreationJob['id'][],
    workspaceId: string,
  ): Promise<void>;

  abstract createPublication(
    data: Omit<
      import('../../domain/creation-job-publication').CreationJobPublication,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<
    import('../../domain/creation-job-publication').CreationJobPublication
  >;

  abstract findPublicationsByJobId(
    jobId: string,
  ): Promise<
    import('../../domain/creation-job-publication').CreationJobPublication[]
  >;
}
