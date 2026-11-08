// src/infra/event-bus/ports/event-consumer-health.port.port.ts

export interface EventConsumerHealthPort {
  isHealthy(): Promise<boolean>;
}
