// src/infrastructure/repositories/typeorm-payment-preference.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentPreferenceRepository } from '../../domain/repositories/payment-preference.repository';
import { EntityId } from '../../domain/vo/entity-id.vo';

import { PaymentPreference } from '../../domain/payment-preference.entity';
import { PaymentPreferenceMapper } from '../persistence/payment-preference.mappers';
import { PaymentPreferenceOrmEntity } from '../persistence/payment-preference.orm-entity';

@Injectable()
export class TypeOrmPaymentPreferenceRepository implements PaymentPreferenceRepository {
  constructor(
    @InjectRepository(PaymentPreferenceOrmEntity)
    private readonly ormRepo: Repository<PaymentPreferenceOrmEntity>,
  ) {}

  async findById(id: EntityId): Promise<PaymentPreference | null> {
    try {
      const orm = await this.ormRepo.findOne({ where: { id: id.value } });
      return orm ? PaymentPreferenceMapper.toDomain(orm) : null;
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  async save(pref: PaymentPreference): Promise<void> {
    try {
      const entity = this.ormRepo.create(PaymentPreferenceMapper.toPersistence(pref));
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
