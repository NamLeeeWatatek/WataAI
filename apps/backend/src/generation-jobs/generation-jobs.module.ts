import { Module, forwardRef } from '@nestjs/common';
import { GenerationJobsController } from './generation-jobs.controller';
import { GenerationJobsService } from './generation-jobs.service';
import { RelationalGenerationJobPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

import { ExecutionQueueModule } from '../execution/queue/execution-queue.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    RelationalGenerationJobPersistenceModule,
    ExecutionQueueModule,
    forwardRef(() => WorkspacesModule),
    PermissionsModule,
  ],
  controllers: [GenerationJobsController],
  providers: [GenerationJobsService],
  exports: [GenerationJobsService, RelationalGenerationJobPersistenceModule],
})
export class GenerationJobsModule { }
