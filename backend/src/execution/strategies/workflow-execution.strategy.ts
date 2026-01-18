import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { IExecutionStrategy } from './execution.strategy.interface';
import {
  WorkflowExecutionConfig,
  ExecutionType,
  AiExecutionConfig,
  HttpExecutionConfig,
} from '../../creation-tools/domain/creation-tool';
import { AiExecutionStrategy } from './ai-execution.strategy';
import { HttpExecutionStrategy } from './http-execution.strategy';
import { Liquid } from 'liquidjs';
import { CreationJobsService } from '../../creation-jobs/creation-jobs.service';
import { CreationJobStatus } from '../../creation-jobs/domain/creation-jobs';

@Injectable()
export class WorkflowExecutionStrategy implements IExecutionStrategy {
  private readonly logger = new Logger(WorkflowExecutionStrategy.name);
  private readonly engine = new Liquid();

  constructor(
    private readonly aiStrategy: AiExecutionStrategy,
    private readonly httpStrategy: HttpExecutionStrategy,
    @Inject(forwardRef(() => CreationJobsService))
    private readonly creationJobsService: CreationJobsService,
  ) {
    this.engine.registerFilter('json', (v) => JSON.stringify(v));
  }

  async execute(
    config: WorkflowExecutionConfig,
    inputs: Record<string, any>,
    context?: { workspaceId?: string; userId?: string; jobId?: string },
  ): Promise<any> {
    this.logger.log(`Executing Workflow Chain: ${config.steps.length} steps`);

    const results: Record<string, any> = {};
    const currentInputs = { ...inputs };

    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      this.logger.debug(`Step: ${step.title} (${step.id})`);

      // 1. Prepare inputs for this step (include previous results)
      const stepInputs = {
        ...currentInputs,
        prev: results,
      };

      // 2. Resolve sub-strategy
      let stepResult: any;
      if (step.execution.type === ExecutionType.AI_GENERATION) {
        stepResult = await this.aiStrategy.execute(
          step.execution as AiExecutionConfig,
          stepInputs,
          context,
        );
      } else if (step.execution.type === ExecutionType.HTTP_WEBHOOK) {
        stepResult = await this.httpStrategy.execute(
          step.execution as HttpExecutionConfig,
          stepInputs,
          context,
        );
      } else {
        throw new Error(
          `Unsupported execution type in workflow step: ${(step.execution as any).type}`,
        );
      }

      // 3. Store result
      results[step.id] = stepResult;

      // Update Job Progress if jobId is provided
      if (context?.jobId && context.workspaceId) {
        const progress = Math.round(((i + 1) / config.steps.length) * 100);
        await this.creationJobsService.update(
          context.jobId,
          context.workspaceId,
          {
            progress,
            outputData: {
              steps: results,
              partial: true,
            },
          },
        );
      }
    }

    return {
      success: true,
      steps: results,
      // The final result of a workflow is usually the result of the last step
      result:
        results[config.steps[config.steps.length - 1].id]?.result ||
        results[config.steps[config.steps.length - 1].id],
    };
  }
}
