import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import { CreationJobsRepository } from './infrastructure/persistence/creation-jobs.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreationJob, CreationJobStatus } from './domain/creation-jobs';
import { NullableType } from '../utils/types/nullable.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_QUEUE } from '../execution/queue/execution-queue.module';

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CreationJobsService {
  constructor(
    @InjectQueue(JOB_QUEUE) private readonly jobQueue: Queue, // Renamed to avoid confusion, but simpler to use generic name
    private readonly creationJobsRepository: CreationJobsRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly auditService: AuditService,
    private readonly i18n: I18nService,
  ) { }

  async create(
    createDto: CreateCreationJobDto,
    userId?: string,
    workspaceId?: string,
  ): Promise<CreationJob> {
    const job = new CreationJob();
    job.status = CreationJobStatus.PENDING;
    job.creationToolId = createDto.creationToolId;
    job.inputData = createDto.inputData;
    job.outputData = null;
    job.progress = 0;
    job.createdBy = userId;
    job.workspaceId = workspaceId;

    const createdJob = await this.creationJobsRepository.create(job);

    // Activity Log - User started a job
    if (userId && workspaceId) {
      await this.auditService.log({
        userId,
        workspaceId,
        action: 'JOB_STARTED',
        resourceType: 'creation-job',
        resourceId: createdJob.id,
        details: { toolId: createDto.creationToolId },
      });
    }

    // Notify user about job creation
    if (userId) {
      this.notificationsGateway.emitNewNotification({
        userId,
        workspaceId,
        type: 'job_created',
        title: this.i18n.t('job.startedTitle'),
        message: this.i18n.t('job.startedMessage'),
        data: { jobId: createdJob.id },
      });
    }

    // Trigger async processing (Real Execution Engine)
    await this.jobQueue.add('execute-creation-job', {
      creationJob: createdJob,
    });

    return createdJob;
  }

  // processJob method removed

  findAllWithPagination({
    paginationOptions,
    workspaceId,
  }: {
    paginationOptions: IPaginationOptions;
    workspaceId: string;
  }) {
    return this.creationJobsRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      filterOptions: { workspaceId },
    });
  }

  findById(
    id: CreationJob['id'],
    workspaceId: string,
  ): Promise<NullableType<CreationJob>> {
    return this.creationJobsRepository.findById(id, workspaceId);
  }

  findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]> {
    return this.creationJobsRepository.findByIds(ids);
  }

  async update(
    id: CreationJob['id'],
    workspaceId: string,
    updateDto: UpdateCreationJobDto,
  ): Promise<CreationJob | null> {
    const updatedJob = await this.creationJobsRepository.update(
      id,
      workspaceId,
      updateDto,
    );

    if (updatedJob && updatedJob.createdBy) {
      // Emit socket event for real-time progress
      this.notificationsGateway.emitNewNotification({
        userId: updatedJob.createdBy,
        workspaceId: updatedJob.workspaceId,
        type: 'job_progress',
        title: this.i18n.t('job.updateTitle'),
        message: this.i18n.t('job.progressUpdate', {
          args: { progress: updatedJob.progress },
        }),
        data: {
          jobId: updatedJob.id,
          status: updatedJob.status,
          progress: updatedJob.progress,
          outputData: updatedJob.outputData,
          error: updatedJob.error,
        },
      });
    }

    return updatedJob;
  }

  remove(id: CreationJob['id'], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.remove(id, workspaceId);
  }

  removeMany(ids: CreationJob['id'][], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.removeMany(ids, workspaceId);
  }
}
