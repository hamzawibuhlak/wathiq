import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
    method: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Get error message
        let message: string | string[] = 'حدث خطأ غير متوقع';
        let error = 'InternalServerError';

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            error = exception.name;

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as Record<string, unknown>;
                message = (responseObj.message as string | string[]) || message;
                error = (responseObj.error as string) || error;
            }
        } else if (exception instanceof Error) {
            message = exception.message || message;
            error = exception.name || error;
        }

        // Build error response
        const errorResponse: ErrorResponse = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        // Log the error
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${status}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        } else {
            this.logger.warn(
                `${request.method} ${request.url} - ${status}: ${JSON.stringify(message)}`,
            );
        }

        response.status(status).json(errorResponse);
    }
}
