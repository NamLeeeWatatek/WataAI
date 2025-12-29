import { Module } from '@nestjs/common';
import { ExecutionQueueModule } from './queue/execution-queue.module';
import { HttpExecutionStrategy } from './strategies/http-execution.strategy';
import { JobProcessor } from './queue/job.processor';
import { HttpModule } from '@nestjs/axios';
import { CreationToolsModule } from '../creation-tools/creation-tools.module';
import { CreationJobsModule } from '../creation-jobs/creation-jobs.module';
import { ExecutionValidationService } from './validation/execution-validation.service';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';

import { AiExecutionStrategy } from './strategies/ai-execution.strategy';
import { ExecutionStrategyResolver } from './execution-strategy.resolver';

@Module({
  imports: [
    ExecutionQueueModule,
    HttpModule,
    CreationToolsModule,
    CreationJobsModule,
    AiProvidersModule,
  ],
  providers: [
    HttpExecutionStrategy,
    AiExecutionStrategy,
    ExecutionStrategyResolver,
    JobProcessor,
    ExecutionValidationService,
  ],
  exports: [ExecutionQueueModule, HttpExecutionStrategy],
})
export class ExecutionModule { }
