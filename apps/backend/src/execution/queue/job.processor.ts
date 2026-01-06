import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { JOB_QUEUE } from './execution-queue.constants';
import { CreationToolsService } from '../../creation-tools/creation-tools.service';
import { ExecutionStrategyResolver } from '../execution-strategy.resolver';
import { ExecutionFlow } from '../../creation-tools/domain/creation-tool';
import { GenerationJob } from '../../generation-jobs/domain/generation-job';
import {
  CreationJob,
  CreationJobStatus,
} from '../../creation-jobs/domain/creation-jobs';
import { ExecutionValidationService } from '../validation/execution-validation.service';
import { CreationJobsService } from '../../creation-jobs/creation-jobs.service';

import { OnModuleInit } from '@nestjs/common';

@Processor(JOB_QUEUE, {
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '50', 10),
})
export class JobProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    private readonly creationToolsService: CreationToolsService,
    private readonly validationService: ExecutionValidationService,
    private readonly strategyResolver: ExecutionStrategyResolver,
    private readonly creationJobsService: CreationJobsService,
  ) {
    super();
  }

  onModuleInit() {
    this.logger.log(`JobProcessor initialized for queue: ${JOB_QUEUE}`);
    this.logger.log('Worker is ready to process jobs.');
  }

  async process(
    job: Job<{ generationJob?: GenerationJob; creationJob?: CreationJob }>,
  ): Promise<any> {
    const jobEntity = job.data.creationJob || job.data.generationJob;

    if (!jobEntity) {
      throw new Error('Job data missing creationJob or generationJob');
    }

    this.logger.log(`Processing Job ID: ${jobEntity.id}`);
    this.logger.debug(`Raw Input Data: ${JSON.stringify(jobEntity.inputData)}`);

    try {
      // Update Status to PROCESSING
      if (job.data.creationJob && jobEntity.workspaceId) {
        await this.creationJobsService.update(
          jobEntity.id,
          jobEntity.workspaceId,
          {
            status: CreationJobStatus.PROCESSING,
            progress: 10,
          },
        );
      }

      if (!jobEntity.creationToolId) {
        throw new Error('Missing Creation Tool ID');
      }

      // 1. Fetch Tool Configuration
      const tool = await this.creationToolsService.findById(
        jobEntity.creationToolId,
      );
      if (!tool) {
        throw new Error(`Creation Tool not found: ${jobEntity.creationToolId}`);
      }

      // 1.5 Validate Inputs
      let validatedInputs = jobEntity.inputData;
      try {
        validatedInputs = this.validationService.validateInputs(
          tool.formConfig,
          jobEntity.inputData,
        );
      } catch (validationError) {
        this.logger.error(
          `Validation Failed for Job ${jobEntity.id}: ${validationError.message}`,
        );
        throw new Error(`Input Validation Failed: ${validationError.message}`);
      }

      const executionInputs = this.validationService.prepareInputs(
        tool.formConfig,
        validatedInputs,
      );

      const config = tool.executionFlow as ExecutionFlow;
      const startTime = Date.now();
      const apiUrl =
        process.env.BACKEND_DOMAIN ||
        process.env.API_URL;
      const systemInputs = {
        ...executionInputs,
        _jobId: jobEntity.id,
        _callbackUrl: `${apiUrl}/api/v1/callbacks/jobs/${jobEntity.id}/complete`,
        _workspaceId: jobEntity.workspaceId,
      };

      this.logger.log(
        `Dispatching execution via Strategy Resolver for type: ${config.type}`,
      );
      const strategy = this.strategyResolver.resolve(config.type);
      const result = await strategy.execute(config, systemInputs, {
        workspaceId: jobEntity.workspaceId,
        userId: 'createdBy' in jobEntity ? jobEntity.createdBy : undefined,
      });

      // UX Improvement: Enforce minimum execution time of 2 seconds
      // This ensures the "Processing" state is visible to the user and feels more realistic
      // even for synchronous webhooks that return instantly.
      const executionTime = Date.now() - startTime;
      const minExecutionTime = 2000; // 2 seconds
      if (executionTime < minExecutionTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minExecutionTime - executionTime),
        );
      }

      // Check for Async Pattern
      // If true, we do NOT complete the job here. We rely on external callback.
      if ((config as any).asyncPattern) {
        this.logger.log(
          `Job ${jobEntity.id} dispatched successfully. Waiting for external callback (Async Pattern).`,
        );

        const apiUrl =
          process.env.BACKEND_DOMAIN ||
          process.env.API_URL
        this.logger.warn(
          `Job is waiting for callback. To complete, external tool must POST to: ${apiUrl}/v1/callbacks/jobs/${jobEntity.id}/complete`,
        );
        this.logger.warn(
          `If running locally, ensure n8n can reach your localhost (e.g. via ngrok) or DISABLE asyncPattern in tool config.`,
        );

        return result; // Job in queue is "Done", but DB status remains PROCESSING
      }

      // Update Status to COMPLETED
      if (job.data.creationJob && jobEntity.workspaceId) {
        await this.creationJobsService.update(
          jobEntity.id,
          jobEntity.workspaceId,
          {
            status: CreationJobStatus.COMPLETED,
            progress: 100,
            outputData: result,
          },
        );
      }

      this.logger.log(`Job ${jobEntity.id} Completed Successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Job ${jobEntity.id} Failed: ${error.message}`,
        error.stack,
      );

      // Update Status to FAILED
      if (job.data.creationJob && jobEntity.workspaceId) {
        await this.creationJobsService.update(
          jobEntity.id,
          jobEntity.workspaceId,
          {
            status: CreationJobStatus.FAILED,
            error: error.message,
          },
        );
      }

      throw error; // Let BullMQ handle retries
    }
  }
}
