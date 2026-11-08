// payment/src/domain/ports/payment-provider.port.ts
// Cualquier PSP (MP, Stripe) implementa ESTA interfaz.
// fetchPayment(): el webhook NUNCA se confía: siempre se re-consulta

import { Money } from '../vo/money.vo';
import { InitPoint } from '../vo/init-point.vo';

export interface PaymentProviderPort {
  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult>;
  fetchPayment(providerPaymentId: string): Promise<ProviderPaymentSnapshot>;
  verifyWebhookSignature(raw: string, headers: Record<string, string>, dataId: string): boolean;
}

export interface CreatePreferenceInput {
  externalReference: string; // OrderId
  amount: Money; // decimal como string, igual que en tu Money
  currency: string;
  description?: string;
  payerEmail?: string;
  notificationUrl: string; // tu /webhooks/mercadopago
  backUrls?: { success: string; failure: string; pending: string };
}

export interface CreatePreferenceResult {
  initPoint: InitPoint;
  providerPreferenceId: string;
  expiresAt?: Date;
}

export interface ProviderPaymentSnapshot {
  providerPaymentId: string;
  externalReference: string;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'refunded' | 'cancelled';
  amount: string;
  currency: string;
  paidAt?: Date;
  raw: Record<string, unknown>;
}
