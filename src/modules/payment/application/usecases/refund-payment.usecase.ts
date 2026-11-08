// TODO(refunds): implementar refund end-to-end
//   1. provider.refundPayment(providerPaymentId, amount) → nuevo método en el port
//   2. payment.refund() (ya existe en la entidad)
//   3. repoPayment.save(payment)
//   4. validar: solo APPROVED puede refundear; soportar parciales a futuro
//   5. exponer POST /payments/:id/refund

// TODO(refunds): agregar al port
// refundPayment(providerPaymentId: string, amount?: Money): Promise<void>
