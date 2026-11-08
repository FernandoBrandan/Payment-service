// payment/src/application/usecases/handle-webhook.usecase.ts
import { Inject, Injectable } from '@nestjs/common';

import { EVENT_PUBLISHER, PAYMENT_PROVIDER, PAYMENT_REPOSITORY } from '@infra/tokens';
import { EventPublisherPort } from '@infra/event-bus/ports/event-publisher.port';
import { Topics } from '@common/events';

import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { ExternalReference } from '../../domain/vo/external-reference.vo';
import { ProviderPaymentId } from '../../domain/vo/provider-payment-id.vo';

import { WebhookSnapshotValidator } from '../validators/webhook-snapshot.validator';

interface WebhookEventInput {
  providerPaymentId: string;
  raw: string;
  headers: Record<string, string>;
}
@Injectable()
export class HandleWebhookUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,

    @Inject(PAYMENT_REPOSITORY)
    private readonly repoPayment: PaymentRepository,

    private readonly snapshotValidator: WebhookSnapshotValidator,

    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}
  async execute(event: WebhookEventInput): Promise<void> {
    // 1. Nunca confiar en el body: verificar firma del provider.
    if (!this.provider.verifyWebhookSignature(event.raw, event.headers, event.providerPaymentId)) {
      throw new Error('Invalid webhook signature');
    }

    // 2. Re-consultar al provider (fuente de verdad).
    const snapshot = await this.provider.fetchPayment(event.providerPaymentId);
    if (!snapshot.externalReference?.trim()) {
      // this.logger.warn(`Webhook sin external_reference para ${snapshot.providerPaymentId}`)
      return;
    }

    // 3. Buscar el Payment local por su externalReference.
    const payment = await this.repoPayment.findByExternalReference(ExternalReference.from(snapshot.externalReference));

    if (!payment) throw new Error('Payment not found');

    // 4. Idempotencia: si ya está en estado terminal, no hacer nada.
    if (payment.isTerminal()) {
      // this.logger.log(`Payment ${payment.id.value} already terminal, skipping`)
      return;
    }

    this.snapshotValidator.validate(payment, snapshot);

    // 5. Aplicar transición según el SNAPSHOT (no según el body del webhook).
    switch (snapshot.status) {
      case 'pending':
      case 'in_process':
        payment.markInProcess();
        break;
      case 'approved':
        payment.approve(ProviderPaymentId.from(snapshot.providerPaymentId), snapshot.paidAt ?? new Date());
        await this.repoPayment.save(payment);
        await this.eventPublisher.publish(Topics.PAYMENT_APPROVED, {
          orderId: payment.externalReference.value, // ← string, no el VO
          providerPaymentId: snapshot.providerPaymentId,
          paidAt: payment.paidAt!.toISOString(),
        });
        return;
      case 'rejected':
      case 'cancelled':
        payment.reject(typeof snapshot.raw?.reason === 'string' ? snapshot.raw.reason : undefined);
        await this.repoPayment.save(payment);
        await this.eventPublisher.publish(Topics.PAYMENT_REJECTED, {
          orderId: payment.externalReference.value,
          reason: payment.rawPayload?.reason ?? 'rejected',
        });
        return;
      case 'refunded':
        payment.refund();
        await this.repoPayment.save(payment);
        await this.eventPublisher.publish(Topics.PAYMENT_REFUNDED, {
          orderId: payment.externalReference.value,
        });
        return;
      default:
        // this.logger.warn(`Unhandled provider status: ${snapshot.status}`)
        return;
    }

    payment.setRawPayload(snapshot.raw);
    await this.repoPayment.save(payment);
  }
}

// Deuda Fase 3:
// - HandleWebhookUseCase publica eventos directo (opción A - codigo actual).
//   Refactor a opción B: payment.pullDomainEvents() → return events[]
//   → controller/consumer publica. Motivo: si el webhook se re-invoca
//   desde otro lugar (replay, cron), no debe duplicar publicaciones.
