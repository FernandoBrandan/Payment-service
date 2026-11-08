import { PaymentPreferenceStatus, PaymentProvider } from './enums';
import { Money } from './vo/money.vo';
import { EntityId } from './vo/entity-id.vo';
import { InitPoint } from './vo/init-point.vo';
import { ExternalReference } from './vo/external-reference.vo';
import {
  InvalidProviderError,
  InvalidPreferenceAmountError,
  InvalidPreferenceExternalReferenceError,
  InvalidPreferenceInitPointError,
  InvalidPreferenceTransitionError,
  InvalidProviderPreferenceIdError,
} from './errors/vo.errors';

export interface IPaymentPreference {
  id: EntityId;
  provider: PaymentProvider;
  externalReference: ExternalReference; // → OrderId
  amount: Money;
  status: PaymentPreferenceStatus;
  createdAt: Date;
  initPoint?: InitPoint; // URL del checkout
  providerPreferenceId?: string; // id de MP
  expiresAt?: Date;

  isExpired(now: Date): boolean;
  isPending(): boolean;
  isReady(): boolean;
  canBeReused(now: Date): boolean;
  canAttachProviderData(): boolean;
}

export interface CreatePaymentPreferenceProps {
  id: EntityId;
  provider: PaymentProvider;
  externalReference: ExternalReference;
  amount: Money;
  ttlMs?: number;
  createdAt?: Date;
}

export interface AttachProviderDataProps {
  initPoint: InitPoint;
  providerPreferenceId: string;
  expiresAt?: Date;
}

export class PaymentPreference implements IPaymentPreference {
  constructor(
    public readonly id: EntityId,
    public readonly provider: PaymentProvider,
    public readonly externalReference: ExternalReference,
    public readonly amount: Money,
    public readonly status: PaymentPreferenceStatus,
    public readonly createdAt: Date,
    public readonly initPoint?: InitPoint,
    public readonly providerPreferenceId?: string,
    public readonly expiresAt?: Date,
  ) {}

  static create(props: CreatePaymentPreferenceProps): PaymentPreference {
    const createdAt = props.createdAt ?? new Date();
    const expiresAt = props.ttlMs != null ? new Date(createdAt.getTime() + props.ttlMs) : undefined;
    return new PaymentPreference(
      props.id,
      validateProvider(props.provider),
      validateExternalReference(props.externalReference),
      validateAmount(props.amount),
      PaymentPreferenceStatus.PENDING,
      createdAt,
      undefined,
      undefined,
      expiresAt,
    );
  }

  // static reconstitute(props: IPaymentPreference): PaymentPreference {
  //   return new PaymentPreference(
  //     props.id,
  //     props.provider,
  //     props.externalReference,
  //     props.amount,
  //     props.status,
  //     props.createdAt,
  //     props.initPoint,
  //     props.providerPreferenceId,
  //     props.expiresAt,
  //   )
  // }

  /** Segunda fase: MP respondió y traemos el link + el id del provider. */
  attachProviderData(input: AttachProviderDataProps): PaymentPreference {
    if (this.status !== PaymentPreferenceStatus.PENDING) {
      throw new InvalidPreferenceTransitionError(this.status, PaymentPreferenceStatus.READY);
    }

    return new PaymentPreference(
      this.id,
      this.provider,
      this.externalReference,
      this.amount,
      PaymentPreferenceStatus.READY,
      this.createdAt,
      validateInitPoint(input.initPoint),
      validateProviderPreferenceId(input.providerPreferenceId),
      input.expiresAt ?? this.expiresAt,
    );
  }

  // expiresAt se guarda pero nadie lo usa
  // - ¿si expiró y el Payment sigue PENDING, permitimos crear una nueva preference?
  // → lógica en StartCheckoutUseCase: buscar preference vigente antes de crear
  // - ¿si expiró y el Payment ya está APPROVED, la ignoramos?
  // - ¿job que marca preferences expiradas como CANCELLED?
  // Ver también: PaymentPreference.isExpired() y canBeReused() ya existen, pero nadie los llama.

  isExpired(now = new Date()): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt.getTime() <= now.getTime();
  }

  isPending(): boolean {
    return this.status === PaymentPreferenceStatus.PENDING;
  }

  isReady(): boolean {
    return this.status === PaymentPreferenceStatus.READY;
  }

  canBeReused(now: Date = new Date()): boolean {
    return this.isReady() && !this.isExpired(now);
  }

  canAttachProviderData(): boolean {
    return this.isPending();
  }
}

function validateProvider(provider: PaymentProvider): PaymentProvider {
  if (!provider) throw new InvalidProviderError('es requerido');
  if (!Object.values(PaymentProvider).includes(provider)) throw new InvalidProviderError(`"${provider}" no soportado`);
  return provider;
}

function validateExternalReference(ref: ExternalReference): ExternalReference {
  if (!ref) throw new InvalidPreferenceExternalReferenceError('es requerido');
  return ref;
}

function validateAmount(amount: Money): Money {
  if (!(amount instanceof Money)) throw new InvalidPreferenceAmountError('debe ser un valor monetario válido');
  if (!amount.isPositive()) throw new InvalidPreferenceAmountError('debe ser un valor positivo');
  return amount;
}

function validateInitPoint(initPoint: InitPoint): InitPoint {
  if (!(initPoint instanceof InitPoint)) throw new InvalidPreferenceInitPointError('debe ser un InitPoint válido');
  return initPoint;
}

function validateProviderPreferenceId(id: string): string {
  if (!id) throw new InvalidProviderPreferenceIdError('es requerido');
  if (typeof id !== 'string') throw new InvalidProviderPreferenceIdError('debe ser un string');
  if (id.trim().length === 0) throw new InvalidProviderPreferenceIdError('no puede estar vacío');
  return id;
}
