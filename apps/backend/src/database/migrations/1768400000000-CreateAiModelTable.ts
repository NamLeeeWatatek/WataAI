import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiModelTable1768400000000 implements MigrationInterface {
  name = 'CreateAiModelTable1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_models" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "display_name" character varying,
        "type" character varying NOT NULL,
        "provider_id" uuid NOT NULL,
        "owner_type" character varying NOT NULL,
        "owner_id" uuid NOT NULL,
        "config_id" uuid,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_models_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_provider_id" ON "ai_models" ("provider_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_owner_id" ON "ai_models" ("owner_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_config_id" ON "ai_models" ("config_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_models_owner_type" ON "ai_models" ("owner_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ai_models_owner_type"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_models_config_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_models_owner_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ai_models_provider_id"`);
    await queryRunner.query(`DROP TABLE "ai_models"`);
  }
}
