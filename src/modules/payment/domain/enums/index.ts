export enum PaymentProvider {
  MERCADO_PAGO = 'MERCADO_PAGO',
  STRIPE = 'STRIPE',
}

export enum PaymentStatus {
  PENDING = 'PENDING', // preference creada, nadie pagó
  IN_PROCESS = 'IN_PROCESS', // MP lo está procesando
  APPROVED = 'APPROVED', // pagado → dispara ledger
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentPreferenceStatus {
  PENDING = 'PENDING', // creada local, MP aún no respondió
  READY = 'READY', // MP devolvió initPoint + providerPreferenceId
}
