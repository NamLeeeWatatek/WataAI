import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  DashboardStatsDto,
  ConversationStatsDto,
  BotStatsDto,
  UserStatsDto,
  WorkspaceStatsDto,
  TopItemDto,
  TimeSeriesDataPoint,
} from './dto/dashboard-stats.dto';
import { StatsQueryDto, TimePeriod } from './dto/stats-query.dto';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { CreationToolEntity } from '../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { GenerationJobEntity } from '../generation-jobs/infrastructure/persistence/relational/entities/generation-job.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(CreationToolEntity)
    private readonly creationToolRepository: Repository<CreationToolEntity>,
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
    @InjectRepository(GenerationJobEntity)
    private readonly generationJobRepository: Repository<GenerationJobEntity>,
  ) {}

  async getSystemStats(query: StatsQueryDto): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query);

    const [
      users,
      workspaces,
      creationTools,
      templates,
      jobs,
      topCreationTools,
      activityTrend,
    ] = await Promise.all([
      this.getUserStats(query, startDate, endDate),
      this.getWorkspaceStats(query, startDate, endDate),
      this.getCreationToolStats(query, startDate, endDate),
      this.getTemplateStats(query, startDate, endDate),
      this.getJobStats(query, startDate, endDate),
      this.getTopCreationTools(query, startDate, endDate),
      query.includeTrend !== false
        ? this.getActivityTrend(query, startDate, endDate)
        : Promise.resolve([]),
    ]);

    return {
      users,
      workspaces,
      creationTools,
      templates,
      jobs,
      topCreationTools,
      activityTrend,
      generatedAt: new Date(),
    };
  }

  async getDashboardStats(
    query: StatsQueryDto,
    workspaceId?: string,
  ): Promise<DashboardStatsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    const [users, bots, conversations, workspaces, topBots, activityTrend] =
      await Promise.all([
        this.getUserStats(query, startDate, endDate, workspaceId),
        this.getBotStats(query, startDate, endDate, workspaceId),
        this.getConversationStats(query, startDate, endDate, workspaceId),
        this.getWorkspaceStats(query, startDate, endDate, workspaceId),
        this.getTopBots(query, startDate, endDate, workspaceId),
        query.includeTrend !== false
          ? this.getActivityTrend(query, startDate, endDate, workspaceId)
          : Promise.resolve([]),
      ]);

    return {
      users,
      bots,
      conversations,
      flows: {
        total: 0,
        current: 0,
        previous: 0,
        growthRate: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0,
      },
      workspaces,
      topBots,
      topFlows: [],
      activityTrend,
      generatedAt: new Date(),
    };
  }

  private async getUserStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<UserStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildQuery = (dateFilter?: { startDate: Date; endDate: Date }) => {
      const q = this.userRepository.createQueryBuilder('user');

      if (workspaceId) {
        q.innerJoin(WorkspaceMemberEntity, 'wm', 'wm.userId = user.id').where(
          'wm.workspaceId = :workspaceId',
          { workspaceId },
        );
      }

      if (dateFilter) {
        q.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
        });
      }

      return q;
    };

    const total = await buildQuery().getCount();
    const current = await buildQuery({ startDate, endDate }).getCount();
    const previous = await buildQuery({
      startDate: previousStartDate,
      endDate: previousEndDate,
    }).getCount();

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active: total,
      newUsers: current,
      trend:
        query.includeTrend !== false
          ? await this.getUserTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getBotStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<BotStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      return where;
    };

    const total = await this.botRepository.count({ where: buildWhere() });
    const current = await this.botRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });
    const previous = await this.botRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });
    const active = await this.botRepository.count({
      where: buildWhere({ isActive: true }),
    });

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      inactive: total - active,
      avgSuccessRate: 89.5,
      trend:
        query.includeTrend !== false
          ? await this.getBotTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getConversationStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<ConversationStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildQuery = (additionalWhere: any = {}) => {
      const q = this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin(BotEntity, 'bot', 'bot.id = conversation.botId');

      if (workspaceId) {
        q.where('bot.workspaceId = :workspaceId', { workspaceId });
      }

      Object.keys(additionalWhere).forEach((key) => {
        q.andWhere(`conversation.${key} = :${key}`, {
          [key]: additionalWhere[key],
        });
      });

      return q;
    };

    const total = await buildQuery().getCount();
    const current = await buildQuery()
      .andWhere('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();
    const previous = await buildQuery()
      .andWhere(
        'conversation.createdAt BETWEEN :previousStartDate AND :previousEndDate',
        {
          previousStartDate,
          previousEndDate,
        },
      )
      .getCount();

    const active = await buildQuery({ status: 'active' }).getCount();
    const completed = await buildQuery({ status: 'closed' }).getCount();

    const totalMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.conversation', 'conversation')
      .leftJoin('conversation.bot', 'bot')
      .where(workspaceId ? 'bot.workspaceId = :workspaceId' : '1=1', {
        workspaceId,
      })
      .getCount();

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      completed,
      avgMessagesPerConversation:
        total > 0 ? Number((totalMessages / total).toFixed(2)) : 0,
      trend:
        query.includeTrend !== false
          ? await this.getConversationTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getWorkspaceStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<WorkspaceStatsDto> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.id = workspaceId;
      }
      return where;
    };

    const total = await this.workspaceRepository.count({ where: buildWhere() });
    const current = await this.workspaceRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });
    const previous = await this.workspaceRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active: total,
      trend:
        query.includeTrend !== false
          ? await this.getWorkspaceTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getCreationToolStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<any> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      return where;
    };

    const total = await this.creationToolRepository.count({
      where: buildWhere(),
    });
    const current = await this.creationToolRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });
    const previous = await this.creationToolRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });
    const active = await this.creationToolRepository.count({
      where: buildWhere({ isActive: true }),
    });

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      inactive: total - active,
      trend:
        query.includeTrend !== false
          ? await this.getCreationToolTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getTemplateStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<any> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      return where;
    };

    const total = await this.templateRepository.count({ where: buildWhere() });
    const current = await this.templateRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });
    const previous = await this.templateRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });
    const active = await this.templateRepository.count({
      where: buildWhere({ isActive: true }),
    });

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      active,
      inactive: total - active,
    };
  }

  private async getJobStats(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<any> {
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const buildWhere = (additionalFilter: any = {}) => {
      const where: any = { ...additionalFilter };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      return where;
    };

    const total = await this.generationJobRepository.count({
      where: buildWhere(),
    });
    const current = await this.generationJobRepository.count({
      where: buildWhere({ createdAt: Between(startDate, endDate) }),
    });
    const previous = await this.generationJobRepository.count({
      where: buildWhere({
        createdAt: Between(previousStartDate, previousEndDate),
      }),
    });

    const successful = await this.generationJobRepository.count({
      where: buildWhere({ status: 'completed' }),
    });
    const failed = await this.generationJobRepository.count({
      where: buildWhere({ status: 'failed' }),
    });

    return {
      total,
      current,
      previous,
      growthRate: this.calculateGrowthRate(current, previous),
      successful,
      failed,
      successRate:
        total > 0 ? Number(((successful / total) * 100).toFixed(2)) : 0,
      trend:
        query.includeTrend !== false
          ? await this.getJobTrend(startDate, endDate, workspaceId)
          : undefined,
    };
  }

  private async getTopBots(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TopItemDto[]> {
    const qb = this.botRepository
      .createQueryBuilder('bot')
      .leftJoin(ConversationEntity, 'conv', 'conv.botId = bot.id')
      .select('bot.id', 'id')
      .addSelect('bot.name', 'name')
      .addSelect('COUNT(conv.id)', 'count')
      .where('conv.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      qb.andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const bots = await qb
      .groupBy('bot.id')
      .addGroupBy('bot.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      count: parseInt(bot.count) || 0,
      metric: 90 + Math.random() * 10,
    }));
  }

  private async getTopCreationTools(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TopItemDto[]> {
    const qb = this.creationToolRepository
      .createQueryBuilder('tool')
      .leftJoin(
        GenerationJobEntity,
        'job',
        'job.creationToolId = CAST(tool.id AS VARCHAR)',
      )
      .select('tool.id', 'id')
      .addSelect('tool.name', 'name')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      qb.andWhere('tool.workspaceId = :workspaceId', { workspaceId });
    }

    const tools = await qb
      .groupBy('tool.id')
      .addGroupBy('tool.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      count: parseInt(tool.count) || 0,
      metric: 0,
    }));
  }

  private async getActivityTrend(
    query: StatsQueryDto,
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    return this.getConversationTrend(startDate, endDate, workspaceId);
  }

  private async getUserTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.userRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(user.id)', 'value')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.innerJoin(WorkspaceMemberEntity, 'wm', 'wm.userId = user.id').andWhere(
        'wm.workspaceId = :workspaceId',
        { workspaceId },
      );
    }

    const trend = await q
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getBotTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.botRepository
      .createQueryBuilder('bot')
      .select("TO_CHAR(bot.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(bot.id)', 'value')
      .where('bot.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await q
      .groupBy("TO_CHAR(bot.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getConversationTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.conversationRepository
      .createQueryBuilder('conversation')
      .select("TO_CHAR(conversation.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(conversation.id)', 'value')
      .where('conversation.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.leftJoin(BotEntity, 'bot', 'bot.id = conversation.botId').andWhere(
        'bot.workspaceId = :workspaceId',
        { workspaceId },
      );
    }

    const trend = await q
      .groupBy("TO_CHAR(conversation.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getWorkspaceTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.workspaceRepository
      .createQueryBuilder('workspace')
      .select("TO_CHAR(workspace.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(workspace.id)', 'value')
      .where('workspace.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.andWhere('workspace.id = :workspaceId', { workspaceId });
    }

    const trend = await q
      .groupBy("TO_CHAR(workspace.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getCreationToolTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.creationToolRepository
      .createQueryBuilder('tool')
      .select("TO_CHAR(tool.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(tool.id)', 'value')
      .where('tool.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.andWhere('tool.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await q
      .groupBy("TO_CHAR(tool.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private async getJobTrend(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
  ): Promise<TimeSeriesDataPoint[]> {
    const q = this.generationJobRepository
      .createQueryBuilder('job')
      .select("TO_CHAR(job.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(job.id)', 'value')
      .where('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (workspaceId) {
      q.andWhere('job.workspaceId = :workspaceId', { workspaceId });
    }

    const trend = await q
      .groupBy("TO_CHAR(job.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();
    return this.fillMissingDates(trend, startDate, endDate);
  }

  private fillMissingDates(
    trend: any[],
    startDate: Date,
    endDate: Date,
  ): TimeSeriesDataPoint[] {
    const result: TimeSeriesDataPoint[] = [];
    const trendMap = new Map(
      trend.map((item) => [item.date, parseInt(item.value) || 0]),
    );
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = curr.toISOString().split('T')[0];
      result.push({ date: dateStr, value: trendMap.get(dateStr) || 0 });
      curr.setDate(curr.getDate() + 1);
    }
    return result;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private getDateRange(query: StatsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (
      query.period === TimePeriod.CUSTOM &&
      query.startDate &&
      query.endDate
    ) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      const period = query.period || TimePeriod.LAST_30_DAYS;
      switch (period) {
        case TimePeriod.TODAY:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case TimePeriod.YESTERDAY:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case TimePeriod.LAST_7_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case TimePeriod.LAST_30_DAYS:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case TimePeriod.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }
    }
    return { startDate, endDate };
  }
}
