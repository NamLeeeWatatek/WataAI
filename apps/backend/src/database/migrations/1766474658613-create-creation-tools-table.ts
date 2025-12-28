import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCreationToolsTable1766474658613
  implements MigrationInterface
{
  name = 'CreateCreationToolsTable1766474658613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create creation_tool table
    await queryRunner.createTable(
      new Table({
        name: 'creation_tool',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cover_image',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'form_config',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'execution_flow',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'creation_tool',
      new TableIndex({
        name: 'IDX_creation_tool_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'creation_tool',
      new TableIndex({
        name: 'IDX_creation_tool_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'creation_tool',
      new TableIndex({
        name: 'IDX_creation_tool_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'creation_tool',
      new TableIndex({
        name: 'IDX_creation_tool_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'creation_tool',
      new TableIndex({
        name: 'IDX_creation_tool_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'creation_tool',
      'IDX_creation_tool_workspace_id',
    );
    await queryRunner.dropIndex('creation_tool', 'IDX_creation_tool_is_active');
    await queryRunner.dropIndex('creation_tool', 'IDX_creation_tool_category');
    await queryRunner.dropIndex('creation_tool', 'IDX_creation_tool_slug');
    await queryRunner.dropIndex('creation_tool', 'IDX_creation_tool_name');

    // Drop table
    await queryRunner.dropTable('creation_tool');
  }
}
