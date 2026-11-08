import { Inject, Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from '@infra/logger/logger.interface';
import { LOGGER, EVENT_PUBLISHER_HEALTH, EVENT_CONSUMER_HEALTH } from '@infra/tokens';
import { EventPublisherHealthPort } from '@infra/event-bus/ports/event-publisher-health.port';
import { EventConsumerHealthPort } from '@infra/event-bus/ports/event-consumer-health.port';

export interface CircuitBreakerHealthPort {
  getState: () => 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,

    @Inject(LOGGER)
    private readonly logger: Logger,

    @Inject(EVENT_PUBLISHER_HEALTH)
    private readonly eventPublisherHealth: EventPublisherHealthPort,

    @Inject(EVENT_CONSUMER_HEALTH)
    private readonly eventConsumerHealth: EventConsumerHealthPort,
  ) {}

  async checkDatabase(): Promise<{ status: 'up' }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      this.logger.error('Database health check failed', {
        event: 'health_check_failed',
        component: 'database',
        error: error instanceof Error ? error.message : String(error),
      });
      throw withCause('Database is down', error);
    }
  }

  async checkEventBusPublisher(): Promise<{ status: 'up'; transport: string }> {
    try {
      const healthy = await this.eventPublisherHealth.isHealthy();
      if (!healthy) throw new Error('Event bus not healthy - Publisher');
      return { status: 'up', transport: process.env.EVENT_BUS_DRIVER ?? 'in-memory' };
    } catch (error) {
      this.logger.error('Event bus health check failed - Publisher', {
        event: 'health_check_failed',
        component: 'event_bus',
        error: error instanceof Error ? error.message : String(error),
      });
      throw withCause('Event bus is down - Publisher', error);
    }
  }

  async checkEventBusConsumer(): Promise<{ status: 'up'; transport: string }> {
    try {
      const healthy = await this.eventConsumerHealth.isHealthy();
      if (!healthy) throw new Error('Event bus not healthy - Consumer');
      return { status: 'up', transport: process.env.EVENT_BUS_DRIVER ?? 'in-memory' };
    } catch (error) {
      this.logger.error('Event bus health check failed - Consumer', {
        event: 'health_check_failed',
        component: 'event_bus',
        error: error instanceof Error ? error.message : String(error),
      });
      throw withCause('Event bus is down - Consumer', error);
    }
  }
}

function withCause(message: string, cause: unknown): Error {
  const err = new Error(message);
  (err as Error & { cause?: unknown }).cause = cause;
  return err;
}
