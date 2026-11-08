import { StartCheckoutUseCase } from './../application/usecases/start-checkout.usecase';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PaymentProvider } from '../domain/enums';
import { Money } from '../domain/vo/money.vo';
import { Currency } from '../domain/vo/currency.vo';
import { ExternalReference } from '../domain/vo/external-reference.vo';
import { EntityId } from '../domain/vo/entity-id.vo';

// import { GetPaymentUseCase } from '../application/usecases/get-payment.usecase'

interface StartCheckoutBody {
  provider: PaymentProvider;
  externalReference: string;
  amount: string;
  currency: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly startCheckout: StartCheckoutUseCase,
    // private readonly getPayment: GetPaymentUseCase,
  ) {}

  @Post()
  async create(@Body() body: StartCheckoutBody) {
    // return this.startCheckout.execute()
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    // return this.getPayment.execute({ id: EntityId.from(id) })
  }
}
