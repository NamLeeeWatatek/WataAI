import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddErrorToCreationJobs1766573528590 implements MigrationInterface {
  name = 'AddErrorToCreationJobs1766573528590';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "creation_jobs" ADD "error" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "creation_jobs" DROP COLUMN "error"`);
  }
}
