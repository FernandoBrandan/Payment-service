// src/infrastructure/repositories/typeorm-payment.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { ExternalReference } from '../../domain/vo/external-reference.vo';
import { ProviderPaymentId } from '../../domain/vo/provider-payment-id.vo';
import { EntityId } from '../../domain/vo/entity-id.vo';

import { Payment } from '../../domain/payment.entity';
import { PaymentMapper } from '../persistence/payment.mappers';
import { PaymentOrmEntity } from '../persistence/payment.orm-entity';

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly ormRepo: Repository<PaymentOrmEntity>,
  ) {}

  async findById(id: EntityId): Promise<Payment | null> {
    try {
      const orm = await this.ormRepo.findOne({ where: { id: id.value } });
      return orm ? PaymentMapper.toDomain(orm) : null;
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  async findByProviderPaymentId(id: ProviderPaymentId): Promise<Payment | null> {
    try {
      const orm = await this.ormRepo.findOne({ where: { providerPaymentId: id.value } });
      return orm ? PaymentMapper.toDomain(orm) : null;
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  async findByExternalReference(ref: ExternalReference): Promise<Payment | null> {
    try {
      const orm = await this.ormRepo.findOne({ where: { externalReference: ref.value } });
      return orm ? PaymentMapper.toDomain(orm) : null;
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  async save(payment: Payment): Promise<void> {
    try {
      const entity = this.ormRepo.create(PaymentMapper.toPersistence(payment));
      await this.ormRepo.save(entity);
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any): never {
    const isConnectionError =
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('connect ETIMEDOUT') ||
      error.message?.includes('Connection terminated') ||
      error.message?.includes('Connection lost');
    if (isConnectionError) {
      throw new Error('InfrastructureException: Database connection failed', error);
    }
    throw error;
  }
}
