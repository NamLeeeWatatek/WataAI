import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKnowledgeBaseToCreationTool1768489439252
  implements MigrationInterface
{
  name = 'AddKnowledgeBaseToCreationTool1768489439252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD "knowledge_base_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81a8d057ebaa8ca6f7ed6cfe45" ON "creation_tool" ("knowledge_base_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81a8d057ebaa8ca6f7ed6cfe45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP COLUMN "knowledge_base_id"`,
    );
  }
}
