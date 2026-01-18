import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceFields1768131074367 implements MigrationInterface {
  name = 'AddInvoiceFields1768131074367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_712006d033481a0b3e433132769"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan" ADD "stripe_price_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD "provider" character varying NOT NULL DEFAULT 'stripe'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD "provider_invoice_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD "currency" character varying NOT NULL DEFAULT 'usd'`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_aaebf689e2996177947248df934"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ALTER COLUMN "bot_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8ab867c28039173469919cc8df" ON "creation_tool" ("slug") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_aaebf689e2996177947248df934" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_aaebf689e2996177947248df934"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ab867c28039173469919cc8df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ALTER COLUMN "bot_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_aaebf689e2996177947248df934" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "currency"`);
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN "provider_invoice_id"`,
    );
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "stripe_price_id"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_712006d033481a0b3e433132769" ON "creation_tool" ("slug") WHERE (deleted_at IS NULL)`,
    );
  }
}
