// src/application/jobs/reconcile-pending-payments.job.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule'

import { PAYMENT_PROVIDER, PAYMENT_REPOSITORY } from '@infra/tokens';

import { WebhookSnapshotValidator } from '../validators/webhook-snapshot.validator';

import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentRepository } from '../../domain/repositories/payment.repository';

@Injectable()
export class ReconcilePendingPaymentsJob {
  private readonly logger = new Logger(ReconcilePendingPaymentsJob.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,

    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: PaymentRepository,

    private readonly snapshotValidator: WebhookSnapshotValidator,
  ) {}

  // TODO(reconciliation): cada 5 min, buscar Payments en PENDING con createdAt > 5 min,
  // hacer provider.fetchPayment(providerPaymentId) y aplicar la misma transición
  // que el webhook. Es la única forma de no quedar colgado si MP nunca llama.
  //   - agregar repo.findPendingOlderThan(date): Promise<Payment[]>
  //   - reusar WebhookSnapshotValidator + la lógica de transición del use case
  //   - requiere @nestjs/schedule en package.json
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    // ...
  }
}
