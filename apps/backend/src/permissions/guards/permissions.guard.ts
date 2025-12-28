import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionsService: PermissionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Try to extract workspaceId from request context (set by WorkspaceAccessGuard or directly from headers/params)
        const workspaceId =
            request.workspaceId ||
            request.headers?.['x-workspace-id'] ||
            request.params?.workspaceId ||
            request.query?.workspaceId ||
            request.body?.workspaceId;

        const result = await this.permissionsService.checkPermissions(
            user,
            requiredPermissions,
            workspaceId,
        );

        if (!result.hasPermission) {
            throw new ForbiddenException(
                `Missing required permissions: ${result.missingPermissions.join(', ')}`,
            );
        }

        return true;
    }
}
