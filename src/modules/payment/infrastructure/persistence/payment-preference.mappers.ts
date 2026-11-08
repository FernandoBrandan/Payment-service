// src/infrastructure/persistence/payment-preference.mappers.ts
import { PaymentPreferenceStatus, PaymentProvider } from '../../domain/enums';
import { Money } from '../../domain/vo/money.vo';
import { Currency } from '../../domain/vo/currency.vo';
import { EntityId } from '../../domain/vo/entity-id.vo';
import { InitPoint } from '../../domain/vo/init-point.vo';
import { ExternalReference } from '../../domain/vo/external-reference.vo';

import { PaymentPreference } from '../../domain/payment-preference.entity';

import { PaymentPreferenceOrmEntity } from './payment-preference.orm-entity';

export class PaymentPreferenceMapper {
  static toDomain(orm: PaymentPreferenceOrmEntity): PaymentPreference {
    return new PaymentPreference(
      EntityId.from(orm.id),
      orm.provider as PaymentProvider,
      ExternalReference.from(orm.externalReference),
      Money.of(orm.amount, Currency.from(orm.currency)),
      orm.status as PaymentPreferenceStatus,
      orm.createdAt,
      orm.initPoint ? InitPoint.from(orm.initPoint) : undefined,
      orm.providerPreferenceId ?? undefined,
      orm.expiresAt ?? undefined,
    );
  }

  static toPersistence(domain: PaymentPreference): Partial<PaymentPreferenceOrmEntity> {
    const orm = new PaymentPreferenceOrmEntity();
    orm.id = domain.id.value;
    orm.provider = domain.provider;
    orm.externalReference = domain.externalReference.value;
    orm.amount = domain.amount.toDecimalString();
    orm.currency = domain.amount.currency.code;
    orm.status = domain.status;
    orm.createdAt = domain.createdAt;
    orm.initPoint = domain.initPoint?.url ?? null;
    orm.providerPreferenceId = domain.providerPreferenceId ?? null;
    orm.expiresAt = domain.expiresAt ?? null;
    return orm;
  }
}
