import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentToCreationJobPublication1769407716521 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "creation_job_publications" ADD "content" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "creation_job_publications" DROP COLUMN "content"`
        );
    }
}
