import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryType1766725239101 implements MigrationInterface {
  name = 'AddCategoryType1766725239101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "type" character varying DEFAULT 'system'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63ad76a14a8321d22dc0a5e704" ON "category" ("type") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63ad76a14a8321d22dc0a5e704"`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`);
  }
}
