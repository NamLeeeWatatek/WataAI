import { Module } from '@nestjs/common';
import { CreationJobsService } from './creation-jobs.service';
import { CreationJobsController } from './creation-jobs.controller';
import { JobCallbacksController } from './job-callbacks.controller';
import { RelationalCreationJobsPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { ExecutionQueueModule } from '../execution/queue/execution-queue.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { forwardRef } from '@nestjs/common';
import { CreationToolsModule } from '../creation-tools/creation-tools.module';

import { ExecutionModule } from '../execution/execution.module';
import { ChannelsModule } from '../channels/channels.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [
    RelationalCreationJobsPersistenceModule,
    NotificationsModule,
    AuditModule,
    ExecutionQueueModule,
    forwardRef(() => WorkspacesModule),
    forwardRef(() => ExecutionModule),
    PermissionsModule,
    forwardRef(() => CreationToolsModule),
    ChannelsModule,
    IntegrationsModule,
    forwardRef(() => BotsModule),
  ],
  controllers: [CreationJobsController, JobCallbacksController],
  providers: [CreationJobsService],
  exports: [CreationJobsService, RelationalCreationJobsPersistenceModule],
})
export class CreationJobsModule { }
