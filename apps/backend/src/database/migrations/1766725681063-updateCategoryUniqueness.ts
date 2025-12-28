import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCategoryUniqueness1766725681063
  implements MigrationInterface
{
  name = 'UpdateCategoryUniqueness1766725681063';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "type" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23c05c292c439d77b0de816b50" ON "category" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb73208f151aa71cdd78f662d7" ON "category" ("slug") `,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_85857c8a275edcd68dc6c7a1a0e" UNIQUE ("slug", "type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "UQ_85857c8a275edcd68dc6c7a1a0e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb73208f151aa71cdd78f662d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23c05c292c439d77b0de816b50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "type" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`,
    );
  }
}
