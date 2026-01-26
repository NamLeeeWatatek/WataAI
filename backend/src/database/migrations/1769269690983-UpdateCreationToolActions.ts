import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCreationToolActions1769269690983
  implements MigrationInterface
{
  name = 'UpdateCreationToolActions1769269690983';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "creation_tool" ADD "actions" jsonb`);
    await queryRunner.query(
      `ALTER TYPE "public"."creation_jobs_status_enum" RENAME TO "creation_jobs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DRAFT', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum" USING "status"::"text"::"public"."creation_jobs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."creation_jobs_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum_old" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum_old" USING "status"::"text"::"public"."creation_jobs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."creation_jobs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."creation_jobs_status_enum_old" RENAME TO "creation_jobs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP COLUMN "actions"`,
    );
  }
}
