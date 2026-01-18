import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip, headers } = request;
    const userAgent = headers['user-agent'];

    // Only log write operations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap({
          next: (data) => {
            // Wait for response to ensure operation was successful
            this.logAction(context, request, data, ip, userAgent);
          },
          error: (error) => {
            // Optional: log failed attempts too
            this.logger.debug(`Operation failed: ${method} ${url}`);
          },
        }),
      );
    }

    return next.handle();
  }

  private async logAction(
    context: ExecutionContext,
    request: any,
    responseData: any,
    ip: string,
    userAgent: string,
  ) {
    try {
      const user = request.user;
      const workspaceId =
        user?.workspaceId ||
        request.params?.workspaceId ||
        request.body?.workspaceId;

      if (!user || !workspaceId) return;

      const urlParts = request.url.split('/');
      const resourceType = urlParts[2] || 'unknown'; // assuming /api/v1/resource/...

      const actionMap: Record<string, string> = {
        POST: 'CREATE',
        PATCH: 'UPDATE',
        PUT: 'UPDATE',
        DELETE: 'DELETE',
      };

      await this.auditService.log({
        userId: user.id,
        workspaceId,
        action: actionMap[request.method] || request.method,
        resourceType,
        resourceId: responseData?.id || request.params?.id || 'n/a',
        details: {
          url: request.url,
          method: request.method,
          // Avoid logging sensitive data in body if needed
          // body: request.body,
        },
        ipAddress: ip,
        userAgent,
      });
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error.message}`);
    }
  }
}
