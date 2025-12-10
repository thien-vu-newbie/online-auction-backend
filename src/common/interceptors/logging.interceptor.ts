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

        // Sanitize response body before logging to avoid sending large or
        // inconsistently-mapped objects to external transports (like Elasticsearch).
        // Always normalize identifiers and `categoryId` to plain strings to
        // avoid sending BSON/ObjectId or nested objects into the logging index.
        const getIdString = (val: any) => {
          if (val === undefined || val === null) return '';
          try {
            // Mongoose ObjectId and similar implement toString()
            if (typeof val === 'object') {
              if ('_id' in val) return String((val as any)._id);
              if (typeof (val as any).toString === 'function') return String((val as any).toString());
              return JSON.stringify(val);
            }
            return String(val);
          } catch (e) {
            return '';
          }
        };

        const sanitizeProduct = (p: any) => {
          if (!p || typeof p !== 'object') return p;
          return {
            _id: getIdString(p._id ?? p.id),
            name: p.name,
            categoryId: getIdString(p.categoryId),
            currentPrice: typeof p.currentPrice === 'number' ? p.currentPrice : Number(p.currentPrice || 0),
            bidCount: typeof p.bidCount === 'number' ? p.bidCount : Number(p.bidCount || 0),
            endTime: p.endTime ? String(p.endTime) : undefined,
          };
        };

        const sanitizeResponseBody = (body: any) => {
          if (!body || typeof body !== 'object') return body;
          try {
            // If it's a paginated response with products array, sanitize items.
            if (Array.isArray(body.products)) {
              return { ...body, products: body.products.map(sanitizeProduct) };
            }

            // If it's a single product-like object, sanitize known fields.
            const copy: any = { ...body };
            if (copy._id) copy._id = getIdString(copy._id);
            if (copy.id) copy.id = getIdString(copy.id);
            if (copy.categoryId) copy.categoryId = getIdString(copy.categoryId);
            return copy;
          } catch (err) {
            return '[unserializable response]';
          }
        };

        const safeResponseBody = sanitizeResponseBody(resBody);

        // Use a different field name to avoid collisions with any pre-existing
        // logging index mappings that may expect a different structure for
        // `responseBody`.
        this.logger.info(`Outgoing Response`, {
          context: 'HTTPResponse',
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          responseBodyCompact: safeResponseBody,
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
