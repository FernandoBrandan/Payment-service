// src/domain/vo/provider-payment-id.vo.ts
import { InvalidProviderPaymentIdError } from '../errors/vo.errors';

export class ProviderPaymentId {
  private static readonly MAX_LENGTH = 255;

  private constructor(public readonly value: string) {}

  static from(id: string): ProviderPaymentId {
    if (typeof id !== 'string') throw new InvalidProviderPaymentIdError('debe ser un string');
    const trimmed = id.trim();
    if (trimmed.length === 0) throw new InvalidProviderPaymentIdError('no puede estar vacío');
    if (trimmed.length > ProviderPaymentId.MAX_LENGTH)
      throw new InvalidProviderPaymentIdError(`supera ${ProviderPaymentId.MAX_LENGTH} caracteres`);
    return new ProviderPaymentId(trimmed);
  }

  equals(other: ProviderPaymentId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
