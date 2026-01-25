import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ContactEntity } from '../../conversations/infrastructure/persistence/relational/entities/contact.entity';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import { WidgetVersionEntity } from '../infrastructure/persistence/relational/entities/widget-version.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  ConversationStatus,
  MessageRole,
} from '../../conversations/conversations.enum';
import { BotStatus } from '../bots.enum';
import {
  CreatePublicConversationDto,
  AddPublicMessageDto,
  BotConfigResponseDto,
  CreateConversationResponseDto,
  MessageResponseDto,
  ConversationMessagesResponseDto,
} from '../dto/public-bot.dto';
import { ChunkSource } from '../../knowledge-base/services/kb-search.service';

import { WidgetVersionService } from './widget-version.service';
import { BotExecutionService } from '../bot-execution.service';

@Injectable()
export class PublicBotService {
  private readonly logger = new Logger(PublicBotService.name);

  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(WidgetVersionEntity)
    private readonly widgetVersionRepository: Repository<WidgetVersionEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepository: Repository<ContactEntity>,
    private readonly botExecutionService: BotExecutionService,

    private readonly widgetVersionService: WidgetVersionService,
    private readonly i18n: I18nService,
  ) { }

  async getBotConfig(
    botId: string,
    origin?: string,
    version?: string,
    versionId?: string,
  ): Promise<BotConfigResponseDto> {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: BotStatus.ACTIVE },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or widget is disabled');
    }

    let widgetVersion;

    if (versionId) {
      widgetVersion = await this.widgetVersionRepository.findOne({
        where: { id: versionId, botId },
      });
      if (!widgetVersion) {
        throw new NotFoundException('Widget version not found');
      }
    } else if (version) {
      widgetVersion = await this.widgetVersionRepository.findOne({
        where: { botId, version },
      });
      if (!widgetVersion) {
        throw new NotFoundException(`Widget version ${version} not found`);
      }
    } else {
      widgetVersion = await this.widgetVersionService.getActiveVersion(botId);
      if (!widgetVersion) {
        throw new NotFoundException('No active widget version found');
      }
    }

    let allowedOrigins = widgetVersion.config.security?.allowedOrigins || [];
    if (
      allowedOrigins.length === 0 ||
      (allowedOrigins.length === 1 && allowedOrigins[0] === '')
    ) {
      allowedOrigins = ['*'];
    }
    if (origin) {
      const allowed = this.isOriginAllowed(allowedOrigins, origin);
      if (!allowed) {
        this.logger.warn(
          `Origin ${origin} not allowed for bot ${botId}.Allowed origins: ${allowedOrigins.join(', ')} `,
        );
        throw new ForbiddenException('Origin not allowed');
      }
    }

    return {
      botId: bot.id,
      version: widgetVersion.version,
      versionId: widgetVersion.id,
      name: bot.name,
      description: bot.description,
      avatarUrl: bot.avatarUrl,
      defaultLanguage: bot.defaultLanguage,
      timezone: bot.timezone,
      welcomeMessage:
        widgetVersion.config.messages?.welcome ||
        this.i18n.t('ai.defaultWelcome', {
          lang: I18nContext.current()?.lang,
        }),
      placeholderText:
        widgetVersion.config.messages?.placeholder ||
        this.i18n.t('ai.defaultPlaceholder', {
          lang: I18nContext.current()?.lang,
        }),
      theme: {
        primaryColor: widgetVersion.config.theme?.primaryColor || '#667eea',
        position: widgetVersion.config.theme?.position || 'bottom-right',
        buttonSize: widgetVersion.config.theme?.buttonSize || 'medium',
        showAvatar: widgetVersion.config.theme?.showAvatar ?? true,
        showTimestamp: widgetVersion.config.theme?.showTimestamp ?? true,
      },
    };
  }

  async createConversation(
    botId: string,
    dto: CreatePublicConversationDto,
    origin?: string,
  ): Promise<CreateConversationResponseDto> {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: BotStatus.ACTIVE },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or widget is disabled');
    }

    let allowedOrigins = bot.allowedOrigins || [];
    if (
      allowedOrigins.length === 0 ||
      (allowedOrigins.length === 1 && allowedOrigins[0] === '')
    ) {
      allowedOrigins = ['*'];
    }

    if (origin) {
      const allowed = this.isOriginAllowed(allowedOrigins, origin);
      if (!allowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    let contactId: string | null = null;
    const guestPhone = dto.metadata?.guestIdentity?.phone;

    if (guestPhone) {
      // Rate Limit Check: Max 5 conversations per phone per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const conversationCount = await this.conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.botId = :botId', { botId })
        .andWhere(
          "conversation.metadata -> 'guestIdentity' ->> 'phone' = :phone",
          { phone: guestPhone },
        )
        .andWhere('conversation.createdAt >= :today', { today })
        .getCount();

      if (conversationCount >= 5) {
        this.logger.warn(
          `Rate limit exceeded for phone ${guestPhone} on bot ${botId} `,
        );
        throw new ForbiddenException(
          'You have reached the daily limit for new conversations.',
        );
      }

      // Find or Create Contact
      let contact = await this.contactRepository.findOne({
        where: {
          phone: guestPhone,
          workspaceId: bot.workspaceId,
        },
      });

      if (!contact) {
        contact = this.contactRepository.create({
          workspaceId: bot.workspaceId,
          phone: guestPhone,
          name:
            dto.metadata?.guestIdentity?.name ||
            `Guest ${guestPhone.slice(-4)} `,
          avatar: dto.metadata?.avatar,
          metadata: {
            source: 'public-bot-widget',
            botId: botId,
            firstSeen: new Date().toISOString(),
          },
        });
        await this.contactRepository.save(contact);
        this.logger.log(
          `Created new contact ${contact.id} for phone ${guestPhone}`,
        );
      } else {
        // Update name if provided and wasn't set or looks like a default
        if (
          dto.metadata?.guestIdentity?.name &&
          (!contact.name || contact.name.startsWith('Guest '))
        ) {
          contact.name = dto.metadata.guestIdentity.name;
          await this.contactRepository.save(contact);
        }
      }
      contactId = contact.id;
    }

    const conversation = this.conversationRepository.create({
      botId,
      channelType: 'web',
      channelId: null,
      workspaceId: bot.workspaceId,
      contactId: contactId, // Link to Contact Entity
      metadata: {
        ...dto.metadata,
        guestIdentity: dto.metadata?.guestIdentity, // Ensure this is preserved
        contactName:
          dto.metadata?.guestIdentity?.name || dto.metadata?.name || null,
        contactPhone: guestPhone || null, // Top-level access for easier viewing
        contactAvatar: dto.metadata?.avatar || null,
        userId: dto.userId,
        origin,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
        source: 'widget',
      },
      status: ConversationStatus.ACTIVE,
    });

    await this.conversationRepository.save(conversation);

    this.logger.log(
      `Created public conversation ${conversation.id} for bot ${botId} from origin ${origin} (Guest: ${guestPhone || 'anonymous'})`,
    );

    return {
      conversationId: conversation.id,
      botId: bot.id,
      createdAt: conversation.createdAt,
    };
  }

  async sendMessage(
    conversationId: string,
    dto: AddPublicMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['bot', 'bot.knowledgeBases'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const bot = conversation.bot;

    if (!bot || bot.status !== BotStatus.ACTIVE) {
      throw new ForbiddenException('Bot is not available');
    }

    const userMessage = this.messageRepository.create({
      conversationId,
      workspaceId: conversation.workspaceId,
      role: MessageRole.USER,
      content: dto.message,
      metadata: dto.metadata || {},
    });
    await this.messageRepository.save(userMessage);

    this.logger.log(
      `User message saved: ${userMessage.id} in conversation ${conversationId} `,
    );

    // Fetch recent messages for context (reverse chronological to get latest)
    const recentMessages = await this.messageRepository.find({
      where: { conversationId },
      order: { sentAt: 'DESC' },
      take: 20, // Fetch deeper to ensure adequate context after filtering
    });

    // Valid history: remove current message, take 10 latest, then order chronologically
    const history = recentMessages
      .filter((m) => m.id !== userMessage.id)
      .slice(0, 10)
      .reverse();

    let aiContent = '';
    let sources: ChunkSource[] = [];
    let context = '';

    try {
      // Delegate to BotExecutionService for centralized logic
      const chatResult = await this.botExecutionService.generateBotResponse(
        bot.id,
        dto.message,
        history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { workspaceId: conversation.workspaceId },
      );

      aiContent = chatResult.answer;
      sources = chatResult.sources;

      // Flatten context for logging or metadata if needed
      context = chatResult.sources.map((s: any) => s.content).join('\n\n');
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message} `);
      aiContent =
        "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.";
    }

    const botMessage = this.messageRepository.create({
      conversationId,
      workspaceId: conversation.workspaceId,
      role: MessageRole.ASSISTANT,
      content: aiContent,
      sources: sources.length > 0 ? sources : null,
      metadata: {
        model: bot.aiModelName,
        hasContext: !!context,
        sourcesCount: sources.length,
      },
    });
    await this.messageRepository.save(botMessage);

    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    this.logger.log(
      `Bot response saved: ${botMessage.id} in conversation ${conversationId} `,
    );

    return {
      messageId: botMessage.id,
      content: botMessage.content,
      role: MessageRole.ASSISTANT,
      timestamp: botMessage.sentAt,
      metadata: {
        ...botMessage.metadata,
        sources: sources.length > 0 ? sources : undefined,
      },
    };
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<ConversationMessagesResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const limit = options?.limit || 50;
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.sentAt', 'DESC')
      .take(limit);

    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: options.before },
      });

      if (beforeMessage) {
        queryBuilder.andWhere('message.sentAt < :beforeTime', {
          beforeTime: beforeMessage.sentAt,
        });
      }
    }

    const messages = await queryBuilder.getMany();

    return {
      conversationId,
      messages: messages.reverse().map((m) => ({
        messageId: m.id,
        role: m.role as MessageRole,
        content: m.content,
        timestamp: m.sentAt,
        metadata: m.metadata,
      })),
    };
  }

  private isOriginAllowed(allowedOrigins: string[], origin: string): boolean {
    if (allowedOrigins.includes('*') || !origin) {
      return true;
    }

    return allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === origin) {
        return true;
      }

      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain);
      }

      return false;
    });
  }
}
