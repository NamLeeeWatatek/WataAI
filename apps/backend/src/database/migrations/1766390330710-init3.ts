import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init31766390330710 implements MigrationInterface {
  name = 'Init31766390330710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a25737b8d827c719c2b8a2825"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e1a55c8b86d460bde0465b7e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_faf46b9b3c88b592f3b0c058b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9767eb6b4e02e425e9b8e8e7c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_flow_execution_created_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_flow_execution_updated_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_flow_execution_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_flow_execution_updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "input_data" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow" ALTER COLUMN "nodes" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a62147c0d6b868e797061e142a" ON "template" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76ad01ac40aa3bcc841f00dc44" ON "template" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_941289df174d4ece7998279a6c" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f8b9d372187ad54c33210721d" ON "template" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b95ac6a794df48a5fd6ae93e70" ON "flow_execution" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d745c1c0ddfe33bfb85e29c88" ON "flow_execution" ("updated_by") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d745c1c0ddfe33bfb85e29c88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b95ac6a794df48a5fd6ae93e70"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f8b9d372187ad54c33210721d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941289df174d4ece7998279a6c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76ad01ac40aa3bcc841f00dc44"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a62147c0d6b868e797061e142a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow" ALTER COLUMN "nodes" SET DEFAULT '{"edges": [], "nodes": []}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" DROP COLUMN "input_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_execution" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_flow_execution_updated_at" ON "flow_execution" ("updated_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_flow_execution_created_at" ON "flow_execution" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_flow_execution_updated_by" ON "flow_execution" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_flow_execution_created_by" ON "flow_execution" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9767eb6b4e02e425e9b8e8e7c" ON "template" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faf46b9b3c88b592f3b0c058b" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e1a55c8b86d460bde0465b7e4" ON "template" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a25737b8d827c719c2b8a2825" ON "template" ("name") `,
    );
  }
}
