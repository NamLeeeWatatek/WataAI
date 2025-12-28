import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceHelperService } from '../workspace-helper.service';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private workspaceHelper: WorkspaceHelperService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const headerWorkspaceId = request.headers?.['x-workspace-id'];
    const workspaceId =
      headerWorkspaceId ||
      request.params?.workspaceId ||
      request.query?.workspaceId ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const isMember = await this.workspaceHelper.isUserMemberOfWorkspace(
      user.id,
      workspaceId,
    );

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspaceId = workspaceId;

    return true;
  }
}
