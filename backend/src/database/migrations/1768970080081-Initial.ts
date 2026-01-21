import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1768970080081 implements MigrationInterface {
  name = 'Initial1768970080081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bot" DROP CONSTRAINT "FK_58487db73d419a07163400cd26b"
        `);
    await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "ai_provider_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ADD "ai_parameters" jsonb
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ADD "use_system_ai" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "bot"
            ADD "tags" text
        `);
    await queryRunner.query(`
            ALTER TABLE "bot"
            ADD "ai_config_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ALTER COLUMN "chunk_size"
            SET DEFAULT '800'
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ALTER COLUMN "chunk_overlap"
            SET DEFAULT '150'
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."creation_jobs_status_enum"
            RENAME TO "creation_jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."creation_jobs_status_enum" AS ENUM(
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                'DRAFT',
                'CANCELED'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum" USING "status"::"text"::"public"."creation_jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status"
            SET DEFAULT 'PENDING'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."creation_jobs_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "bot"
            ADD CONSTRAINT "FK_1d33a6f78b456305c3f053dc1bd" FOREIGN KEY ("ai_config_id") REFERENCES "ai_provider_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bot" DROP CONSTRAINT "FK_1d33a6f78b456305c3f053dc1bd"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."creation_jobs_status_enum_old" AS ENUM(
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED',
                'CANCELED'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum_old" USING "status"::"text"::"public"."creation_jobs_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "creation_jobs"
            ALTER COLUMN "status"
            SET DEFAULT 'PENDING'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."creation_jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."creation_jobs_status_enum_old"
            RENAME TO "creation_jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ALTER COLUMN "chunk_overlap"
            SET DEFAULT '200'
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ALTER COLUMN "chunk_size"
            SET DEFAULT '1000'
        `);
    await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "ai_config_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "tags"
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base" DROP COLUMN "use_system_ai"
        `);
    await queryRunner.query(`
            ALTER TABLE "knowledge_base" DROP COLUMN "ai_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "bot"
            ADD "ai_provider_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "bot"
            ADD CONSTRAINT "FK_58487db73d419a07163400cd26b" FOREIGN KEY ("ai_provider_id") REFERENCES "ai_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
