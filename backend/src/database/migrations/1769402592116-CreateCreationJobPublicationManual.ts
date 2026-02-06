import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreationJobPublicationManual1769402592116
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Enum
    await queryRunner.query(
      `DO $$ BEGIN
                CREATE TYPE "public"."creation_job_publications_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'SCHEDULED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`,
    );

    // Create Table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "creation_job_publications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "job_id" uuid NOT NULL,
                "channel_id" uuid NOT NULL,
                "platform" character varying(50) NOT NULL,
                "status" "public"."creation_job_publications_status_enum" NOT NULL DEFAULT 'PENDING',
                "external_id" character varying,
                "url" text,
                "metadata" jsonb,
                "error" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_creation_job_publications" PRIMARY KEY ("id")
            )`,
    );

    // Create Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_creation_job_publications_job_id" ON "creation_job_publications" ("job_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_creation_job_publications_channel_id" ON "creation_job_publications" ("channel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_creation_job_publications_status" ON "creation_job_publications" ("status")`,
    );

    // Create FK (with check to avoid error if exists)
    await queryRunner.query(
      `DO $$ BEGIN
                ALTER TABLE "creation_job_publications" 
                ADD CONSTRAINT "FK_creation_job_publications_job_id" 
                FOREIGN KEY ("job_id") REFERENCES "creation_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "creation_job_publications" DROP CONSTRAINT IF EXISTS "FK_creation_job_publications_job_id"`,
    );

    // Drop Indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_creation_job_publications_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_creation_job_publications_channel_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_creation_job_publications_job_id"`,
    );

    // Drop Table
    await queryRunner.query(`DROP TABLE IF EXISTS "creation_job_publications"`);

    // Drop Enum
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."creation_job_publications_status_enum"`,
    );
  }
}
