import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixEnumDraft1769051168399 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."creation_jobs_status_enum" ADD VALUE IF NOT EXISTS 'DRAFT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing enum values easily
  }
}
