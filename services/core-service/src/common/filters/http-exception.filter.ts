import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface StructuredErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const normalizedError = this.normalizeError(exceptionResponse);

    response.status(statusCode).json({
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      message: normalizedError.message,
      error: normalizedError.error,
    } satisfies StructuredErrorResponse);
  }

  private normalizeError(
    response: unknown,
  ): Pick<StructuredErrorResponse, 'message' | 'error'> {
    if (typeof response === 'string') {
      return { message: response, error: response };
    }

    if (this.isValidationErrorResponse(response)) {
      return {
        message: response.message ?? 'Unexpected error',
        error: response.error ?? 'Error',
      };
    }

    return {
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private isValidationErrorResponse(
    response: unknown,
  ): response is ValidationErrorResponse {
    return typeof response === 'object' && response !== null;
  }
}
