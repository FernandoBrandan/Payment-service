import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_PREFERENCE_REPOSITORY, PAYMENT_PROVIDER, PAYMENT_REPOSITORY } from '@infra/tokens';

import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';

import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { PaymentPreferenceRepository } from '../../domain/repositories/payment-preference.repository';

import { PaymentProvider } from '../../domain/enums';
import { Money } from '../../domain/vo/money.vo';
import { EntityId } from '../../domain/vo/entity-id.vo';
import { ExternalReference } from '../../domain/vo/external-reference.vo';

import { Payment } from '../../domain/payment.entity';
import { PaymentPreference } from '../../domain/payment-preference.entity';

import { ConfigService } from '@nestjs/config';

interface dto {
  provider: PaymentProvider;
  externalReference: ExternalReference;
  amount: Money;
}
@Injectable()
export class StartCheckoutUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,

    @Inject(PAYMENT_REPOSITORY)
    private readonly repoPayment: PaymentRepository,

    @Inject(PAYMENT_PREFERENCE_REPOSITORY)
    private readonly repoPref: PaymentPreferenceRepository,

    private readonly config: ConfigService,
  ) {}

  async execute(dto: dto) {
    const existing = await this.repoPayment.findByExternalReference(dto.externalReference);
    if (existing && !existing.isTerminal()) {
      // Ya hay un Payment para esta orden.
      // Devolver el snapshot existente, no crear nada nuevo.
      return; // ack del mensaje, no re-publicar
    }

    //  1. Payment local PENDING (ancla del intento)
    const payment = Payment.create({
      id: EntityId.create(),
      provider: dto.provider,
      externalReference: dto.externalReference, // = orderId
      amount: dto.amount,
    });

    try {
      await this.repoPayment.save(payment);
    } catch (err: any) {
      if (err?.code === '23505') {
        // Otra instancia ganó la carrera. Devolver la que ganó.
        const existing = await this.repoPayment.findByExternalReference(dto.externalReference);
        return; // ack del mensaje, no re-publicar
      }
      throw err;
    }

    //  2. Preference local PENDING
    const preference = PaymentPreference.create({
      id: EntityId.create(),
      provider: dto.provider,
      externalReference: payment.externalReference,
      amount: payment.amount,
      ttlMs: 5 * 60_000,
    });
    await this.repoPref.save(preference);

    //  3. Llamada al provider (única parte no local)
    const providerResult = await this.provider.createPreference({
      externalReference: payment.externalReference.toString(),
      amount: payment.amount,
      currency: payment.amount.currency.toString(),
      notificationUrl: this.config.get<string>('WEBHOOK_URL') || '',
      backUrls: {
        success: this.config.get<string>('SUCCESS_URL') || '',
        failure: this.config.get<string>('FAILURE_URL') || '',
        pending: this.config.get<string>('PENDING_URL') || '',
      },
    });

    //  4. attachProviderData → READY
    const ready = preference.attachProviderData({
      initPoint: providerResult.initPoint,
      providerPreferenceId: providerResult.providerPreferenceId,
      expiresAt: providerResult.expiresAt,
    });
    await this.repoPref.save(ready);

    //  5. DTO al frontend
    return {
      paymentId: payment.id,
      preferenceId: ready.id.value,
      initPoint: ready.initPoint!,
      expiresAt: ready.expiresAt,
    };
  }
}
