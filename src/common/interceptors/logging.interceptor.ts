import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Inject the Winston logger
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, body, query, headers } = request as any;
    const ip = request.ip || request.headers['x-forwarded-for'];
    const userAgent = headers['user-agent'];
    const now = Date.now();

    // Log the request
    this.logger.info(`Incoming Request`, {
      context: 'HTTPRequest',
      method,
      url,
      ip,
      userAgent,
      query,
      body,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      // Log the response
      tap((resBody: any) => {
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        this.logger.info(`Outgoing Response`, {
          context: 'HTTPResponse',
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          responseBody: resBody,
          timestamp: new Date().toISOString(),
        });
      }),
      // Log errors
      catchError((error: any) => {
        const statusCode = error?.statusCode || 500;
        const responseTime = Date.now() - now;

        this.logger.error(`Request Error`, {
          context: 'HTTPError',
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          ip,
          userAgent,
          query,
          body,
          error: error?.message || 'Unknown error',
          stack: error?.stack || '',
          timestamp: new Date().toISOString(),
        });
        // Re-throw the error to be handled by NestJS error filters
        throw error;
      }),
    );
  }
}
