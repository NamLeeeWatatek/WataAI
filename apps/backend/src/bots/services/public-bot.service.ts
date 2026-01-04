import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
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
  ConversationSource,
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
import { KBRagService } from '../../knowledge-base/services/kb-rag.service';
import {
  AiProvidersService,
  ChatMessage,
} from '../../ai-providers/ai-providers.service';
import { WidgetVersionService } from './widget-version.service';

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
    private readonly kbRagService: KBRagService,
    private readonly aiProvidersService: AiProvidersService,
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

    const allowedOrigins = widgetVersion.config.security?.allowedOrigins || [
      '*',
    ];
    if (origin) {
      const allowed = this.isOriginAllowed(allowedOrigins, origin);
      if (!allowed) {
        this.logger.warn(
          `Origin ${origin} not allowed for bot ${botId}. Allowed origins: ${allowedOrigins.join(', ')}`,
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

    if (bot.allowedOrigins && origin) {
      const allowed = this.isOriginAllowed(bot.allowedOrigins, origin);
      if (!allowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    const conversation = this.conversationRepository.create({
      botId,
      channelType: 'web',
      channelId: null,
      metadata: {
        ...dto.metadata,
        contactName: dto.metadata?.name || null,
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
      `Created public conversation ${conversation.id} for bot ${botId} from origin ${origin}`,
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
      role: MessageRole.USER,
      content: dto.message,
      metadata: dto.metadata || {},
    });
    await this.messageRepository.save(userMessage);

    this.logger.log(
      `User message saved: ${userMessage.id} in conversation ${conversationId}`,
    );

    const history = await this.messageRepository.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
      take: 10,
    });

    let aiContent = '';
    let sources: any[] = [];
    let context = '';

    try {
      // Delegate to KBRagService for consistent RAG and AI Provider logic
      // This ensures we use the correct AI Provider (KB vs Bot), correct Model, and correct BaseURL/Settings
      const ragResult = await this.kbRagService.chatWithBotAndRAG(
        dto.message,
        bot.id,
        undefined, // Let service resolve KBs from botId, or we could pass activeKnowledgeBases.map(k => k.knowledgeBaseId)
        history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        bot.aiModelName || undefined
      );

      aiContent = ragResult.answer;
      sources = ragResult.sources.map(s => ({
        documentId: s.metadata?.documentId,
        title: s.metadata?.title || 'Document',
        content: s.content.substring(0, 200),
        score: s.score,
        metadata: s.metadata
      }));

      // Flatten context for logging or metadata if needed (optional, as logic is now inside service)
      context = ragResult.sources.map(s => s.content).join('\n\n');

    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      aiContent =
        "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.";
    }

    const botMessage = this.messageRepository.create({
      conversationId,
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
      `Bot response saved: ${botMessage.id} in conversation ${conversationId}`,
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

  private async resolveProviderScope(
    bot: BotEntity,
  ): Promise<[string, string] | [null, null]> {
    if (!bot.aiProviderId) {
      return [null, null];
    }

    // First check if it's a workspace-level config (where aiProviderId is the config ID)
    if (
      await this.aiProvidersService.configExists(
        bot.aiProviderId,
        'workspace',
        bot.workspaceId,
      )
    ) {
      return ['workspace', bot.workspaceId];
    }

    // Then check if it's a user-level config (bot creator)
    if (
      await this.aiProvidersService.configExists(
        bot.aiProviderId,
        'user',
        bot.createdBy || '',
      )
    ) {
      return bot.createdBy ? ['user', bot.createdBy] : [null, null];
    }

    return [null, null];
  }

  private async fallbackToGenericProvider(
    messages: ChatMessage[],
    model: string,
  ): Promise<string> {
    // Final fallback for development: use hardcoded API keys for common models
    this.logger.warn(`Using fallback provider for model ${model}`);

    // Route to appropriate generic provider based on model name
    if (
      model.includes('ollama') ||
      model.includes('deepseek') ||
      model.includes('llama')
    ) {
      // For Ollama/DeepSeek models, assume local Ollama instance
      return this.aiProvidersService.chatWithHistory(
        messages as any,
        model,
        undefined, // no api key for ollama
        'http://localhost:11434' as any, // baseUrl for ollama
      );
    } else if (model.includes('gemini') || model.includes('palm')) {
      // For Google models - would need a default API key
      throw new Error(
        `Fallback not available for Google models. Please configure AI provider in workspace settings.`,
      );
    } else if (model.includes('gpt') || model.includes('openai')) {
      // For OpenAI models - would need a default API key
      throw new Error(
        `Fallback not available for OpenAI models. Please configure AI provider in workspace settings.`,
      );
    } else {
      throw new Error(
        `No fallback provider available for model ${model}. Please configure AI provider in workspace settings.`,
      );
    }
  }

  private isOriginAllowed(allowedOrigins: string[], origin: string): boolean {
    if (allowedOrigins.includes('*')) {
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
