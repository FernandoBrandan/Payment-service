import { Controller, Headers, Post, Query, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

import { HandleWebhookUseCase } from '../application/usecases/handle-webhook.usecase';

interface MpWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string | number };
}

@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  constructor(private readonly handleWebhook: HandleWebhookUseCase) {}

  @Post()
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Query('data.id') dataIdFromQuery: string | undefined,
    @Headers() headers: Record<string, string>,
  ) {
    const body = (req.body ?? {}) as MpWebhookBody;

    // MP manda `data.id` en el body. Fallback a query para IPN / versiones viejas.
    const dataId = body.data?.id != null ? String(body.data.id) : dataIdFromQuery;

    // No es un evento de pago (ej: merchant_order, plan). ACKeamos sin procesar.
    if (!dataId || (body.type && body.type !== 'payment')) {
      return { ok: true };
    }

    const raw = req.rawBody?.toString('utf8') ?? '';
    await this.handleWebhook.execute({
      providerPaymentId: dataId,
      raw,
      headers,
    });
    return { ok: true };
  }
}

// POST   /webhooks/mercadopago  → HandleWebhookUseCase
//   - raw body (necesitás rawBody: true en NestFactory.create)
//   - header x-signature, x-request-id
//   - SIEMPRE responder 200 salvo firma inválida (MP reintenta si no)
