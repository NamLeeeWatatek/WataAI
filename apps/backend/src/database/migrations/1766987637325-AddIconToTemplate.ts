import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToTemplate1766987637325 implements MigrationInterface {
  name = 'AddIconToTemplate1766987637325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD "icon" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "icon"`);
  }
}
