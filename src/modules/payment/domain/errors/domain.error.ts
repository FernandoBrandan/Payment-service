export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// mercado-pago.provider.ts
export class MercadoPagoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const code = (body as any)?.code ?? 'unknown';
    super(`MercadoPago ${status} ${code}`);
    this.name = 'MercadoPagoApiError';
  }
}

export abstract class DomainValidationError extends DomainError {}
export abstract class DomainConflictError extends DomainError {}
export abstract class DomainRuleError extends DomainError {}

export class DomainNotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  constructor(resource: string, id: string) {
    super(`${resource} ${id} no encontrado`);
  }
}
