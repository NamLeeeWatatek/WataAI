import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileIsTemp1766730000000 implements MigrationInterface {
  name = 'AddFileIsTemp1766730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" ADD "is_temp" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "is_temp"`);
  }
}
