import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPublicToKnowledgeBase1766901000000
  implements MigrationInterface
{
  name = 'AddIsPublicToKnowledgeBase1766901000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "is_public" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "is_public"`,
    );
  }
}
