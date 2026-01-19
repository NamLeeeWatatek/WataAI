import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagsToBot1768810112468 implements MigrationInterface {
  name = 'AddTagsToBot1768810112468';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bot" ADD "tags" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "tags"`);
  }
}
