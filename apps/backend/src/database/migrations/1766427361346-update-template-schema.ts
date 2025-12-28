import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTemplateSchema1766427361346 implements MigrationInterface {
  name = 'UpdateTemplateSchema1766427361346';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" DROP CONSTRAINT "FK_dd8bd6dec0d0732d267d6a826e7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_22a26194e6dca7ad6913d6152d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5a2e06b4f4afbdaee17a9df17"`,
    );
    await queryRunner.query(
      `CREATE TABLE "style_preset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "config" jsonb NOT NULL, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_16395360d5d5e38e971b4045841" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f79152848380534cf3a31add03" ON "style_preset" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c77899995a4a2887a85d722279" ON "style_preset" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dedfea394088ed136ddadeee89" ON "project" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cb157e3d3ab8abd16251129db" ON "project" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."generation_job_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "generation_job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "user_id" uuid, "input_data" jsonb NOT NULL, "output_data" jsonb, "status" "public"."generation_job_status_enum" NOT NULL DEFAULT 'pending', "error" text, "project_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0fcaa0aa0c5e6620b8d5e1dce12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d9817f15f65160045f6ce17a7" ON "generation_job" ("template_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85bb46ab0e7487aac995d9f4ab" ON "generation_job" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_329b3c559505b27f6971e78889" ON "generation_job" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cae7fcf4df2fef4e5669b6f3fb" ON "generation_job" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "character" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "metadata" jsonb, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6c4aec48c564968be15078b8ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d80158dde1461b74ed8499e7d8" ON "character" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6f45be0cd8b83f0b05b66f360" ON "character" ("workspace_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP COLUMN "bot_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP COLUMN "expiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP COLUMN "accessToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP COLUMN "refreshToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "prompt_template" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "execution_config" jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "template" ADD "form_schema" jsonb`);
    await queryRunner.query(`ALTER TABLE "template" ADD "input_schema" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD "access_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "start_char" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "start_char" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "end_char" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "end_char" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "token_count" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "token_count" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ALTER COLUMN "metadata" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c8e6bf48a8e54a880d7f36255" ON "kb_document" ("metadata") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7c3ed343e7f845aa8cde41ec6" ON "conversation" ("metadata") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ef021fc5aaa4d1f58fad2ab90" ON "message" ("metadata") `,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5" FOREIGN KEY ("credential_id") REFERENCES "channel_credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ef021fc5aaa4d1f58fad2ab90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7c3ed343e7f845aa8cde41ec6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c8e6bf48a8e54a880d7f36255"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ALTER COLUMN "metadata" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "token_count" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "token_count" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "end_char" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "end_char" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "start_char" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_chunk" ALTER COLUMN "start_char" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP COLUMN "access_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "input_schema"`,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "form_schema"`);
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "execution_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "prompt_template"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD "refreshToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD "accessToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD "expiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD "bot_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6f45be0cd8b83f0b05b66f360"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d80158dde1461b74ed8499e7d8"`,
    );
    await queryRunner.query(`DROP TABLE "character"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cae7fcf4df2fef4e5669b6f3fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_329b3c559505b27f6971e78889"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85bb46ab0e7487aac995d9f4ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d9817f15f65160045f6ce17a7"`,
    );
    await queryRunner.query(`DROP TABLE "generation_job"`);
    await queryRunner.query(`DROP TYPE "public"."generation_job_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5cb157e3d3ab8abd16251129db"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dedfea394088ed136ddadeee89"`,
    );
    await queryRunner.query(`DROP TABLE "project"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c77899995a4a2887a85d722279"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f79152848380534cf3a31add03"`,
    );
    await queryRunner.query(`DROP TABLE "style_preset"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a5a2e06b4f4afbdaee17a9df17" ON "channel_connection" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22a26194e6dca7ad6913d6152d" ON "channel_connection" ("credential_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" ADD CONSTRAINT "FK_dd8bd6dec0d0732d267d6a826e7" FOREIGN KEY ("active_version_id") REFERENCES "flow_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5" FOREIGN KEY ("credential_id") REFERENCES "channel_credential"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
