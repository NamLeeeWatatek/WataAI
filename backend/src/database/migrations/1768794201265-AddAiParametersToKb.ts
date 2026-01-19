import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiParametersToKb1768794201265 implements MigrationInterface {
  name = 'AddAiParametersToKb1768794201265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "ai_parameters" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "chunk_size" SET DEFAULT '800'`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "chunk_overlap" SET DEFAULT '150'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "chunk_overlap" SET DEFAULT '200'`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ALTER COLUMN "chunk_size" SET DEFAULT '1000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "ai_parameters"`,
    );
  }
}
