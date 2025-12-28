import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesDataPoint {
  @ApiProperty({ example: '2025-11-01' })
  date: string;

  @ApiProperty({ example: 150 })
  value: number;
}

export class EntityStatsDto {
  @ApiProperty({ example: 1250, description: 'Total count' })
  total: number;

  @ApiProperty({ example: 45, description: 'Count in current period' })
  current: number;

  @ApiProperty({ example: 38, description: 'Count in previous period' })
  previous: number;

  @ApiProperty({ example: 18.42, description: 'Growth percentage' })
  growthRate: number;

  @ApiProperty({ type: [TimeSeriesDataPoint], description: 'Trend data' })
  trend?: TimeSeriesDataPoint[];
}

export class ConversationStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 850, description: 'Active conversations' })
  active: number;

  @ApiProperty({ example: 400, description: 'Completed conversations' })
  completed: number;

  @ApiProperty({
    example: 4.5,
    description: 'Average messages per conversation',
  })
  avgMessagesPerConversation: number;
}

export class BotStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 25, description: 'Active bots' })
  active: number;

  @ApiProperty({ example: 10, description: 'Inactive bots' })
  inactive: number;

  @ApiProperty({ example: 89.5, description: 'Average success rate' })
  avgSuccessRate: number;
}

export class FlowStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 5420, description: 'Total executions' })
  totalExecutions: number;

  @ApiProperty({ example: 4850, description: 'Successful executions' })
  successfulExecutions: number;

  @ApiProperty({ example: 570, description: 'Failed executions' })
  failedExecutions: number;

  @ApiProperty({ example: 89.48, description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({
    example: 2.3,
    description: 'Average execution time in seconds',
  })
  avgExecutionTime: number;
}

export class UserStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 450, description: 'Active users' })
  active: number;

  @ApiProperty({ example: 120, description: 'New users this period' })
  newUsers: number;
}

export class WorkspaceStatsDto extends EntityStatsDto {
  @ApiProperty({ example: 85, description: 'Active workspaces' })
  active: number;
}

export class TopItemDto {
  @ApiProperty({ example: 'bot-123' })
  id: string;

  @ApiProperty({ example: 'Customer Support Bot' })
  name: string;

  @ApiProperty({ example: 1250 })
  count: number;

  @ApiProperty({ example: 95.5 })
  metric?: number;
}

export class DashboardStatsDto {
  @ApiProperty({ type: UserStatsDto })
  users: UserStatsDto;

  @ApiProperty({ type: BotStatsDto })
  bots: BotStatsDto;

  @ApiProperty({ type: ConversationStatsDto })
  conversations: ConversationStatsDto;

  @ApiProperty({ type: FlowStatsDto })
  flows: FlowStatsDto;

  @ApiProperty({ type: WorkspaceStatsDto })
  workspaces: WorkspaceStatsDto;

  @ApiProperty({ type: [TopItemDto], description: 'Top performing bots' })
  topBots: TopItemDto[];

  @ApiProperty({ type: [TopItemDto], description: 'Most used flows' })
  topFlows: TopItemDto[];

  @ApiProperty({
    type: [TimeSeriesDataPoint],
    description: 'Overall activity trend',
  })
  activityTrend: TimeSeriesDataPoint[];

  @ApiProperty({ example: '2025-11-30T16:29:20.000Z' })
  generatedAt: Date;
}
