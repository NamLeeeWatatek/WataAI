import { Injectable, Logger } from '@nestjs/common';
import { IExecutionStrategy } from './strategies/execution.strategy.interface';
import { HttpExecutionStrategy } from './strategies/http-execution.strategy';
import { AiExecutionStrategy } from './strategies/ai-execution.strategy';
import { WorkflowExecutionStrategy } from './strategies/workflow-execution.strategy';
import { ExecutionType } from '../creation-tools/domain/creation-tool';

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
}
