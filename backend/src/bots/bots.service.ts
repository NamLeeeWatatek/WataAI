import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import {
  CreateBotChannelDto,
  UpdateBotChannelDto,
} from './dto/bot-channel.dto';
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
  ) {}

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

    const botData: any = { ...createDto };
    if (botData.aiProviderId) {
      botData.aiConfigId = botData.aiProviderId;
      delete botData.aiProviderId;
    }

    const bot = this.botRepository.create({
      ...botData,
      createdBy: userId,
      status: createDto.status ?? BotStatus.DRAFT,
      defaultLanguage: createDto.defaultLanguage ?? 'en',
      timezone: createDto.timezone ?? 'UTC',
    }) as unknown as BotEntity;
    const savedBot = await this.botRepository.save(bot);

    try {
      this.logger.log(
        `Creating default widget version for bot ${savedBot.id}...`,
      );

      const primaryColor = (createDto.primaryColor || '#667eea').trim();
      const safeAllowedOrigins = createDto.allowedOrigins?.length
        ? createDto.allowedOrigins
        : [];

      // Create version 1.0.0
      const defaultVersion = await this.widgetVersionService.createVersion(
        savedBot.id,
        {
          version: '1.0.0',
          config: {
            theme: {
              primaryColor: /^#[0-9A-F]{6}$/i.test(primaryColor)
                ? primaryColor
                : '#667eea',
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
              allowedOrigins: safeAllowedOrigins,
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
      this.logger.log(
        `✅ Default widget version created and published for bot ${savedBot.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create default widget version for bot ${savedBot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error.stack,
      );
      // We don't rethrow to avoid failing the bot creation, but this leaves the bot without a version.
    }

    // Return the bot with the active version loaded so frontend sees it immediately
    return this.findOne(savedBot.id);
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

  async findOne(id: string, workspaceId?: string) {
    const query = this.botRepository
      .createQueryBuilder('bot')
      .leftJoinAndSelect('bot.workspace', 'workspace')
      .leftJoinAndSelect('bot.knowledgeBases', 'knowledgeBases')
      .leftJoinAndSelect('bot.activeVersion', 'activeVersion')
      .where('bot.id = :id', { id });

    if (workspaceId) {
      query.andWhere('bot.workspaceId = :workspaceId', { workspaceId });
    }

    const bot = await query.getOne();

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    // --- Frontend Compatibility Layer ---
    // Flatten active version config into bot object for frontend consumption
    if (bot.activeVersion?.config) {
      const config = bot.activeVersion.config;

      // Theme
      if (config.theme) {
        (bot as any).primaryColor = config.theme.primaryColor;
        (bot as any).widgetPosition = config.theme.position;
        (bot as any).widgetButtonSize = config.theme.buttonSize;
        (bot as any).showAvatar = config.theme.showAvatar;
        (bot as any).showTimestamp = config.theme.showTimestamp;
      }

      // Messages
      if (config.messages) {
        (bot as any).welcomeMessage = config.messages.welcome;
        (bot as any).placeholderText = config.messages.placeholder;
      }

      // Security
      if (config.security) {
        (bot as any).allowedOrigins = config.security.allowedOrigins;
      }

      // Backward compatibility flags
      (bot as any).widgetEnabled = bot.isActive; // Assumption
    } else {
      // Default fallback if no active version (shouldn't happen with self-healing)
      (bot as any).primaryColor = '#667eea';
      (bot as any).widgetPosition = 'bottom-right';
      (bot as any).widgetButtonSize = 'medium';
    }

    return bot;
  }

  async update(id: string, workspaceId: string, updateDto: UpdateBotDto) {
    // 1. Separate generic bot fields from visual/widget fields
    const {
      primaryColor,
      widgetPosition,
      widgetButtonSize,
      showAvatar,
      showTimestamp,
      welcomeMessage,
      placeholderText,
      allowedOrigins,
      ...botUpdate
    } = updateDto;

    // 2. Update generic bot entity fields
    const bot = await this.findOne(id, workspaceId);

    // Clean up invalid UUIDs
    // Clean up invalid UUIDs
    if (botUpdate.flowId === 'undefined' || botUpdate.flowId === 'null')
      botUpdate.flowId = null;

    // Map aiProviderId (DTO) to aiConfigId (Entity)
    // The frontend sends the Config ID in the providerId field currently.
    // We map it to the new column.
    if (
      botUpdate.aiProviderId === 'undefined' ||
      botUpdate.aiProviderId === 'null'
    ) {
      botUpdate.aiProviderId = null;
    }

    // Explicitly handle the mapping
    if (botUpdate.aiProviderId !== undefined) {
      (bot as any).aiConfigId = botUpdate.aiProviderId;
      delete botUpdate.aiProviderId; // Remove from spread to avoid error
    }

    Object.assign(bot, botUpdate);
    await this.botRepository.save(bot);

    // 3. Update active widget version if visual fields are present
    const hasVisualUpdates = [
      primaryColor,
      widgetPosition,
      widgetButtonSize,
      showAvatar,
      showTimestamp,
      welcomeMessage,
      placeholderText,
      allowedOrigins,
    ].some((v) => v !== undefined);

    if (hasVisualUpdates && bot.createdBy) {
      try {
        const configUpdates: any = {};

        if (
          primaryColor ||
          widgetPosition ||
          widgetButtonSize ||
          showAvatar !== undefined ||
          showTimestamp !== undefined
        ) {
          configUpdates.theme = {};
          if (primaryColor) configUpdates.theme.primaryColor = primaryColor;
          if (widgetPosition) configUpdates.theme.position = widgetPosition;
          if (widgetButtonSize)
            configUpdates.theme.buttonSize = widgetButtonSize;
          if (showAvatar !== undefined)
            configUpdates.theme.showAvatar = showAvatar;
          if (showTimestamp !== undefined)
            configUpdates.theme.showTimestamp = showTimestamp;
        }

        if (welcomeMessage || placeholderText) {
          configUpdates.messages = {};
          if (welcomeMessage) configUpdates.messages.welcome = welcomeMessage;
          if (placeholderText)
            configUpdates.messages.placeholder = placeholderText;
        }

        if (allowedOrigins) {
          configUpdates.security = { allowedOrigins };
        }

        this.logger.log(
          `Visual updates detected for bot ${id}, updating active version...`,
        );
        await this.widgetVersionService.updateActiveVersionConfig(
          id,
          configUpdates,
          bot.createdBy, // Use creator as updater if not explicitly passed (context limitation)
          'Updated via Bot Settings',
        );
      } catch (error) {
        this.logger.error(
          `Failed to update widget visual config: ${error.message}`,
        );
        // Don't fail the request, just log
      }
    }

    return this.findOne(id, workspaceId); // Return fresh with flattened config
  }

  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    await this.botRepository.softDelete(id);
  }

  async activate(id: string, workspaceId: string) {
    return this.update(id, workspaceId, { status: BotStatus.ACTIVE });
  }

  async pause(id: string, workspaceId: string) {
    return this.update(id, workspaceId, { status: BotStatus.PAUSED });
  }

  async archive(id: string, workspaceId: string) {
    return this.update(id, workspaceId, { status: BotStatus.ARCHIVED });
  }

  async linkKnowledgeBase(
    botId: string,
    workspaceId: string,
    dto: LinkKnowledgeBaseDto,
  ) {
    const bot = await this.findOne(botId, workspaceId);

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

  async unlinkKnowledgeBase(
    botId: string,
    workspaceId: string,
    knowledgeBaseId: string,
  ) {
    // Verify ownership
    await this.findOne(botId, workspaceId);
    await this.botKbRepository.delete({ botId, knowledgeBaseId });
  }

  async getLinkedKnowledgeBases(botId: string, workspaceId?: string) {
    // Optionally verify ownership if workspaceId is provided
    if (workspaceId) {
      await this.findOne(botId, workspaceId);
    }

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
    workspaceId: string,
    knowledgeBaseId: string,
    isActive: boolean,
  ) {
    // Verify ownership
    await this.findOne(botId, workspaceId);

    const link = await this.botKbRepository.findOne({
      where: { botId, knowledgeBaseId },
    });

    if (!link) {
      throw new NotFoundException('Knowledge base link not found');
    }

    link.isActive = isActive;
    return this.botKbRepository.save(link);
  }

  async duplicate(
    id: string,
    workspaceId: string,
    userId: string,
    newName?: string,
  ) {
    const bot = await this.findOne(id, workspaceId);

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

  async getBotChannels(
    botId: string,
    workspaceId: string,
    options?: { validated?: boolean },
  ) {
    await this.findOne(botId, workspaceId);

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
    workspaceId: string,
    dto: CreateBotChannelDto,
    userId: string,
  ) {
    const bot = await this.findOne(botId, workspaceId);

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
    workspaceId: string,
    channelId: string,
    dto: UpdateBotChannelDto,
    userId: string,
  ) {
    // Verify bot ownership implicitly by fetching channel which needs botId
    // But to be safe and consistent with other methods:
    await this.findOne(botId, workspaceId);

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

  async deleteBotChannel(
    botId: string,
    workspaceId: string,
    channelId: string,
  ) {
    await this.findOne(botId, workspaceId);

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
    workspaceId: string,
    channelId: string,
    isActive: boolean,
    userId: string,
  ) {
    return this.updateBotChannel(
      botId,
      workspaceId,
      channelId,
      { isActive },
      userId,
    );
  }

  // Appearance logic moved to BotAppearanceService
}
