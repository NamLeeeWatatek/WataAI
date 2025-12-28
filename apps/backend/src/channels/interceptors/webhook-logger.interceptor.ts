import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Webhook Request Logger Interceptor
 *
 * Logs all webhook requests for debugging and monitoring.
 * This helps track:
 * - Which webhooks are being received
 * - Signature validation status
 * - Processing time
 * - Errors
 */
@Injectable()
export class WebhookLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WebhookLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Log incoming webhook
    this.logger.log({
      type: 'webhook_received',
      requestId,
      method,
      url,
      headers: {
        'x-hub-signature-256': headers['x-hub-signature-256'],
        'x-signature': headers['x-signature'],
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
      },
      bodyPreview: this.safeStringify(body).substring(0, 500),
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;

          this.logger.log({
            type: 'webhook_processed',
            requestId,
            duration,
            success: true,
            response: this.safeStringify(response).substring(0, 200),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error({
            type: 'webhook_error',
            requestId,
            duration,
            success: false,
            error: {
              message: error.message,
              stack: error.stack,
            },
          });
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  }
}
