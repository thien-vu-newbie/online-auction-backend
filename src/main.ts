import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});

  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // Enable global logging interceptor
  const logger = app.get(WINSTON_MODULE_PROVIDER);
  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // Auto convert "1000" -> 1000, "true" -> true
    },
  }));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Online Auction API')
    .setDescription('API documentation for Online Auction Platform')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Users', 'User management')
    .addTag('Products', 'Product and auction management')
    .addTag('Bids', 'Bidding operations')
    .addTag('Categories', 'Category management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  console.log(`📂 Logs are stored in: http://localhost:5601/app/discover#/`);
}
bootstrap();
