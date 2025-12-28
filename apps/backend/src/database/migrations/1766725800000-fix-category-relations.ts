import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCategoryRelations1766725800000 implements MigrationInterface {
  name = 'FixCategoryRelations1766725800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Fix CreationToolEntity: Drop 'category' string, add 'category_id' FK
    const creationToolTable = await queryRunner.getTable('creation_tool');
    if (creationToolTable && creationToolTable.findColumnByName('category')) {
      await queryRunner.query(
        'ALTER TABLE "creation_tool" DROP COLUMN "category"',
      );
    }
    if (
      creationToolTable &&
      !creationToolTable.findColumnByName('category_id')
    ) {
      await queryRunner.query(
        'ALTER TABLE "creation_tool" ADD "category_id" uuid',
      );
      await queryRunner.query(
        `ALTER TABLE "creation_tool" ADD CONSTRAINT "FK_creation_tool_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
    }

    // 2. Fix TemplateEntity: Drop 'category' string, add 'category_id' FK
    const templateTable = await queryRunner.getTable('template');
    if (templateTable && templateTable.findColumnByName('category')) {
      await queryRunner.query('ALTER TABLE "template" DROP COLUMN "category"');
    }
    if (templateTable && !templateTable.findColumnByName('category_id')) {
      await queryRunner.query('ALTER TABLE "template" ADD "category_id" uuid');
      await queryRunner.query(
        `ALTER TABLE "template" ADD CONSTRAINT "FK_template_category" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
    }

    // 3. Fix TemplateEntity: creation_tool_id type (varchar -> uuid) and add FK
    // It was created as varchar in previous migrations but should be uuid to match creation_tool.id
    if (templateTable) {
      const creationToolIdColumn =
        templateTable.findColumnByName('creation_tool_id');
      if (creationToolIdColumn && creationToolIdColumn.type !== 'uuid') {
        // Drop index first if strictly needed, but changing type might preserve it or require dropping.
        // TypeORM usually handles index on column drop/add.
        // Let's try direct alter using casting.
        await queryRunner.query(
          'ALTER TABLE "template" ALTER COLUMN "creation_tool_id" TYPE uuid USING "creation_tool_id"::uuid',
        );
      }

      // Check if FK exists? Difficult to check constraints easily by name without querying pg_catalog.
      // But we can try adding it, if it fails it fails? No, better to be safe.
      // We assume FK doesn't exist because previous migration didn't add it.
      // We'll wrap in try-catch or just execute.
      // If we want to be safe, we can check constraints.
      const hasFk = templateTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('creation_tool_id') !== -1,
      );
      if (!hasFk) {
        await queryRunner.query(
          `ALTER TABLE "template" ADD CONSTRAINT "FK_template_creation_tool" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert creation_tool changes
    await queryRunner.query(
      'ALTER TABLE "creation_tool" DROP CONSTRAINT "FK_creation_tool_category"',
    );
    await queryRunner.query(
      'ALTER TABLE "creation_tool" DROP COLUMN "category_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "creation_tool" ADD "category" varchar',
    );

    // Revert template changes
    await queryRunner.query(
      'ALTER TABLE "template" DROP CONSTRAINT "FK_template_category"',
    );
    await queryRunner.query('ALTER TABLE "template" DROP COLUMN "category_id"');
    await queryRunner.query('ALTER TABLE "template" ADD "category" varchar');

    // Revert creation_tool_id type
    await queryRunner.query(
      'ALTER TABLE "template" DROP CONSTRAINT "FK_template_creation_tool"',
    );
    await queryRunner.query(
      'ALTER TABLE "template" ALTER COLUMN "creation_tool_id" TYPE varchar',
    );
  }
}
