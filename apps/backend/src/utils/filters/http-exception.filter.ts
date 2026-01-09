import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HttpExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: (exception as Error).message || 'Internal server error' };

        const message =
            typeof exceptionResponse === 'object' && exceptionResponse !== null
                ? (exceptionResponse as any).message || (exceptionResponse as any).error
                : exceptionResponse;

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: Array.isArray(message) ? message.join('. ') : message,
            error: (exceptionResponse as any).error || 'Error',
        };

        // Log errors (excluding 404s and common 4xx if needed, but usually good to log all for debug)
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url} ${status} - Error: ${JSON.stringify(errorResponse)}`,
                (exception as Error).stack,
            );
        } else {
            this.logger.warn(
                `${request.method} ${request.url} ${status} - Warning: ${JSON.stringify(errorResponse)}`,
            );
        }

        response.status(status).json(errorResponse);
    }
}
