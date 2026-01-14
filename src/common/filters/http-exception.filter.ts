import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";

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
        : "Internal server error";

    // Extract message from exception response
    const errorMessage =
      typeof message === "string"
        ? message
        : (message as { message?: string | string[] }).message
          ? Array.isArray((message as { message: string[] }).message)
            ? (message as { message: string[] }).message.join(", ")
            : (message as { message: string }).message
          : "An error occurred";

    const errorResponse = {
      error:
        exception instanceof HttpException
          ? exception.name
          : "Internal Server Error",
      message: errorMessage,
      path: request.url,
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    // Log error with context
    const logContext = {
      body: request.body,
      method: request.method,
      path: request.url,
      statusCode: status,
      userId: (request as any).user?.id,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }

    // Don't expose stack traces in production
    if (this.configService.get("NODE_ENV") === "production" && status >= 500) {
      errorResponse.message = "Internal server error";
    }

    response.status(status).json(errorResponse);
  }
}
