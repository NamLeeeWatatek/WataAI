import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { WorkspaceHelperService } from '../workspace-helper.service';

/**
 * Interceptor to set default workspace context for authenticated users
 * This runs after Guards (so req.user exists) but before the Controller
 */
@Injectable()
export class WorkspaceContextInterceptor implements NestInterceptor {
  constructor(private readonly workspaceHelper: WorkspaceHelperService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only attempt to set workspace if user is authenticated
    if (request.user?.id) {
      // Get user's default workspace and cache it in request
      const defaultWorkspace =
        await this.workspaceHelper.getUserDefaultWorkspace(request.user.id);

      if (defaultWorkspace) {
        request.defaultWorkspaceId = defaultWorkspace.id;
      }
    }

    return next.handle();
  }
}
