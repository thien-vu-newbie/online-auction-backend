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

    // Skip logging for root endpoint to avoid Elasticsearch mapping conflicts
    if (url === '/') {
      return next.handle();
    }

    // Log the request (avoid sending raw request bodies to external indexes)
    const requestBodyCompact = (body && typeof body !== 'object') ? String(body) : (body ? '[object]' : undefined);

    this.logger.info(`Incoming Request`, {
      context: 'HTTPRequest',
      method,
      url,
      ip,
      userAgent,
      query,
      bodyCompact: requestBodyCompact,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      // Log the response
      tap((resBody: any) => {
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        // Simplified logging to avoid Elasticsearch mapping conflicts
        // Only log minimal response metadata instead of full body
        const responseSummary: any = {
          statusCode,
          responseTime: `${responseTime}ms`,
        };

        // Add simple indicators without complex nested objects
        if (resBody) {
          if (Array.isArray(resBody.products)) {
            responseSummary.productsCount = resBody.products.length;
          }
          if (Array.isArray(resBody.orders)) {
            responseSummary.ordersCount = resBody.orders.length;
          }
          if (resBody.order) {
            responseSummary.hasOrder = true;
          }
          if (resBody.message) {
            responseSummary.message = resBody.message;
          }
          if (resBody.total !== undefined) {
            responseSummary.total = resBody.total;
          }
          if (resBody.page !== undefined) {
            responseSummary.page = resBody.page;
          }
        }

        this.logger.info(`Outgoing Response`, {
          context: 'HTTPResponse',
          method,
          url,
          ...responseSummary,
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
