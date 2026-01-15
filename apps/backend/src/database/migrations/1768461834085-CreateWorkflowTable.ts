import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowTable1768461834085 implements MigrationInterface {
    name = 'CreateWorkflowTable1768461834085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "workflows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "thumbnailUrl" character varying, "graph" jsonb NOT NULL DEFAULT '{}', "isPublic" boolean NOT NULL DEFAULT false, "category" character varying NOT NULL DEFAULT 'Draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_5b5757cc1cd86268019fef52e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "knowledge_base" ALTER COLUMN "embedding_model" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_9a1afdc4e604b491831ded3090c" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Clean up invalid references before adding constraints
        await queryRunner.query(`UPDATE "knowledge_base" SET "ai_config_id" = NULL WHERE "ai_config_id" IS NOT NULL AND "ai_config_id" NOT IN (SELECT "id" FROM "ai_provider_configs")`);
        await queryRunner.query(`UPDATE "knowledge_base" SET "embedding_config_id" = NULL WHERE "embedding_config_id" IS NOT NULL AND "embedding_config_id" NOT IN (SELECT "id" FROM "ai_provider_configs")`);

        await queryRunner.query(`ALTER TABLE "knowledge_base" ADD CONSTRAINT "FK_a07aa88feb9666bb12cecc03b96" FOREIGN KEY ("ai_config_id") REFERENCES "ai_provider_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_base" ADD CONSTRAINT "FK_579da2ba9875c11b6758ea92f70" FOREIGN KEY ("embedding_config_id") REFERENCES "ai_provider_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "knowledge_base" DROP CONSTRAINT "FK_579da2ba9875c11b6758ea92f70"`);
        await queryRunner.query(`ALTER TABLE "knowledge_base" DROP CONSTRAINT "FK_a07aa88feb9666bb12cecc03b96"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_9a1afdc4e604b491831ded3090c"`);
        await queryRunner.query(`ALTER TABLE "knowledge_base" ALTER COLUMN "embedding_model" SET NOT NULL`);
        await queryRunner.query(`DROP TABLE "workflows"`);
    }

}
