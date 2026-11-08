import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ProviderPaymentSnapshot,
  PaymentProviderPort,
  CreatePreferenceInput,
  CreatePreferenceResult,
} from '../../domain/ports/payment-provider.port';
import { InitPoint } from '../../domain/vo/init-point.vo';
import { MercadoPagoApiError } from '@payment/domain/errors/domain.error';

@Injectable()
export class MercadoPagoProvider implements PaymentProviderPort {
  constructor(private readonly config: ConfigService) {}

  private get apiBase(): string {
    return this.config.get<string>('MP_API') ?? 'https://api.mercadopago.com';
  }

  async createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
    // 1. Llamar a la API de MercadoPago (SDK o HTTP)
    // 2. Mapear respuesta → { url: string }
    // 3. Manejar errores de la API
    // 4. (Opcional) persistir el paymentId externo
    const accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');

    const MP_API = this.apiBase;
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_reference: input.externalReference,
        items: [
          {
            title: input.description ?? 'Payment',
            quantity: 1,
            unit_price: Number(input.amount.toDecimalString()),
            currency_id: input.currency,
          },
        ],
        notification_url: input.notificationUrl,
        back_urls: input.backUrls,
        auto_return: 'approved',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {}
      throw new MercadoPagoApiError(res.status, body);
    }

    const data = (await res.json()) as {
      id: string;
      init_point: string;
      date_of_expiration?: string;
    };

    return {
      providerPreferenceId: data.id,
      initPoint: InitPoint.from(data.init_point),
      expiresAt: data.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
    };
  }

  async fetchPayment(providerPaymentId: string): Promise<ProviderPaymentSnapshot> {
    const accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');

    const MP_API = process.env.MP_API;
    const res = await fetch(`${MP_API}/v1/payments/${providerPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {}
      throw new MercadoPagoApiError(res.status, body);
    }

    const data = (await res.json()) as {
      id: number | string;
      external_reference: string;
      status: string;
      transaction_amount: number;
      currency_id: string;
      date_approved?: string;
      [k: string]: unknown;
    };

    return {
      providerPaymentId: String(data.id),
      externalReference: data.external_reference,
      status: data.status as ProviderPaymentSnapshot['status'],
      amount: String(data.transaction_amount),
      currency: data.currency_id,
      paidAt: data.date_approved ? new Date(data.date_approved) : undefined,
      raw: data as Record<string, unknown>,
    };
  }

  /**
   * MP firma con HMAC-SHA256 sobre el template:
   *   id:{data.id};request-id:{x-request-id};ts:{ts};
   * y la manda en headers:
   *   x-signature: ts=...,v1=...
   *   x-request-id: ...
   *   x-id / id (query) → data.id
   */
  verifyWebhookSignature(raw: string, headers: Record<string, string>, dataId: string): boolean {
    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret) throw new Error('MERCADOPAGO_WEBHOOK_SECRET is not configured');

    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];
    if (!signature || !requestId || !dataId) return false;

    const parts = signature.split(',').reduce<Record<string, string>>((acc, kv) => {
      const [k, v] = kv.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(template).digest('hex');

    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
