// src/infrastructure/persistence/payment-preference.orm-entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { PaymentPreferenceStatus, PaymentProvider } from '../../domain/enums';

@Entity('payment_preferences')
export class PaymentPreferenceOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: PaymentProvider;

  @Column({ name: 'external_reference', type: 'varchar', length: 100, unique: true })
  externalReference: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: PaymentPreferenceStatus.PENDING,
  })
  status: PaymentPreferenceStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @Column({
    name: 'init_point',
    type: 'text',
    nullable: true,
  })
  initPoint: string | null;

  @Column({
    name: 'provider_preference_id',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  providerPreferenceId: string | null;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  expiresAt: Date | null;
}
