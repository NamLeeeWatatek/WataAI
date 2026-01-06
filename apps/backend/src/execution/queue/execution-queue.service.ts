import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_QUEUE } from './execution-queue.constants';
import { CreationJob } from '../../creation-jobs/domain/creation-jobs';
import { GenerationJob } from '../../generation-jobs/domain/generation-job';

@Injectable()
export class ExecutionQueueService {
  private readonly logger = new Logger(ExecutionQueueService.name);

  constructor(
    @InjectQueue(JOB_QUEUE)
    private readonly queue: Queue,
  ) {}

  /**
   * Add a creation job to the execution queue
   */
  async addCreationJob(creationJob: CreationJob): Promise<void> {
    try {
      await this.queue.add(
        'execute-creation-job',
        { creationJob },
        {
          jobId: creationJob.id,
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
      this.logger.debug(`[Execution] Creation Job ${creationJob.id} queued`);
    } catch (error) {
      this.logger.error(
        `Failed to queue creation job ${creationJob.id}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Remove a creation job from the execution queue
   */
  async removeCreationJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.debug(
          `[Execution] Creation Job ${jobId} removed from queue`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to remove creation job ${jobId} from queue: ${error.message}`,
      );
    }
  }

  /**
   * Add a generation job to the execution queue
   */
  async addGenerationJob(generationJob: GenerationJob): Promise<void> {
    try {
      await this.queue.add(
        'execute-generation-job',
        { generationJob },
        {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.debug(
        `[Execution] Generation Job ${generationJob.id} queued`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue generation job ${generationJob.id}:`,
        error.message,
      );
      throw error;
    }
  }
}
