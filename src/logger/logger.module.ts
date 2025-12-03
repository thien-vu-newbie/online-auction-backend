import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(), // Use ISO format for Elasticsearch compatibility
        winston.format.json(),
      ),
      transports: [
        // Elasticsearch Transport - Send logs to ELK stack
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          },
          index: 'nestjs-logs',
          dataStream: false,
          indexPrefix: 'nestjs-logs',
          transformer: (logData) => {
            // Remove the string 'timestamp' field and use only @timestamp
            const { timestamp, ...rest } = logData;
            return {
              '@timestamp': timestamp || new Date().toISOString(),
              ...rest,
            };
          },
          indexTemplate: {
            name: 'nestjs-logs-template',
            body: {
              index_patterns: ['nestjs-logs-*'],
              settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
                // ILM - Index Lifecycle Management: Tự động xóa logs cũ
                'index.lifecycle.name': 'nestjs-logs-policy',
                'index.lifecycle.rollover_alias': 'nestjs-logs',
              },
              mappings: {
                properties: {
                  '@timestamp': { type: 'date' },
                  level: { type: 'keyword' },
                  message: { type: 'text' },
                  meta: {
                    properties: {
                      context: { type: 'keyword' },
                      method: { type: 'keyword' },
                      url: { type: 'keyword' },
                      statusCode: { type: 'integer' },
                      responseTime: { type: 'keyword' },
                      ip: { type: 'ip' },
                    }
                  }
                }
              }
            }
          }
        }),
      ],
    }),
  ],
})
export class LoggerModule {}
