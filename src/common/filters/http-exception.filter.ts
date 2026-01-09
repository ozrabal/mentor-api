import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract message from exception response
    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as { message?: string | string[] }).message
        ? Array.isArray((message as { message: string[] }).message)
          ? (message as { message: string[] }).message.join(', ')
          : (message as { message: string }).message
        : 'An error occurred';

    const errorResponse = {
      statusCode: status,
      message: errorMessage,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error with context
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      userId: (request as any).user?.id,
      body: request.body,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }

    // Don't expose stack traces in production
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      status >= 500
    ) {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}

