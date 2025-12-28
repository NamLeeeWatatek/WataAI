import { MigrationInterface, QueryRunner } from 'typeorm';

export class FlowRefactor1766408005469 implements MigrationInterface {
  name = 'FlowRefactor1766408005469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "flow" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "flow" DROP COLUMN "teamId"`);
    await queryRunner.query(`ALTER TABLE "flow" ADD "owner_id" uuid`);
    await queryRunner.query(`ALTER TABLE "flow" ADD "team_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_495bf30f3eff39796e96384827" ON "flow" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2e507441c456c8ef5bd23f062" ON "flow" ("category") `,
    );
    await queryRunner.query(
      `ALTER TABLE "flow" ADD CONSTRAINT "FK_4591407ef0ab0f7141b6cd8a486" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow" DROP CONSTRAINT "FK_4591407ef0ab0f7141b6cd8a486"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2e507441c456c8ef5bd23f062"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_495bf30f3eff39796e96384827"`,
    );
    await queryRunner.query(`ALTER TABLE "flow" DROP COLUMN "team_id"`);
    await queryRunner.query(`ALTER TABLE "flow" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "flow" ADD "teamId" uuid`);
    await queryRunner.query(`ALTER TABLE "flow" ADD "ownerId" uuid`);
  }
}
