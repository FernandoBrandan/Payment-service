import { PaymentProvider, PaymentStatus } from './enums';
import { Money } from './vo/money.vo';
import { EntityId } from './vo/entity-id.vo';
import { ExternalReference } from './vo/external-reference.vo';
import { ProviderPaymentId } from './vo/provider-payment-id.vo';
import { InvalidPaymentTransitionError } from './errors/vo.errors';

export interface IPayment {
  id: EntityId;
  provider: PaymentProvider;
  externalReference: ExternalReference;
  amount: Money;
  status: PaymentStatus;
  createdAt: Date;
  paidAt?: Date;
  providerPaymentId?: ProviderPaymentId;
  rawPayload?: Record<string, unknown>; // respuesta cruda de MP
  rejectedReason?: string;
  cancelledReason?: string;

  markInProcess(): void;
  approve(providerPaymentId: ProviderPaymentId, paidAt: Date): void;
  reject(reason?: string): void;
  refund(): void;
  isApproved(): boolean;
  isTerminal(): boolean;
}

export interface CreatePaymentProps {
  id: EntityId;
  provider: PaymentProvider;
  externalReference: ExternalReference;
  amount: Money;
  createdAt?: Date;
}

export class Payment implements IPayment {
  private static readonly TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.IN_PROCESS,
      PaymentStatus.APPROVED,
      PaymentStatus.REJECTED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.IN_PROCESS]: [PaymentStatus.APPROVED, PaymentStatus.REJECTED, PaymentStatus.CANCELLED],
    [PaymentStatus.APPROVED]: [PaymentStatus.REFUNDED],
    [PaymentStatus.REJECTED]: [],
    [PaymentStatus.REFUNDED]: [],
    [PaymentStatus.CANCELLED]: [],
  };

  constructor(
    public readonly id: EntityId,
    public readonly provider: PaymentProvider,
    public readonly externalReference: ExternalReference,
    public readonly amount: Money,
    private _status: PaymentStatus,
    public readonly createdAt: Date,
    public paidAt?: Date,
    public providerPaymentId?: ProviderPaymentId,
    public rawPayload?: Record<string, unknown>,
    public rejectedReason?: string,
    public cancelledReason?: string,
  ) {}

  static create(props: CreatePaymentProps): Payment {
    return new Payment(
      props.id,
      props.provider,
      props.externalReference,
      props.amount,
      PaymentStatus.PENDING,
      props.createdAt ?? new Date(),
    );
  }

  get status(): PaymentStatus {
    return this._status;
  }

  approve(providerPaymentId: ProviderPaymentId, paidAt: Date): void {
    this.transitionTo(PaymentStatus.APPROVED);
    this.providerPaymentId = providerPaymentId;
    this.paidAt = paidAt;
  }

  isApproved(): boolean {
    return this._status === PaymentStatus.APPROVED;
  }

  markInProcess(): void {
    this.transitionTo(PaymentStatus.IN_PROCESS);
  }

  reject(reason?: string): void {
    this.transitionTo(PaymentStatus.REJECTED);
    this.rejectedReason = reason;
  }

  refund(): void {
    this.transitionTo(PaymentStatus.REFUNDED);
  }

  isTerminal(): boolean {
    return Payment.TRANSITIONS[this._status].length === 0;
  }

  cancelOrder(reason?: string): void {
    this.transitionTo(PaymentStatus.CANCELLED);
    this.cancelledReason = reason;
  }

  canBeCancelled(): boolean {
    return Payment.TRANSITIONS[this._status].includes(PaymentStatus.CANCELLED);
  }

  matchesStatus(s: PaymentStatus): boolean {
    return this.status === s;
  }

  setRawPayload(raw: Record<string, unknown>): void {
    this.rawPayload = raw;
  }

  private transitionTo(to: PaymentStatus): void {
    if (this._status === to) return;
    const allowed = Payment.TRANSITIONS[this._status];
    if (!allowed.includes(to)) throw new InvalidPaymentTransitionError(this._status, to);
    this._status = to;
  }
}
