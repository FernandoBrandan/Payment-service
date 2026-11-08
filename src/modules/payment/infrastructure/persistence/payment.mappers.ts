// src/infrastructure/persistence/payment.mappers.ts
import { PaymentProvider, PaymentStatus } from '../../domain/enums';
import { Money } from '../../domain/vo/money.vo';
import { Currency } from '../../domain/vo/currency.vo';
import { EntityId } from '../../domain/vo/entity-id.vo';
import { ExternalReference } from '../../domain/vo/external-reference.vo';
import { ProviderPaymentId } from '../../domain/vo/provider-payment-id.vo';

import { Payment } from '../../domain/payment.entity';
import { PaymentOrmEntity } from './payment.orm-entity';

export class PaymentMapper {
  static toDomain(orm: PaymentOrmEntity): Payment {
    return new Payment(
      EntityId.from(orm.id),
      orm.provider as PaymentProvider,
      ExternalReference.from(orm.externalReference),
      Money.of(orm.amount, Currency.from(orm.currency)),
      orm.status as PaymentStatus,
      orm.createdAt,
      orm.paidAt ?? undefined,
      orm.providerPaymentId ? ProviderPaymentId.from(orm.providerPaymentId) : undefined,
      orm.rawPayload ?? undefined,
    );
  }

  static toPersistence(domain: Payment): Partial<PaymentOrmEntity> {
    const orm = new PaymentOrmEntity();
    orm.id = domain.id.value;
    orm.provider = domain.provider;
    orm.externalReference = domain.externalReference.value;
    orm.amount = domain.amount.toDecimalString();
    orm.currency = domain.amount.currency.code;
    orm.status = domain.status;
    orm.createdAt = domain.createdAt;
    orm.paidAt = domain.paidAt ?? null;
    orm.providerPaymentId = domain.providerPaymentId?.value ?? null;
    orm.rawPayload = domain.rawPayload ?? null;
    return orm;
  }
}
