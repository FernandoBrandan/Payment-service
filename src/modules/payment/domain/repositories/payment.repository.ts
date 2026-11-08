import { Payment } from '../payment.entity';
import { EntityId } from '../vo/entity-id.vo';
import { ExternalReference } from '../vo/external-reference.vo';
import { ProviderPaymentId } from '../vo/provider-payment-id.vo';

export interface PaymentRepository {
  findById(id: EntityId): Promise<Payment | null>;
  findByProviderPaymentId(id: ProviderPaymentId): Promise<Payment | null>;
  findByExternalReference(ref: ExternalReference): Promise<Payment | null>;
  save(payment: Payment): Promise<void>;
}
