import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1767683055957
  implements MigrationInterface
{
  name = 'AddNotificationPreferences1767683055957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "notificationPreferences" jsonb`,
    );
    await queryRunner.query(`ALTER TABLE "notification" ADD "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TYPE "public"."creation_jobs_status_enum" RENAME TO "creation_jobs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum" USING "status"::"text"::"public"."creation_jobs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."creation_jobs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_82da258fe45382a03c820a8daf4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ALTER COLUMN "bot_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f21c8a866b3ba501f91518ca33" ON "message" ("conversation_id", "sent_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_82da258fe45382a03c820a8daf4" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_91fdb6236859404ddf7c5f64377" FOREIGN KEY ("channel_id") REFERENCES "channel"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_91fdb6236859404ddf7c5f64377"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_82da258fe45382a03c820a8daf4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f21c8a866b3ba501f91518ca33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ALTER COLUMN "bot_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_82da258fe45382a03c820a8daf4" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum_old" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" TYPE "public"."creation_jobs_status_enum_old" USING "status"::"text"::"public"."creation_jobs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."creation_jobs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."creation_jobs_status_enum_old" RENAME TO "creation_jobs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "notificationPreferences"`,
    );
  }
}
