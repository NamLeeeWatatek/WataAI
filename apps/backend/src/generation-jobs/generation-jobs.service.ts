import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { GenerationJobRepository } from './infrastructure/persistence/generation-job.repository';
import { GenerationJob } from './domain/generation-job';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { DeepPartial } from '../utils/types/deep-partial.type';
import { ExecutionQueueService } from '../execution/queue/execution-queue.service';

@Injectable()
export class GenerationJobsService {
  constructor(
    private readonly generationJobRepository: GenerationJobRepository,
    private readonly executionQueueService: ExecutionQueueService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    data: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<GenerationJob> {
    const job = await this.generationJobRepository.create(data);

    // Push to Queue (Fire and forget, or await if critical)
    await this.executionQueueService.addGenerationJob(job);

    return job;
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<GenerationJob[]> {
    return this.generationJobRepository.findManyWithPagination({
      workspaceId,
      paginationOptions,
    });
  }

  async findById(
    id: GenerationJob['id'],
  ): Promise<NullableType<GenerationJob>> {
    return this.generationJobRepository.findById(id);
  }

  async update(
    id: GenerationJob['id'],
    payload: DeepPartial<GenerationJob>,
  ): Promise<GenerationJob | null> {
    const job = await this.generationJobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', {
          args: { resource: 'Generation job' },
        }),
      );
    }
    return this.generationJobRepository.update(id, payload);
  }

  async remove(id: GenerationJob['id']): Promise<void> {
    await this.generationJobRepository.remove(id);
  }
}
