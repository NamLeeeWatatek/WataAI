import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreationJobsTable1766509401043 implements MigrationInterface {
  name = 'AddCreationJobsTable1766509401043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "creation_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."creation_jobs_status_enum" NOT NULL DEFAULT 'PENDING', "creation_tool_id" uuid NOT NULL, "input_data" jsonb NOT NULL, "output_data" jsonb, "progress" double precision NOT NULL DEFAULT '0', "created_by" uuid, "workspace_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0470db42c173417a5d97582dfae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_165945df826afa8e2598cad390" ON "creation_jobs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0860b0fd7e2de8558dc7287b60" ON "creation_jobs" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e0a3845e1d887f9c3397ca91d" ON "creation_jobs" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38595fae8b3f5c7ef884a2bdef" ON "creation_jobs" ("workspace_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ADD CONSTRAINT "FK_0860b0fd7e2de8558dc7287b606" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" DROP CONSTRAINT "FK_0860b0fd7e2de8558dc7287b606"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38595fae8b3f5c7ef884a2bdef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e0a3845e1d887f9c3397ca91d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0860b0fd7e2de8558dc7287b60"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_165945df826afa8e2598cad390"`,
    );
    await queryRunner.query(`DROP TABLE "creation_jobs"`);
    await queryRunner.query(`DROP TYPE "public"."creation_jobs_status_enum"`);
  }
}
