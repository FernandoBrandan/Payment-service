// src/infra/event-bus/event-bus.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '../logger/logger.module';
import { EVENT_CONSUMER, EVENT_CONSUMER_HEALTH, EVENT_PUBLISHER, EVENT_PUBLISHER_HEALTH } from '../tokens';

import { EventPublisherPort } from './ports/event-publisher.port';
import { EventConsumerPort } from './ports/event-consumer.port';
import { EventPublisherHealthPort } from './ports/event-publisher-health.port';
import { EventConsumerHealthPort } from './ports/event-consumer-health.port';

import { RabbitMQEventPublisher } from './adapters/rabbitmq-event-publisher';
import { RabbitMQEventConsumer } from './adapters/rabbitmq-event-consumer';

const SUPPORTED_DRIVERS = ['rabbitmq'] as const;
type Driver = (typeof SUPPORTED_DRIVERS)[number];

function resolveDriver(config: ConfigService): Driver {
  const driver = config.get<string>('EVENT_BUS_DRIVER', 'rabbitmq');
  if (!SUPPORTED_DRIVERS.includes(driver as Driver)) {
    throw new Error(`EVENT_BUS_DRIVER="${driver}" no soportado. Implementados: ${SUPPORTED_DRIVERS.join(', ')}`);
  }
  return driver as Driver;
}

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    RabbitMQEventPublisher,
    RabbitMQEventConsumer,

    {
      provide: EVENT_PUBLISHER,
      inject: [ConfigService, RabbitMQEventPublisher],
      useFactory: (config: ConfigService, rabbit: RabbitMQEventPublisher): EventPublisherPort => {
        resolveDriver(config);
        return rabbit;
      },
    },
    {
      provide: EVENT_PUBLISHER_HEALTH,
      inject: [ConfigService, RabbitMQEventPublisher],
      useFactory: (config: ConfigService, rabbit: RabbitMQEventPublisher): EventPublisherHealthPort => {
        resolveDriver(config);
        return rabbit;
      },
    },
    {
      provide: EVENT_CONSUMER,
      inject: [ConfigService, RabbitMQEventConsumer],
      useFactory: (config: ConfigService, rabbit: RabbitMQEventConsumer): EventConsumerPort => {
        resolveDriver(config);
        return rabbit;
      },
    },
    {
      provide: EVENT_CONSUMER_HEALTH,
      inject: [ConfigService, RabbitMQEventConsumer],
      useFactory: (config: ConfigService, rabbit: RabbitMQEventConsumer): EventConsumerHealthPort => {
        resolveDriver(config);
        return rabbit;
      },
    },
  ],
  exports: [EVENT_CONSUMER, EVENT_PUBLISHER, EVENT_PUBLISHER_HEALTH, EVENT_CONSUMER_HEALTH],
})
export class EventBusModule {}
