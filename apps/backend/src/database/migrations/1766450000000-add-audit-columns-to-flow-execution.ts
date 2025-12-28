import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToFlowExecution1766450000000
  implements MigrationInterface
{
  name = 'AddAuditColumnsToFlowExecution1766450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()`,
    );

    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD COLUMN IF NOT EXISTS "created_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD COLUMN IF NOT EXISTS "updated_by" uuid`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_flow_execution_created_at" ON "flow_execution" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_flow_execution_updated_at" ON "flow_execution" ("updated_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_flow_execution_created_by" ON "flow_execution" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_flow_execution_updated_by" ON "flow_execution" ("updated_by")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_flow_execution_updated_by"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_flow_execution_created_by"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_flow_execution_updated_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_flow_execution_created_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN IF EXISTS "updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN IF EXISTS "created_by"`,
    );

    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN IF EXISTS "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN IF EXISTS "created_at"`,
    );
  }
}
