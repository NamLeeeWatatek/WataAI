import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { BotStatus } from './bots.enum';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspaceHelperService } from '../workspaces/workspace-helper.service';
import { WidgetVersionService } from './services/widget-version.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { CreateBotChannelDto, UpdateBotChannelDto } from './dto/bot-channel.dto';
import { UpdateBotDto, LinkKnowledgeBaseDto } from './dto/update-bot.dto';
import { ChannelEntity } from '../channels/infrastructure/persistence/relational/entities/channel.entity';
import { FilterBotDto, SortBotDto } from './dto/query-bot.dto';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private botKbRepository: Repository<BotKnowledgeBaseEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
    @InjectRepository(ChannelEntity)
    private channelRepository: Repository<ChannelEntity>,
    private workspaceHelper: WorkspaceHelperService,
    private widgetVersionService: WidgetVersionService,
    private readonly i18n: I18nService,
  ) { }

  async getUserDefaultWorkspace(userId: string) {
    return this.workspaceHelper.getUserDefaultWorkspace(userId);
  }

  async ensureUserHasWorkspace(userId: string) {
    return this.workspaceHelper.ensureUserHasWorkspace(userId);
  }

  async create(createDto: CreateBotDto, userId: string) {
    if (!createDto.workspaceId) {
      const lang = I18nContext.current()?.lang;
      throw new BadRequestException(
        this.i18n.t('common.workspaceIdRequired', { lang }),
      );
    }

    const bot = this.botRepository.create({
      ...createDto,
      createdBy: userId,
      status: createDto.status ?? BotStatus.DRAFT,
      defaultLanguage: createDto.defaultLanguage ?? 'en',
      timezone: createDto.timezone ?? 'UTC',
    });
    const savedBot = await this.botRepository.save(bot);

    try {
      const defaultVersion = await this.widgetVersionService.createVersion(
        savedBot.id,
        {
          version: '1.0.0',
          config: {
            theme: {
              primaryColor: createDto.primaryColor || '#667eea',
              position: createDto.widgetPosition || 'bottom-right',
              buttonSize: createDto.widgetButtonSize || 'medium',
              showAvatar: createDto.showAvatar ?? true,
              showTimestamp: createDto.showTimestamp ?? true,
            },
            messages: {
              welcome: createDto.welcomeMessage || 'chatbot.default_welcome',
              placeholder:
                createDto.placeholderText || 'chatbot.default_placeholder',
              offline: 'chatbot.default_offline',
              errorMessage: 'chatbot.default_error',
            },
            behavior: {
              autoOpen: false,
              autoOpenDelay: 3000,
              greetingDelay: 1000,
            },
            features: {
              fileUpload: true,
              voiceInput: false,
              markdown: true,
              quickReplies: true,
            },
            branding: {
              showPoweredBy: true,
            },
            security: {
              // FIX: Don't allow wildcard in production
              allowedOrigins: createDto.allowedOrigins?.length 
                ? createDto.allowedOrigins 
                : process.env.NODE_ENV === 'production' 
                  ? [] 
                  : ['http://localhost:3000'],
            },
          },
          changelog: 'Initial version',
        },
        userId,
      );

      await this.widgetVersionService.publishVersion(
        savedBot.id,
        defaultVersion.id,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create default widget version for bot ${savedBot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return savedBot;
  }

  async findAll(workspaceId: string, options?: { status?: string }) {
    const query = this.botRepository
      .createQueryBuilder('bot')
      .where('bot.workspaceId = :workspaceId', { workspaceId })
      .andWhere('bot.deletedAt IS NULL');

    if (options?.status) {
      query.andWhere('bot.status = :status', { status: options.status });
    }

    return query.orderBy('bot.createdAt', 'DESC').getMany();
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterBotDto | null;
    sortOptions?: SortBotDto[] | null;
    paginationOptions?: { page: number; limit: number };
  }) {
    const query = this.botRepository
      .createQueryBuilder('bot')
      .leftJoinAndSelect('bot.workspace', 'workspace')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .where('bot.deletedAt IS NULL');

    // Apply filters
    if (filterOptions?.workspaceId) {
      query.andWhere('bot.workspaceId = :workspaceId', {
        workspaceId: filterOptions.workspaceId,
      });
    }

    if (filterOptions?.status) {
      query.andWhere('bot.status = :status', { status: filterOptions.status });
    }

    if (filterOptions?.search) {
      query.andWhere(
        '(bot.name ILIKE :search OR bot.description ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (filterOptions?.isActive !== undefined) {
      query.andWhere('bot.isActive = :isActive', {
        isActive: filterOptions.isActive,
      });
    }

    // Apply sorting
    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        const order = sort.order === 'DESC' ? 'DESC' : 'ASC';
        query.addOrderBy(`bot.${sort.orderBy}`, order);
      });
    } else {
      query.orderBy('bot.createdAt', 'DESC');
    }

    // Apply pagination
    if (paginationOptions) {
      const { page, limit } = paginationOptions;
      query.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string) {
    const bot = await this.botRepository.findOne({
      where: { id },
      relations: ['workspace', 'knowledgeBases'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    return bot;
  }

  async update(id: string, updateDto: UpdateBotDto) {
    const bot = await this.findOne(id);

    // Clean up invalid UUID strings
    if (updateDto.flowId === 'undefined' || updateDto.flowId === 'null') {
      updateDto.flowId = null;
    }
    if (
      updateDto.aiProviderId === 'undefined' ||
      updateDto.aiProviderId === 'null'
    ) {
      updateDto.aiProviderId = null;
    }

    Object.assign(bot, updateDto);
    return this.botRepository.save(bot);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.botRepository.softDelete(id);
  }

  async activate(id: string) {
    return this.update(id, { status: BotStatus.ACTIVE });
  }

  async pause(id: string) {
    return this.update(id, { status: BotStatus.PAUSED });
  }

  async archive(id: string) {
    return this.update(id, { status: BotStatus.ARCHIVED });
  }

  async linkKnowledgeBase(botId: string, dto: LinkKnowledgeBaseDto) {
    const bot = await this.findOne(botId);

    const existing = await this.botKbRepository.findOne({
      where: { botId, knowledgeBaseId: dto.knowledgeBaseId },
    });

    if (existing) {
      existing.priority = dto.priority ?? existing.priority;
      existing.ragSettings = dto.ragSettings ?? existing.ragSettings;
      existing.isActive = true;
      return this.botKbRepository.save(existing);
    }

    const link = this.botKbRepository.create({
      botId,
      workspaceId: bot.workspaceId,
      knowledgeBaseId: dto.knowledgeBaseId,
      priority: dto.priority ?? 1,
      ragSettings: dto.ragSettings,
      isActive: true,
    });

    return this.botKbRepository.save(link);
  }

  async unlinkKnowledgeBase(botId: string, knowledgeBaseId: string) {
    await this.botKbRepository.delete({ botId, knowledgeBaseId });
  }

  async getLinkedKnowledgeBases(botId: string) {
    // First get the linking records
    const linkedRecords = await this.botKbRepository.find({
      where: { botId },
      order: { priority: 'ASC' },
    });

    // If no linked records, return empty array
    if (!linkedRecords || linkedRecords.length === 0) {
      return [];
    }

    // Get all linked KB IDs
    const kbIds = linkedRecords.map((r) => r.knowledgeBaseId);

    // Use query builder to get KBs with needed fields
    const kbEntities = await this.botKbRepository.manager
      .getRepository('knowledge_base')
      .createQueryBuilder('kb')
      .where('kb.id IN (:...ids)', { ids: kbIds })
      .andWhere('kb.deletedAt IS NULL')
      .select([
        'kb.id',
        'kb.name',
        'kb.description',
        'kb.embeddingModel',
        'kb.createdAt',
        'kb.updatedAt',
      ])
      .getMany();

    // Get actual document counts for each KB
    const docCounts = await Promise.all(
      kbIds.map(async (kbId) => {
        const count = await this.botKbRepository.manager
          .getRepository('kb_document')
          .createQueryBuilder('doc')
          .where('doc.knowledgeBaseId = :kbId', { kbId })
          .andWhere('doc.deletedAt IS NULL')
          .select('COUNT(doc.id)', 'count')
          .getRawOne();
        return { kbId, count: parseInt(count?.count || '0') };
      }),
    );

    const docCountMap = new Map();
    docCounts.forEach(({ kbId, count }) => {
      docCountMap.set(kbId, count);
    });

    // Create a map for easy lookup
    const kbMap = new Map();
    kbEntities.forEach((kb) => {
      kbMap.set(kb.id, {
        id: kb.id,
        name: kb.name,
        description: kb.description,
        totalDocuments: docCountMap.get(kb.id) || 0,
        embeddingModel: kb.embeddingModel,
        createdAt: kb.createdAt,
        updatedAt: kb.updatedAt,
      });
    });

    // Merge the data
    return linkedRecords.map((record) => ({
      id: `${record.botId}-${record.knowledgeBaseId}`,
      botId: record.botId,
      knowledgeBaseId: record.knowledgeBaseId,
      priority: record.priority,
      ragSettings: record.ragSettings,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.createdAt, // No updatedAt in entity, use createdAt
      knowledgeBase: kbMap.get(record.knowledgeBaseId) || null,
    }));
  }

  async toggleKnowledgeBase(
    botId: string,
    knowledgeBaseId: string,
    isActive: boolean,
  ) {
    const link = await this.botKbRepository.findOne({
      where: { botId, knowledgeBaseId },
    });

    if (!link) {
      throw new NotFoundException('Knowledge base link not found');
    }

    link.isActive = isActive;
    return this.botKbRepository.save(link);
  }

  async duplicate(id: string, userId: string, newName?: string) {
    const bot = await this.findOne(id);

    const newBot = this.botRepository.create({
      ...bot,
      id: undefined,
      name: newName ?? `${bot.name} (Copy)`,
      status: BotStatus.DRAFT,
      createdBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: undefined,
    });

    return this.botRepository.save(newBot);
  }

  async getBotChannels(botId: string, options?: { validated?: boolean }) {
    await this.findOne(botId);

    const query = this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.botId = :botId', { botId })
      .orderBy('channel.createdAt', 'DESC');

    if (options?.validated) {
      query.andWhere('channel.isActive = :isActive', { isActive: true });
      // query.andWhere('channel.connectionId IS NOT NULL');
    }

    return query.getMany();
  }

  async createBotChannel(
    botId: string,
    dto: CreateBotChannelDto,
    userId: string,
  ) {
    const bot = await this.findOne(botId);

    const channel = this.channelRepository.create({
      botId,
      workspaceId: bot.workspaceId,
      type: dto.type,
      name: dto.name,
      config: dto.config,
      connectionId: dto.connectionId,
      isActive: true,
      createdBy: userId,
    });

    return this.channelRepository.save(channel);
  }

  async updateBotChannel(
    botId: string,
    channelId: string,
    dto: UpdateBotChannelDto,
    userId: string,
  ) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId, botId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    Object.assign(channel, dto);
    channel.updatedBy = userId;
    return this.channelRepository.save(channel);
  }

  async deleteBotChannel(botId: string, channelId: string) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId, botId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.channelRepository.remove(channel);
  }

  async toggleBotChannel(
    botId: string,
    channelId: string,
    isActive: boolean,
    userId: string,
  ) {
    return this.updateBotChannel(botId, channelId, { isActive }, userId);
  }

  // Appearance logic moved to BotAppearanceService
}
