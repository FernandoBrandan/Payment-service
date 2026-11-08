/* // src/infra/event-bus/event-bus.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '../logger/logger.module';
import { EVENT_CONSUMER, EVENT_CONSUMER_HEALTH, EVENT_PUBLISHER, EVENT_PUBLISHER_HEALTH } from '../tokens';

import { EventPublisherPort } from './ports/event-publisher.port';

import { RabbitMQEventPublisher } from './adapters/rabbitmq-event-publisher';
import { RabbitMQEventConsumer } from './adapters/rabbitmq-event-consumer';
import { EventPublisherHealthPort } from './ports/event-publisher-health.port';
import { EventConsumerHealthPort } from './ports/event-consumer-health.port';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    RabbitMQEventPublisher,
    RabbitMQEventConsumer,
    {
      provide: EVENT_PUBLISHER,
      inject: [ConfigService, RabbitMQEventPublisher],
      useFactory: (config, inMemory, rabbit): EventPublisherPort =>
        config.get('EVENT_BUS_DRIVER', 'in-memory') === 'rabbitmq' ? rabbit : inMemory,
    },
    {
      provide: EVENT_PUBLISHER_HEALTH,
      inject: [ConfigService, RabbitMQEventPublisher],
      useFactory: (config, inMemory, rabbit): EventPublisherHealthPort =>
        config.get('EVENT_BUS_DRIVER', 'in-memory') === 'rabbitmq' ? rabbit : inMemory,
    },
    {
      provide: EVENT_CONSUMER,
      inject: [ConfigService, RabbitMQEventConsumer],
      useFactory: (config, inMem, rabbit) =>
        config.get('EVENT_BUS_DRIVER', 'in-memory') === 'rabbitmq' ? rabbit : inMem,
    },
    {
      provide: EVENT_CONSUMER_HEALTH,
      inject: [ConfigService, RabbitMQEventConsumer],
      useFactory: (config, inMem, rabbit): EventConsumerHealthPort =>
        config.get('EVENT_BUS_DRIVER', 'in-memory') === 'rabbitmq' ? rabbit : inMem,
    },
  ],
  exports: [EVENT_CONSUMER, EVENT_PUBLISHER, EVENT_PUBLISHER_HEALTH, EVENT_CONSUMER_HEALTH],
})
export class EventBusModule {}

//  Por qué @Global():
//  EVENT_PUBLISHER lo van a usar Order, Cart, Catalog...Todos.
//  Hacerlo global evita que cada módulo tenga que importar EventBusModule explícitamente.
//  Es un cross - cutting concern, como el logger.
 */
