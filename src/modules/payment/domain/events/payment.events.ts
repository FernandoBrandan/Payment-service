// payment/src/domain/events/payment.events.ts
// export class PaymentApproved {
//   constructor(
//     public readonly paymentId: EntityId,
//     public readonly externalReference: ExternalReference,
//     public readonly amount: Money,
//     public readonly paidAt: Date,
//   ) {}
// }
// export class PaymentRejected { ... }
// export class PaymentRefunded { ... }

import { PaymentProvider } from '../enums';
import { Money } from '../vo/money.vo';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  constructor(eventId: string, occurredAt: Date) {
    this.eventId = eventId;
    this.occurredAt = occurredAt;
  }
  abstract get eventName(): string;
}

export class PaymentApproved extends DomainEvent {
  readonly eventName = 'payment.approved';
  constructor(
    eventId: string,
    occurredAt: Date,
    public readonly paymentId: string,
    public readonly externalReference: string, // = orderId
    public readonly provider: PaymentProvider,
    public readonly providerPaymentId: string,
    public readonly amount: Money,
    public readonly paidAt: Date,
  ) {
    super(eventId, occurredAt);
  }
}

export class PaymentRejected extends DomainEvent {
  readonly eventName = 'payment.rejected';
  constructor(
    eventId: string,
    occurredAt: Date,
    public readonly paymentId: string,
    public readonly externalReference: string,
    public readonly provider: PaymentProvider,
    public readonly reason?: string,
  ) {
    super(eventId, occurredAt);
  }
}

export class PaymentRefunded extends DomainEvent {
  readonly eventName = 'payment.refunded';
  constructor(
    eventId: string,
    occurredAt: Date,
    public readonly paymentId: string,
    public readonly externalReference: string,
    public readonly provider: PaymentProvider,
    public readonly providerPaymentId: string,
  ) {
    super(eventId, occurredAt);
  }
}
