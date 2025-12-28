import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceInvitationTable1766765288283
  implements MigrationInterface
{
  name = 'CreateWorkspaceInvitationTable1766765288283';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP CONSTRAINT "FK_creation_tool_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_template_category"`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_invitation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "workspace_id" uuid NOT NULL, "role_id" integer NOT NULL, "sender_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "accepted_at" TIMESTAMP, CONSTRAINT "UQ_49e1b235ed0b102d72b8f299d6a" UNIQUE ("token"), CONSTRAINT "PK_8d58734b72dc04a88ff86fab9dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_353a007588fb0ce02e603f1a67" ON "workspace_invitation" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49e1b235ed0b102d72b8f299d6" ON "workspace_invitation" ("token") `,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD CONSTRAINT "FK_526f0affaf8cba58a06823a529b" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_fcc56203b1c92e296f3a1ab2e74" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_cb864e5c2393a73bc65bf73c704" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_83f254c75e90fc991a47522da75" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_a72acd3aadc3ce48a8177ac4593" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_a72acd3aadc3ce48a8177ac4593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_83f254c75e90fc991a47522da75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_cb864e5c2393a73bc65bf73c704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_fcc56203b1c92e296f3a1ab2e74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP CONSTRAINT "FK_526f0affaf8cba58a06823a529b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49e1b235ed0b102d72b8f299d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_353a007588fb0ce02e603f1a67"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_invitation"`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_template_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD CONSTRAINT "FK_creation_tool_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
