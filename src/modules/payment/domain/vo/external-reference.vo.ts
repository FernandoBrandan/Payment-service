// src/domain/vo/external-reference.vo.ts
import { InvalidExternalReferenceError } from '../errors/vo.errors';

export class ExternalReference {
  private static readonly MAX_LENGTH = 255;

  private constructor(public readonly value: string) {}

  static from(orderId: string): ExternalReference {
    if (typeof orderId !== 'string') throw new InvalidExternalReferenceError('debe ser un string');
    const trimmed = orderId.trim();
    if (trimmed.length === 0) throw new InvalidExternalReferenceError('no puede estar vacía');
    if (trimmed.length > ExternalReference.MAX_LENGTH)
      throw new InvalidExternalReferenceError(`supera ${ExternalReference.MAX_LENGTH} caracteres`);
    return new ExternalReference(trimmed);
  }

  equals(other: ExternalReference): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
