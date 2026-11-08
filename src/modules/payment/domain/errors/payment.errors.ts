// src/modules/payment/domain/errors/payment.errors.ts
import { DomainConflictError, DomainRuleError, DomainValidationError } from '@common/domain/errors';

// ── VOs payment-specific ──────────────────────────────────
export class InvalidInitPointError extends DomainValidationError {
  readonly code = 'invalid_init_point';
  constructor(reason: string) {
    super(`InitPoint inválido: ${reason}`);
  }
}

export class InvalidProviderPaymentIdError extends DomainValidationError {
  readonly code = 'invalid_provider_payment_id';
  constructor(reason = 'debe ser un string no vacío de hasta 255 caracteres') {
    super(`ProviderPaymentId inválido: ${reason}`);
  }
}

export class InvalidExternalReferenceError extends DomainValidationError {
  readonly code = 'invalid_external_reference';
  constructor(reason: string) {
    super(`ExternalReference inválida: ${reason}`);
  }
}

// ── PaymentPreference ─────────────────────────────────────
export class InvalidProviderError extends DomainValidationError {
  readonly code = 'invalid_provider';
  constructor(reason: string) {
    super(`PaymentPreference.provider inválido: ${reason}`);
  }
}
export class InvalidPreferenceExternalReferenceError extends DomainValidationError {
  readonly code = 'invalid_preference_external_reference';
  constructor(reason: string) {
    super(`PaymentPreference.externalReference inválida: ${reason}`);
  }
}
export class InvalidPreferenceAmountError extends DomainValidationError {
  readonly code = 'invalid_preference_amount';
  constructor(reason: string) {
    super(`PaymentPreference.amount inválido: ${reason}`);
  }
}
export class InvalidPreferenceInitPointError extends DomainValidationError {
  readonly code = 'invalid_preference_init_point';
  constructor(reason: string) {
    super(`PaymentPreference.initPoint inválido: ${reason}`);
  }
}
export class InvalidProviderPreferenceIdError extends DomainValidationError {
  readonly code = 'invalid_provider_preference_id';
  constructor(reason: string) {
    super(`PaymentPreference.providerPreferenceId inválido: ${reason}`);
  }
}

// ── Transiciones ──────────────────────────────────────────
export class InvalidPaymentTransitionError extends DomainConflictError {
  readonly code = 'invalid_payment_transition';
  constructor(from: string, to: string) {
    super(`Transición de pago inválida: ${from} → ${to}`);
  }
}
export class InvalidPreferenceTransitionError extends DomainConflictError {
  readonly code = 'invalid_preference_transition';
  constructor(from: string, to: string) {
    super(`Transición de preference inválida: ${from} → ${to}`);
  }
}

// ── Webhook ───────────────────────────────────────────────
export class WebhookSnapshotMismatchError extends DomainRuleError {
  readonly code = 'webhook_snapshot_mismatch';
  constructor(detail: string) {
    super(`Webhook snapshot no coincide con el Payment local → ${detail}`);
  }
}
