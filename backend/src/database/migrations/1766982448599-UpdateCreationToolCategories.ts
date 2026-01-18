import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCreationToolCategories1766982448599
  implements MigrationInterface
{
  name = 'UpdateCreationToolCategories1766982448599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP CONSTRAINT "FK_526f0affaf8cba58a06823a529b"`,
    );
    await queryRunner.query(
      `CREATE TABLE "creation_tool_categories" ("creation_tool_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_f94acbaba4970e6486187c76205" PRIMARY KEY ("creation_tool_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b9e45858d57b5165fcca360a85" ON "creation_tool_categories" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5494fe4ec53e6325eafaab114f" ON "creation_tool_categories" ("category_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP COLUMN "category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool_categories" ADD CONSTRAINT "FK_b9e45858d57b5165fcca360a853" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool_categories" ADD CONSTRAINT "FK_5494fe4ec53e6325eafaab114f9" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creation_tool_categories" DROP CONSTRAINT "FK_5494fe4ec53e6325eafaab114f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool_categories" DROP CONSTRAINT "FK_b9e45858d57b5165fcca360a853"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD "category_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5494fe4ec53e6325eafaab114f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b9e45858d57b5165fcca360a85"`,
    );
    await queryRunner.query(`DROP TABLE "creation_tool_categories"`);
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD CONSTRAINT "FK_526f0affaf8cba58a06823a529b" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
