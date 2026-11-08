// src/application/consumers/order-created.consumer.ts

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { EVENT_CONSUMER, EVENT_PUBLISHER } from '@infra/tokens';
import { EventConsumerPort } from '@infra/event-bus/ports/event-consumer.port';
import { EventPublisherPort } from '@infra/event-bus/ports/event-publisher.port';

import { Topics } from '@common/events';

import { PaymentProvider } from '../../domain/enums';
import { Money } from '../../domain/vo/money.vo';
import { Currency } from '../../domain/vo/currency.vo';
import { ExternalReference } from '../../domain/vo/external-reference.vo';

import { StartCheckoutUseCase } from '../usecases/start-checkout.usecase';

interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  total: number;
  currency: string;
  items: { productId: string; quantity: number; price: number }[];
  occurredAt: string;
}

@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  constructor(
    @Inject(EVENT_CONSUMER)
    private readonly consumer: EventConsumerPort,

    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,

    private readonly startCheckout: StartCheckoutUseCase,
  ) {}

  async onModuleInit() {
    await this.consumer.subscribe<OrderCreatedPayload>(
      Topics.ORDER_CREATED,
      { queue: 'payment.consumer.order-created' },
      (payload) => this.handle(payload),
    );
  }

  private async handle(payload: OrderCreatedPayload): Promise<void> {
    // Traducción: payload crudo → VOs del dominio
    const externalReference = ExternalReference.from(payload.orderId);
    const amount = Money.of(payload.total, Currency.from(payload.currency));

    // Delegación: toda la lógica vive en el UseCase
    const result = await this.startCheckout.execute({
      provider: PaymentProvider.MERCADO_PAGO,
      externalReference,
      amount,
    });

    if (!result) return; // es posiblemente "undefined".

    // Publicar el evento de salida — responsabilidad del consumer
    await this.eventPublisher.publish(Topics.PAYMENT_LINK_CREATED, {
      orderId: payload.orderId,
      paymentUrl: result.initPoint.toString(),
    });
  }
}
