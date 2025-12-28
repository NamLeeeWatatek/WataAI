
export interface TimeSeriesDataPoint {
    date: string
    value: number
}

export interface EntityStatsDto {
    total: number
    current: number
    previous: number
    growthRate: number
    trend?: TimeSeriesDataPoint[]
}

export interface UserStatsDto extends EntityStatsDto {
    active: number
    newUsers: number
}

export interface BotStatsDto extends EntityStatsDto {
    active: number
    inactive: number
    avgSuccessRate: number
}

export interface ConversationStatsDto extends EntityStatsDto {
    active: number
    completed: number
    avgMessagesPerConversation: number
}

export interface FlowStatsDto extends EntityStatsDto {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    successRate: number
    avgExecutionTime: number
}

export interface WorkspaceStatsDto extends EntityStatsDto {
    active: number
}

export interface TopItemDto {
    id: string
    name: string
    count: number
    metric?: number
}

export interface DashboardStats {
    users: UserStatsDto
    bots: BotStatsDto
    conversations: ConversationStatsDto
    flows: FlowStatsDto
    workspaces: WorkspaceStatsDto
    topBots: TopItemDto[]
    topFlows: TopItemDto[]
    activityTrend: TimeSeriesDataPoint[]
    generatedAt: Date
}

/**
 * Query parameters for stats endpoint
 */
export enum TimePeriod {
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    LAST_7_DAYS = 'LAST_7_DAYS',
    LAST_30_DAYS = 'LAST_30_DAYS',
    LAST_90_DAYS = 'LAST_90_DAYS',
    THIS_MONTH = 'THIS_MONTH',
    LAST_MONTH = 'LAST_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    CUSTOM = 'CUSTOM',
}

export interface StatsQueryParams {
    period?: TimePeriod
    startDate?: string
    endDate?: string
    includeTrend?: boolean
}

