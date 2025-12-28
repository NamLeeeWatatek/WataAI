import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class UpdateTemplatesForCreationTools1766474658614
  implements MigrationInterface
{
  name = 'UpdateTemplatesForCreationTools1766474658614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.addColumn(
      'template',
      new TableColumn({
        name: 'creation_tool_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'template',
      new TableColumn({
        name: 'prefilled_data',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'template',
      new TableColumn({
        name: 'thumbnail_url',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'template',
      new TableColumn({
        name: 'execution_overrides',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'template',
      new TableColumn({
        name: 'sort_order',
        type: 'int',
        default: 0,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'template',
      new TableIndex({
        name: 'IDX_template_creation_tool_id',
        columnNames: ['creation_tool_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('template', 'IDX_template_creation_tool_id');

    // Drop columns
    await queryRunner.dropColumn('template', 'sort_order');
    await queryRunner.dropColumn('template', 'execution_overrides');
    await queryRunner.dropColumn('template', 'thumbnail_url');
    await queryRunner.dropColumn('template', 'prefilled_data');
    await queryRunner.dropColumn('template', 'creation_tool_id');
  }
}
