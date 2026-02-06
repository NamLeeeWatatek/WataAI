import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetTable1770358994809 implements MigrationInterface {
    name = 'CreateAssetTable1770358994809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Handle creation_job_publications_status_enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."creation_job_publications_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'SCHEDULED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Handle creation_job_publications table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "creation_job_publications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "job_id" uuid NOT NULL, 
                "channel_id" uuid NOT NULL, 
                "platform" character varying(50) NOT NULL, 
                "status" "public"."creation_job_publications_status_enum" NOT NULL DEFAULT 'PENDING', 
                "external_id" character varying, 
                "url" text, 
                "metadata" jsonb, 
                "error" text, 
                "content" text, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_creation_job_publications_id" PRIMARY KEY ("id")
            )
        `);

        // Handle creation_job_publications indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_publication_job_id" ON "creation_job_publications" ("job_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_publication_channel_id" ON "creation_job_publications" ("channel_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_publication_status" ON "creation_job_publications" ("status")`);

        // Handle asset_type_enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."asset_type_enum" AS ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'TEXT', 'OTHER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Handle asset table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "asset" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "type" "public"."asset_type_enum" NOT NULL DEFAULT 'OTHER', 
                "url" character varying NOT NULL, 
                "file_id" uuid, 
                "job_id" uuid, 
                "workspace_id" uuid NOT NULL, 
                "created_by" uuid, 
                "metadata" jsonb, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_asset_id" PRIMARY KEY ("id")
            )
        `);

        // Handle asset indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_name" ON "asset" ("name")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_type" ON "asset" ("type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_file_id" ON "asset" ("file_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_job_id" ON "asset" ("job_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_workspace_id" ON "asset" ("workspace_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_created_by" ON "asset" ("created_by")`);

        // Handle creation_tool actions
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "creation_tool" ADD COLUMN "actions" jsonb;
            EXCEPTION
                WHEN duplicate_column THEN null;
            END $$;
        `);

        // Handle foreign keys safely
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "creation_job_publications" ADD CONSTRAINT "FK_publication_job_id" FOREIGN KEY ("job_id") REFERENCES "creation_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "asset"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."asset_type_enum"`);
        // We don't drop creation_job_publications here because it might be used by other migrations
    }

}
