import { Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceHelperService } from './workspace-helper.service';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspaceContextInterceptor } from './interceptors/workspace-context.interceptor';
import { WorkspaceInvitationsController } from './workspace-invitations.controller';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import { WorkspaceInvitationEntity } from './infrastructure/persistence/relational/entities/workspace-invitation.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      WorkspaceMemberEntity,
      WorkspaceInvitationEntity,
    ]),
    UsersModule,
    MailModule,
    forwardRef(() => PermissionsModule),
  ],
  controllers: [WorkspacesController, WorkspaceInvitationsController],
  providers: [
    WorkspacesService,
    WorkspaceHelperService,
    WorkspaceInvitationsService,
    WorkspaceAccessGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkspaceContextInterceptor,
    },
  ],
  exports: [
    WorkspacesService,
    WorkspaceHelperService,
    WorkspaceAccessGuard,
    WorkspaceInvitationsService,
  ],
})
export class WorkspacesModule {}
