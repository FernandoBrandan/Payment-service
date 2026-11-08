import { EntityId } from '../vo/entity-id.vo';
import { PaymentPreference } from '../payment-preference.entity';

export interface PaymentPreferenceRepository {
  findById(id: EntityId): Promise<PaymentPreference | null>;
  save(pref: PaymentPreference): Promise<void>;
}
