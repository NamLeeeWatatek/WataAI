import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmbeddingProviderIdToKb1768372985776
  implements MigrationInterface
{
  name = 'AddEmbeddingProviderIdToKb1768372985776';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "embedding_provider_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c16f10dd8e41dfcee3c7eb3f8" ON "knowledge_base" ("embedding_provider_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c16f10dd8e41dfcee3c7eb3f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "embedding_provider_id"`,
    );
  }
}
