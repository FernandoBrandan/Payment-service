import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from './infra/config/config.module';
import { DatabaseModule } from './infra/database/database.module';

import { PAYMENT_PROVIDER, PAYMENT_PREFERENCE_REPOSITORY, PAYMENT_REPOSITORY } from './infra/tokens';
import { HealthModule } from '@infra/health/health.module';
import { EventBusModule } from './infra/event-bus/event-bus.module';

import { TypeOrmPaymentRepository } from '@payment/infrastructure/repositories/typeorm-payment.repository';
import { TypeOrmPaymentPreferenceRepository } from '@payment/infrastructure/repositories/typeorm-payment-preference.repository';

import { PaymentOrmEntity } from '@payment/infrastructure/persistence/payment.orm-entity';
import { PaymentPreferenceOrmEntity } from '@payment/infrastructure/persistence/payment-preference.orm-entity';
import { MercadoPagoProvider } from '@payment/infrastructure/providers/mercado-pago.provider';

import { StartCheckoutUseCase } from '@payment/application/usecases/start-checkout.usecase';
import { HandleWebhookUseCase } from '@payment/application/usecases/handle-webhook.usecase';
import { OrderCreatedConsumer } from '@payment/application/consumers/start-checkout.consumer';
import { WebhookSnapshotValidator } from '@payment/application/validators/webhook-snapshot.validator';

import { PaymentsController } from '@payment/presentation/payments.controller';
import { MercadoPagoWebhookController } from '@payment/presentation/webhook.controller';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'payment',
    }),
    TypeOrmModule.forFeature([PaymentOrmEntity, PaymentPreferenceOrmEntity]),
    ConfigModule,
    HealthModule,
    EventBusModule,
    DatabaseModule,
  ],
  controllers: [PaymentsController, MercadoPagoWebhookController],
  providers: [
    StartCheckoutUseCase,
    HandleWebhookUseCase,
    WebhookSnapshotValidator,
    OrderCreatedConsumer,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: TypeOrmPaymentRepository,
    },
    {
      provide: PAYMENT_PREFERENCE_REPOSITORY,
      useClass: TypeOrmPaymentPreferenceRepository,
    },
    {
      provide: PAYMENT_PROVIDER,
      useClass: MercadoPagoProvider,
    },
  ],
})
export class AppModule {}
