import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifiedAiProviderConfig1768391830400
  implements MigrationInterface {
  name = 'UnifiedAiProviderConfig1768391830400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop old indices
    // 1. Drop old indices
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_models_provider_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_models_owner_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_models_config_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ai_models_owner_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_8ae166c823e535eb731f333522"`,
    ); // ai_provider_id
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6c16f10dd8e41dfcee3c7eb3f8"`,
    ); // embedding_provider_id

    // 2. Add new columns
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "display_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "config" jsonb DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "model_list" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "ai_config_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "embedding_config_id" uuid`,
    );

    // 3. Migrate Data (Old columns -> New JSONB config)
    // We construct the JSON object from existing columns.
    // Handle NULLs gracefully if needed, though most were NOT NULL.
    await queryRunner.query(`
      UPDATE "ai_provider_configs"
      SET "config" = jsonb_strip_nulls(jsonb_build_object(
        'apiKey', "api_key",
        'model', "model",
        'baseUrl', "base_url",
        'baseURL', "base_url",
        'apiVersion', "api_version",
        'timeout', "timeout",
        'useStream', "use_stream"
      ))
    `);

    // Migrate KnowledgeBase IDs
    await queryRunner.query(`
      UPDATE "knowledge_base" SET "ai_config_id" = "ai_provider_id"
    `);
    await queryRunner.query(`
      UPDATE "knowledge_base" SET "embedding_config_id" = "embedding_provider_id"
    `);

    // Remove default on method before dropping? No, config is nullable or default?
    // We set default '{}' above to avoid not-null errors initially,
    // but the final schema might want NOT NULL.
    // The previous migration generated "NOT NULL" for config.
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ALTER COLUMN "config" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ALTER COLUMN "config" DROP DEFAULT`,
    );

    // 4. Drop old columns
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "timeout"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "use_stream"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "model"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "api_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "base_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "api_version"`,
    );

    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "ai_provider_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "embedding_provider_id"`,
    );

    // 5. Other Alterations
    await queryRunner.query(
      `ALTER TABLE "ai_models" ALTER COLUMN "type" SET DEFAULT 'chat'`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "embedding_model" DROP DEFAULT`,
    );

    // 6. Create Indices
    await queryRunner.query(
      `CREATE INDEX "IDX_b2e64c27a46f4707b83ea5ee75" ON "ai_models" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_959da1d5b224333f044c958feb" ON "ai_models" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e94c017a761ef1a4655619fd8" ON "ai_models" ("owner_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05b8d0a1515429ebc110544efc" ON "ai_models" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba6a31f928ecb86e40f544081e" ON "ai_models" ("config_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a07aa88feb9666bb12cecc03b9" ON "knowledge_base" ("ai_config_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_579da2ba9875c11b6758ea92f7" ON "knowledge_base" ("embedding_config_id") `,
    );

    // 7. Add Constraints
    // Clean up orphaned models first
    await queryRunner.query(
      `DELETE FROM "ai_models" WHERE "config_id" IS NOT NULL AND "config_id" NOT IN (SELECT "id" FROM "ai_provider_configs")`,
    );

    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD CONSTRAINT "FK_ba6a31f928ecb86e40f544081e4" FOREIGN KEY ("config_id") REFERENCES "ai_provider_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD CONSTRAINT "FK_959da1d5b224333f044c958feb5" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_models" DROP CONSTRAINT "FK_959da1d5b224333f044c958feb5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_models" DROP CONSTRAINT "FK_ba6a31f928ecb86e40f544081e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_579da2ba9875c11b6758ea92f7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a07aa88feb9666bb12cecc03b9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba6a31f928ecb86e40f544081e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05b8d0a1515429ebc110544efc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e94c017a761ef1a4655619fd8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_959da1d5b224333f044c958feb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2e64c27a46f4707b83ea5ee75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "embedding_model" SET DEFAULT 'text-embedding-3-small'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_models" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "embedding_config_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "ai_config_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "model_list"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP COLUMN "display_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "embedding_provider_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "ai_provider_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "api_version" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "base_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "api_key" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "model" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "use_stream" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD "timeout" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c16f10dd8e41dfcee3c7eb3f8" ON "knowledge_base" ("embedding_provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ae166c823e535eb731f333522" ON "knowledge_base" ("ai_provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_models_owner_type" ON "ai_models" ("owner_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_models_config_id" ON "ai_models" ("config_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_models_owner_id" ON "ai_models" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_models_provider_id" ON "ai_models" ("provider_id") `,
    );
  }
}
