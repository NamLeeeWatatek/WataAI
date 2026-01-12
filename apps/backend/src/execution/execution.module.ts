import { Module } from '@nestjs/common';
import { ExecutionQueueModule } from './queue/execution-queue.module';
import { HttpExecutionStrategy } from './strategies/http-execution.strategy';
import { JobProcessor } from './queue/job.processor';
import { HttpModule } from '@nestjs/axios';
import { CreationToolsModule } from '../creation-tools/creation-tools.module';
import { CreationJobsModule } from '../creation-jobs/creation-jobs.module';
import { ExecutionValidationService } from './validation/execution-validation.service';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { TemplatesModule } from '../templates/templates.module';

import { AiExecutionStrategy } from './strategies/ai-execution.strategy';
import { WorkflowExecutionStrategy } from './strategies/workflow-execution.strategy';
import { ExecutionStrategyResolver } from './execution-strategy.resolver';

@Module({
  imports: [
    ExecutionQueueModule,
    HttpModule,
    CreationToolsModule,
    CreationJobsModule,
    AiProvidersModule,
    TemplatesModule,
  ],
  providers: [
    HttpExecutionStrategy,
    AiExecutionStrategy,
    WorkflowExecutionStrategy,
    ExecutionStrategyResolver,
    JobProcessor,
    ExecutionValidationService,
  ],
  exports: [
    ExecutionQueueModule,
    HttpExecutionStrategy,
    AiExecutionStrategy,
    WorkflowExecutionStrategy,
    ExecutionStrategyResolver,
    ExecutionValidationService,
  ],
})
export class ExecutionModule { }
