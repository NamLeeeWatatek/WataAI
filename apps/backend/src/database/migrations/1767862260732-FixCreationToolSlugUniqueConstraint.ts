import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCreationToolSlugUniqueConstraint1767862260732 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the existing global unique constraint
        await queryRunner.query(`ALTER TABLE "creation_tool" DROP CONSTRAINT IF EXISTS "UQ_712006d033481a0b3e433132769"`);

        // 2. Drop the existing non-unique index if it exists
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_712006d033481a0b3e43313276"`);

        // 3. Create a partial unique index that only applies to non-deleted tools
        // This allows reusing slugs from soft-deleted tools
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_712006d033481a0b3e433132769" ON "creation_tool" ("slug") WHERE "deleted_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the partial unique index
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_712006d033481a0b3e433132769"`);

        // 2. Re-create the global unique constraint
        await queryRunner.query(`ALTER TABLE "creation_tool" ADD CONSTRAINT "UQ_712006d033481a0b3e433132769" UNIQUE ("slug")`);

        // 3. Re-create the non-unique index
        await queryRunner.query(`CREATE INDEX "IDX_712006d033481a0b3e43313276" ON "creation_tool" ("slug")`);
    }

}
