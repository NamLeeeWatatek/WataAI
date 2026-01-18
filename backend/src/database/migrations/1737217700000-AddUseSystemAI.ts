import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUseSystemAI1737217700000 implements MigrationInterface {
    name = 'AddUseSystemAI1737217700000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "knowledge_base" ADD "use_system_ai" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "knowledge_base" DROP COLUMN "use_system_ai"`,
        );
    }
}
