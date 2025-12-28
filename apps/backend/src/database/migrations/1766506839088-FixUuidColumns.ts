import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUuidColumns1766506839088 implements MigrationInterface {
  name = 'FixUuidColumns1766506839088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_creation_tool_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_creation_tool_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_creation_tool_category"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_creation_tool_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_creation_tool_workspace_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_template_creation_tool_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_generation_job_creation_tool_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" DROP COLUMN "casdoor_role_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_63b51505950c7d3dd877c448acb"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "casdoor_id"`);
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP COLUMN "workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD "workspace_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "creation_tool_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "creation_tool_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941289df174d4ece7998279a6c"`,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "template" ADD "created_by" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f8b9d372187ad54c33210721d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "workspace_id"`,
    );
    await queryRunner.query(`ALTER TABLE "template" ADD "workspace_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_39f0a0ce96e591d2aff915fb32" ON "creation_tool" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712006d033481a0b3e43313276" ON "creation_tool" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94cd8357870d2797137a8464f1" ON "creation_tool" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a0e54dd330805ccb6486814ef" ON "creation_tool" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd6e013d98ac33e10aea9137cc" ON "creation_tool" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b6a7e06a23a072d065e6790dc" ON "template" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_941289df174d4ece7998279a6c" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f8b9d372187ad54c33210721d" ON "template" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e981766710199aee9044059535" ON "generation_job" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_9b6a7e06a23a072d065e6790dcb" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation_job" ADD CONSTRAINT "FK_2d9817f15f65160045f6ce17a76" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation_job" DROP CONSTRAINT "FK_2d9817f15f65160045f6ce17a76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_9b6a7e06a23a072d065e6790dcb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e981766710199aee9044059535"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f8b9d372187ad54c33210721d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941289df174d4ece7998279a6c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b6a7e06a23a072d065e6790dc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd6e013d98ac33e10aea9137cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a0e54dd330805ccb6486814ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94cd8357870d2797137a8464f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_712006d033481a0b3e43313276"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39f0a0ce96e591d2aff915fb32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "workspace_id" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f8b9d372187ad54c33210721d" ON "template" ("workspace_id") `,
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "created_by"`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD "created_by" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_941289df174d4ece7998279a6c" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "creation_tool_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD "creation_tool_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP COLUMN "workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD "workspace_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "casdoor_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_63b51505950c7d3dd877c448acb" UNIQUE ("casdoor_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "role" ADD "casdoor_role_name" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_generation_job_creation_tool_id" ON "generation_job" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_template_creation_tool_id" ON "template" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creation_tool_workspace_id" ON "creation_tool" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creation_tool_is_active" ON "creation_tool" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creation_tool_category" ON "creation_tool" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creation_tool_slug" ON "creation_tool" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_creation_tool_name" ON "creation_tool" ("name") `,
    );
  }
}
