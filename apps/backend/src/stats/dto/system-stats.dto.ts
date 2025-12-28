import { ApiProperty } from '@nestjs/swagger';
import {
  EntityStatsDto,
  TopItemDto,
  TimeSeriesDataPoint,
  UserStatsDto,
  WorkspaceStatsDto,
} from './dashboard-stats.dto';

export class CreationToolStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 15, description: 'Active creation tools' })
  active: number;

  @ApiProperty({ example: 5, description: 'Inactive creation tools' })
  inactive: number;
}

export class TemplateStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 45, description: 'Active templates' })
  active: number;

  @ApiProperty({ example: 10, description: 'Inactive templates' })
  inactive: number;
}

export class JobStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 1250, description: 'Total successful jobs' })
  successful: number;

  @ApiProperty({ example: 120, description: 'Total failed jobs' })
  failed: number;

  @ApiProperty({ example: 91.2, description: 'Success rate percentage' })
  successRate: number;
}

export class SystemStatsDto {
  @ApiProperty({ type: UserStatsDto })
  users: UserStatsDto;

  @ApiProperty({ type: WorkspaceStatsDto })
  workspaces: WorkspaceStatsDto;

  @ApiProperty({ type: CreationToolStatsDto })
  creationTools: CreationToolStatsDto;

  @ApiProperty({ type: TemplateStatsDto })
  templates: TemplateStatsDto;

  @ApiProperty({ type: JobStatsDto })
  jobs: JobStatsDto;

  @ApiProperty({
    type: [TopItemDto],
    description: 'Top creation tools by usage',
  })
  topCreationTools: TopItemDto[];

  @ApiProperty({
    type: [TimeSeriesDataPoint],
    description: 'System-wide activity trend',
  })
  activityTrend: TimeSeriesDataPoint[];

  @ApiProperty({ example: '2025-11-30T16:29:20.000Z' })
  generatedAt: Date;
}
