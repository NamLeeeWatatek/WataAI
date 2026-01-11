import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import { CreationJobsRepository } from './infrastructure/persistence/creation-jobs.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreationJob, CreationJobStatus } from './domain/creation-jobs';
import { NullableType } from '../utils/types/nullable.type';
import { ExecutionQueueService } from '../execution/queue/execution-queue.service';
import { CreationToolsService } from '../creation-tools/creation-tools.service';

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CreationJobsService {
  constructor(
    private readonly executionQueueService: ExecutionQueueService,
    private readonly creationJobsRepository: CreationJobsRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly auditService: AuditService,
    private readonly i18n: I18nService,
    private readonly eventEmitter: EventEmitter2,
    private readonly creationToolsService: CreationToolsService,
  ) {}

  async create(
    createDto: CreateCreationJobDto,
    userId?: string,
    workspaceId?: string,
  ): Promise<CreationJob> {
    // Validate Input against Tool Config
    const tool = await this.creationToolsService.findById(
      createDto.creationToolId,
    );
    if (!tool) {
      throw new NotFoundException(
        `Creation Tool with ID ${createDto.creationToolId} not found`,
      );
    }

    if (tool.formConfig && Array.isArray(tool.formConfig.fields)) {
      for (const field of tool.formConfig.fields) {
        // Handle case where field might be polymorphically typed as any
        const fieldName = (field as any).name || (field as any).key;
        // Defensively check for required flags in all possible locations
        const isRequired = !!(
          (field as any).required === true ||
          (field as any).required === 'true' ||
          (field as any).isRequired === true ||
          (field as any).isRequired === 'true' ||
          (field as any).validation?.required === true ||
          (field as any).validation?.required === 'true' ||
          (field as any).is_required === true ||
          (field as any).mandatory === true
        );

        if (isRequired) {
          const val = createDto.inputData[fieldName];
          if (
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '')
          ) {
            throw new BadRequestException(
              `Field '${(field as any).displayName || (field as any).label || fieldName}' is required`,
            );
          }
        }
      }
    }

    const job = new CreationJob();
    job.status = CreationJobStatus.PENDING;
    job.creationToolId = createDto.creationToolId;
    job.inputData = createDto.inputData;
    job.outputData = undefined;
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
    await this.executionQueueService.addCreationJob(createdJob);

    return createdJob;
  }

  // processJob method removed

  findAllWithPagination({
    paginationOptions,
    filterOptions,
    workspaceId,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions?: {
      startDate?: string;
      endDate?: string;
      search?: string;
      status?: string[];
    };
    workspaceId: string;
  }) {
    return this.creationJobsRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      filterOptions: {
        workspaceId,
        startDate: filterOptions?.startDate,
        endDate: filterOptions?.endDate,
        search: filterOptions?.search,
        status: filterOptions?.status,
      },
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
      // Only emit if NOT completed/failed, because those are handled by the 'success/error' persistence listener
      // This prevents "Double Notification" spam for completion.
      const isFinalStatus = [
        CreationJobStatus.COMPLETED,
        CreationJobStatus.FAILED,
      ].includes(updatedJob.status);

      if (!isFinalStatus) {
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
    }

    return updatedJob;
  }

  async cancel(id: CreationJob['id'], workspaceId: string): Promise<void> {
    const job = await this.creationJobsRepository.findById(id, workspaceId);

    if (!job) {
      throw new Error(`Job with ID ${id} not found or invalid`);
    }

    if (
      job.status === CreationJobStatus.COMPLETED ||
      job.status === CreationJobStatus.FAILED ||
      job.status === CreationJobStatus.CANCELED
    ) {
      // Already finished, do nothing
      return;
    }

    // Attempt to remove from queue
    if (job.status === CreationJobStatus.PENDING) {
      await this.executionQueueService.removeCreationJob(id);
    }

    // Update status to CANCELED
    await this.update(id, workspaceId, {
      status: CreationJobStatus.CANCELED,
      error: 'Job canceled by user',
    });

    await this.auditService.log({
      userId: job.createdBy || 'unknown',
      workspaceId,
      action: 'JOB_CANCELED',
      resourceType: 'creation-job',
      resourceId: id,
      details: { toolId: job.creationToolId },
    });
  }

  remove(id: CreationJob['id'], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.remove(id, workspaceId);
  }

  removeMany(ids: CreationJob['id'][], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.removeMany(ids, workspaceId);
  }

  async completeJob(
    id: string,
    resultData?: Record<string, any>,
    status: CreationJobStatus = CreationJobStatus.COMPLETED,
    error?: string,
  ): Promise<void> {
    const jobs = await this.findByIds([id]);
    const job = jobs[0];

    if (!job || !job.workspaceId) {
      throw new Error(`Job with ID ${id} not found or invalid`);
    }

    await this.update(job.id, job.workspaceId, {
      status,
      outputData: resultData,
      error,
      progress: status === CreationJobStatus.COMPLETED ? 100 : job.progress,
    });

    if (status === CreationJobStatus.COMPLETED) {
      this.eventEmitter.emit('creation-job.completed', {
        id: job.id,
        userId: job.createdBy,
        workspaceId: job.workspaceId,
        inputData: job.inputData,
      });
    } else if (status === CreationJobStatus.FAILED) {
      this.eventEmitter.emit('creation-job.failed', {
        id: job.id,
        userId: job.createdBy,
        workspaceId: job.workspaceId,
        error: error,
      });
    }
  }
}
