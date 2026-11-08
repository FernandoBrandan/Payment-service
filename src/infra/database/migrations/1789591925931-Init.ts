import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1789591925931 implements MigrationInterface {
  name = 'Init1789591925931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── payments (PaymentOrmEntity) ────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL,
        "provider" character varying(50) NOT NULL,
        "external_reference" character varying(100) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character varying(3) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "paid_at" TIMESTAMPTZ,
        "provider_payment_id" character varying(150),
        "raw_payload" jsonb,
        CONSTRAINT "UQ_payments_external_reference" UNIQUE ("external_reference"),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id")
      )
    `);

    // ── payment_preferences (PaymentPreferenceOrmEntity) ──────────
    await queryRunner.query(`
      CREATE TABLE "payment_preferences" (
        "id" uuid NOT NULL,
        "provider" character varying(50) NOT NULL,
        "external_reference" character varying(100) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" character varying(3) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "init_point" text,
        "provider_preference_id" character varying(150),
        "expires_at" TIMESTAMPTZ,
        CONSTRAINT "UQ_payment_preferences_external_reference" UNIQUE ("external_reference"),
        CONSTRAINT "PK_payment_preferences_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_preferences"`);
    await queryRunner.query(`DROP TABLE "payments"`);
  }
}
