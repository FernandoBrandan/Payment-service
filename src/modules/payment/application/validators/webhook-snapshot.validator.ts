import { Injectable } from '@nestjs/common';

import { Money } from '../../domain/vo/money.vo';
import { Currency } from '../../domain/vo/currency.vo';
import { WebhookSnapshotMismatchError } from '../../domain/errors/vo.errors';
import { ProviderPaymentSnapshot } from '../../domain/ports/payment-provider.port';

import { Payment } from '../../domain/payment.entity';

@Injectable()
export class WebhookSnapshotValidator {
  validate(payment: Payment, snapshot: ProviderPaymentSnapshot): void {
    // providerPaymentId: si ya teníamos uno, debe coincidir
    if (payment.providerPaymentId && payment.providerPaymentId.value !== snapshot.providerPaymentId) {
      throw new WebhookSnapshotMismatchError(
        `providerPaymentId: esperado "${payment.providerPaymentId.value}", recibido "${snapshot.providerPaymentId}"`,
      );
    }

    // externalReference: siempre debe coincidir
    if (payment.externalReference.value !== snapshot.externalReference) {
      throw new WebhookSnapshotMismatchError(
        `externalReference: esperado "${payment.externalReference.value}", recibido "${snapshot.externalReference}"`,
      );
    }

    // amount + currency: siempre deben coincidir
    const snapshotMoney = Money.of(snapshot.amount, Currency.from(snapshot.currency));
    if (!payment.amount.equals(snapshotMoney)) {
      throw new WebhookSnapshotMismatchError(
        `amount: esperado "${payment.amount.toDecimalString()} ${payment.amount.currency.code}", recibido "${snapshot.amount} ${snapshot.currency}"`,
      );
    }
  }
}
