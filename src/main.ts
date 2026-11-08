// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule, ObserveInstrument } from './app.module';

import { AppLogger } from './infra/logger/logger';
import { correlationIdMiddleware } from './infra/logger/correlation-id.middleware';
import { AllExceptionsFilter } from '@common/domain/errors/all-exceptions.filter';
import { InfrastructureExceptionFilter } from '@common/filters/infrastructure-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    rawBody: true,
  });

  // Config
  app.enableShutdownHooks();
  app.use(correlationIdMiddleware);
  // app.useGlobalFilters(new AllExceptionsFilter(new AppLogger()));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new InfrastructureExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // src/main.ts
  app.enableCors({
    origin: true, // refleja el Origin del request
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    exposedHeaders: ['x-correlation-id'],
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
