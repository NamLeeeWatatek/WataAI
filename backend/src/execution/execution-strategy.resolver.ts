import { Injectable, Logger } from '@nestjs/common';
import { IExecutionStrategy } from './strategies/execution.strategy.interface';
import { HttpExecutionStrategy } from './strategies/http-execution.strategy';
import { AiExecutionStrategy } from './strategies/ai-execution.strategy';
import { WorkflowExecutionStrategy } from './strategies/workflow-execution.strategy';
import {
  ExecutionType,
  StepExecutionConfig,
} from '../creation-tools/domain/creation-tool';

@Injectable()
export class ExecutionStrategyResolver {
  private readonly logger = new Logger(ExecutionStrategyResolver.name);

  constructor(
    private readonly httpStrategy: HttpExecutionStrategy,
    private readonly aiStrategy: AiExecutionStrategy,
    private readonly workflowStrategy: WorkflowExecutionStrategy,
  ) {}

  resolve(type: ExecutionType): IExecutionStrategy {
    switch (type) {
      case ExecutionType.HTTP_WEBHOOK:
        return this.httpStrategy;
      case ExecutionType.AI_GENERATION:
        return this.aiStrategy;
      case ExecutionType.WORKFLOW_CHAIN:
        return this.workflowStrategy;
      default:
        this.logger.error(`No strategy found for execution type: ${type}`);
        throw new Error(`Execution Strategy not found for type: ${type}`);
    }
  }

  /**
   * Execute a single step with its configuration
   */
  async executeStep(
    stepExecution: StepExecutionConfig,
    currentStepData: Record<string, any>,
    previousResults: Record<string, any> = {},
    context?: any,
  ): Promise<any> {
    this.logger.log(`Executing step with type: ${stepExecution.type}`);

    // Prepare inputs by combining current step data with previous results
    const inputs = this.prepareStepInputs(
      currentStepData,
      previousResults,
      stepExecution,
    );

    // Get appropriate strategy
    const strategy = this.resolve(stepExecution.type as any);

    // Execute
    return await strategy.execute(stepExecution.config as any, inputs, context);
  }

  /**
   * Prepare inputs for step execution
   */
  private prepareStepInputs(
    currentData: Record<string, any>,
    previousResults: Record<string, any>,
    execution: StepExecutionConfig,
  ): Record<string, any> {
    const inputs = { ...currentData };

    if (execution.inputSources?.fromSteps) {
      execution.inputSources.fromSteps.forEach((stepId) => {
        if (previousResults[stepId]) {
          inputs[`prev_${stepId}`] = previousResults[stepId];
        }
      });
    }

    inputs.prev = previousResults || {};

    if (execution.inputSources?.fromFields) {
      execution.inputSources.fromFields.forEach((fieldName) => {
        Object.values(previousResults).forEach((result: any) => {
          if (result && typeof result === 'object' && fieldName in result) {
            inputs[fieldName] = result[fieldName];
          }
        });
      });
    }

    this.logger.debug(`Prepared inputs for step execution:`, inputs);
    return inputs;
  }
}
