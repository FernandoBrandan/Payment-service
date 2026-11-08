import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { PaymentProvider, PaymentStatus } from '../../domain/enums';

@Entity('payments')
export class PaymentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: PaymentProvider;

  @Column({ name: 'external_reference', type: 'varchar', length: 100, unique: true })
  externalReference: string;

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 30, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'provider_payment_id', type: 'varchar', length: 150, nullable: true })
  providerPaymentId: string | null;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;
}
