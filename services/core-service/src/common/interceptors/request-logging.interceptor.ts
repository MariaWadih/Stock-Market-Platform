import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logRequest(request, response, startedAt),
        error: (error: unknown) =>
          this.logRequest(request, response, startedAt, error),
      }),
    );
  }

  private logRequest(
    request: Request,
    response: Response,
    startedAt: number,
    error?: unknown,
  ): void {
    const durationMs = Date.now() - startedAt;
    const statusCode =
      error instanceof HttpException
        ? error.getStatus()
        : error
          ? HttpStatus.INTERNAL_SERVER_ERROR
          : response.statusCode;

    this.logger.log(
      `${request.method} ${request.originalUrl} ${statusCode} ${durationMs}ms`,
    );
  }
}
