import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddCreationToolIdToGenerationJobs1766474658615
  implements MigrationInterface
{
  name = 'AddCreationToolIdToGenerationJobs1766474658615';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add creation_tool_id column
    await queryRunner.addColumn(
      'generation_job',
      new TableColumn({
        name: 'creation_tool_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Create index
    await queryRunner.createIndex(
      'generation_job',
      new TableIndex({
        name: 'IDX_generation_job_creation_tool_id',
        columnNames: ['creation_tool_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex(
      'generation_job',
      'IDX_generation_job_creation_tool_id',
    );

    // Drop column
    await queryRunner.dropColumn('generation_job', 'creation_tool_id');
  }
}
