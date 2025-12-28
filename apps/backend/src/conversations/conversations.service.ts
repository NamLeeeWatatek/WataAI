import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import { ConversationStatus, MessageRole } from './conversations.enum';
import { ContactEntity } from './infrastructure/persistence/relational/entities/contact.entity';
import { KBRagService } from '../knowledge-base/services/kb-rag.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationStatusDto,
  MessageFeedbackDto,
  CreateMessageFeedbackDto,
} from './dto/create-conversation.dto';
import { ConversationsGateway } from './conversations.gateway';
import { ChannelStrategy } from '../channels/channel.strategy';
import { ChannelsService } from '../channels/channels.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AiProvidersService } from '../ai-providers/ai-providers.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessageFeedbackEntity)
    private feedbackRepository: Repository<MessageFeedbackEntity>,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @Inject(forwardRef(() => ConversationsGateway))
    private conversationsGateway: ConversationsGateway,
    @Inject(forwardRef(() => ChannelStrategy))
    private channelStrategy: ChannelStrategy,
    @Inject(forwardRef(() => ChannelsService))
    private channelsService: ChannelsService,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
    private ragService: KBRagService,
    private aiProvidersService: AiProvidersService,
  ) {}

  async create(
    createDto: CreateConversationDto & {
      workspaceId?: string;
      source?: any;
      type?: any;
      status?: any;
    },
  ) {
    // Validate channel if provided
    if (createDto.channelId) {
      const channel = await this.channelsService.findOne(createDto.channelId);
      if (!channel) {
        throw new Error(`Channel ${createDto.channelId} not found.`);
      }
    }

    // Resolve or Create Contact
    let contactId = createDto.metadata?.contactId;
    if (!contactId && (createDto.externalId || createDto.metadata?.email)) {
      const contact = await this.findOrCreateContact({
        workspaceId: createDto.workspaceId!,
        externalId: createDto.externalId || undefined,
        name: createDto.metadata?.name,
        email: createDto.metadata?.email,
      });
      contactId = contact.id;
    }

    const conversation = this.conversationRepository.create({
      ...createDto,
      workspaceId: createDto.workspaceId,
      channelType: createDto.channelType ?? 'web',
      source: createDto.source ?? 'web',
      type: createDto.type ?? 'support',
      status: ConversationStatus.ACTIVE,
      contactId,
      metadata: createDto.metadata || {},
    });
    return this.conversationRepository.save(conversation);
  }

  private async findOrCreateContact(params: {
    workspaceId: string;
    externalId?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }): Promise<ContactEntity> {
    let contact: ContactEntity | null = null;

    if (params.externalId) {
      contact = await this.contactRepository.findOne({
        where: {
          workspaceId: params.workspaceId,
          externalId: params.externalId,
        },
      });
    } else if (params.email) {
      contact = await this.contactRepository.findOne({
        where: { workspaceId: params.workspaceId, email: params.email },
      });
    }

    if (!contact) {
      contact = this.contactRepository.create({
        workspaceId: params.workspaceId,
        externalId: params.externalId,
        email: params.email,
        name: params.name,
        avatar: params.avatar,
      });
      return this.contactRepository.save(contact);
    }

    return contact;
  }

  async findAll(options: {
    botId?: string;
    channelType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    workspaceId?: string;
    onlyChannelConversations?: boolean;
  }) {
    // ðŸ” DEBUG: Log filter options
    this.logger.log('========== FIND ALL CHANNEL CONVERSATIONS ==========');
    this.logger.log('Options:', JSON.stringify(options, null, 2));

    // âœ… PROFESSIONAL: This service ONLY handles CHANNEL conversations
    // AI chat conversations are handled by AiConversationsService
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.deletedAt IS NULL')
      .andWhere('conversation.channelId IS NOT NULL'); // âœ… ALWAYS filter for channel conversations

    // âœ… Use decentralized workspaceId for direct filtering
    if (options.workspaceId) {
      this.logger.log(`âœ… Filter: workspaceId = ${options.workspaceId}`);
      query.andWhere('conversation.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    } else {
      this.logger.warn(
        'âš ï¸  NO workspaceId filter - will return all workspaces!',
      );
    }

    // Join bot relation for metadata/UI
    query.leftJoinAndSelect('conversation.bot', 'bot');

    if (options.botId) {
      this.logger.log(`âœ… Filter: botId = ${options.botId}`);
      query.andWhere('conversation.botId = :botId', { botId: options.botId });
    }

    if (options.channelType) {
      this.logger.log(`âœ… Filter: channelType = ${options.channelType}`);
      query.andWhere('conversation.channelType = :channelType', {
        channelType: options.channelType,
      });
    }

    if (options.status) {
      query.andWhere('conversation.status = :status', {
        status: options.status,
      });
    }

    if (options.startDate) {
      query.andWhere('conversation.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      query.andWhere('conversation.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);

    query
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    // ðŸ” DEBUG: Log SQL query
    const sql = query.getSql();
    this.logger.log('ðŸ“ Generated SQL:', sql);
    this.logger.log('ðŸ“ Parameters:', JSON.stringify(query.getParameters()));

    const [items, total] = await query.getManyAndCount();

    this.logger.log(`ðŸ“Š Query result: ${items.length} items, ${total} total`);
    if (items.length > 0) {
      this.logger.log('Sample result:', {
        id: items[0].id,
        botId: items[0].botId,
        channelId: items[0].channelId,
        channelType: items[0].channelType,
      });
    } else {
      this.logger.warn('âŒ NO RESULTS! Check filters above.');
    }

    const formattedItems = await Promise.all(
      items.map(async (item) => {
        let channelName = item.channelType || 'Unknown';
        let channelMetadata = {};

        if (item.channelId) {
          try {
            const channel = await this.channelsService.findOne(item.channelId);
            if (channel) {
              channelName = channel.name || channelName;
              channelMetadata = channel.metadata || {};
            }
          } catch (error) {
            this.logger.warn(
              `Failed to fetch channel info for ${item.channelId}: ${error.message}`,
            );
          }
        }

        let lastMessage = 'No messages yet';
        try {
          const lastMsg = await this.messageRepository.findOne({
            where: { conversationId: item.id },
            order: { sentAt: 'DESC' },
          });
          if (lastMsg) {
            lastMessage = lastMsg.content;
          }
        } catch (error) {}

        return {
          ...item,
          channelName,
          channelMetadata,
          lastMessage,
        };
      }),
    );

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateStatus(id: string, dto: UpdateConversationStatusDto) {
    const conversation = await this.findOne(id);
    conversation.status = dto.status;
    return this.conversationRepository.save(conversation);
  }

  async close(id: string) {
    return this.updateStatus(id, { status: ConversationStatus.CLOSED });
  }

  async archive(id: string) {
    return this.updateStatus(id, { status: ConversationStatus.ARCHIVED });
  }

  /**
   * Human Takeover - Agent takes over conversation from bot
   */
  async takeover(id: string, agentId: string) {
    const conversation = await this.findOne(id);

    // Update metadata to mark human takeover
    conversation.metadata = {
      ...conversation.metadata,
      humanTakeover: true,
      takenOverBy: agentId,
      takenOverAt: new Date().toISOString(),
    };

    // Save conversation
    const updated = await this.conversationRepository.save(conversation);

    // Emit event for real-time updates
    this.conversationsGateway.server
      .to(id)
      .emit('conversation:updated', updated);

    this.logger.log(`ðŸ‘¤ Agent ${agentId} took over conversation ${id}`);

    return updated;
  }

  /**
   * Hand Back - Agent returns conversation to bot
   */
  async handback(id: string) {
    const conversation = await this.findOne(id);

    // Update metadata to remove human takeover
    conversation.metadata = {
      ...conversation.metadata,
      humanTakeover: false,
      handedBackAt: new Date().toISOString(),
    };

    const updated = await this.conversationRepository.save(conversation);

    // Emit event for real-time updates
    this.conversationsGateway.server
      .to(id)
      .emit('conversation:updated', updated);

    this.logger.log(`🤖 Conversation ${id} handed back to bot`);

    return updated;
  }

  async delete(id: string) {
    await this.conversationRepository.softDelete(id);
  }

  async addMessage(conversationId: string, createDto: CreateMessageDto) {
    // Load conversation with bot relation to get workspaceId
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['bot'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    // âœ… Check Quota before proceeding
    const workspaceId =
      conversation.workspaceId || conversation.bot?.workspaceId;
    if (workspaceId) {
      const quota =
        await this.subscriptionsService.checkQuotaLimit(workspaceId);
      if (!quota.withinLimit) {
        throw new BadRequestException(
          'Message limit exceeded for this workspace. Please upgrade your plan.',
        );
      }
    }

    const message = this.messageRepository.create({
      ...createDto,
      conversationId,
      workspaceId,
      sender: (createDto.sender as any) ?? createDto.role,
      metadata: createDto.metadata || {},
    });

    const savedMessage = await this.messageRepository.save(message);

    // Emit real-time event to WebSocket clients
    this.conversationsGateway.emitNewMessage(conversationId, savedMessage);

    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    // âœ… Automated RAG Discovery Interception
    if (
      createDto.role === 'user' &&
      (conversation.type === 'discovery' ||
        conversation.metadata?.discoveryEnabled)
    ) {
      this.handleRagDiscovery(conversation, savedMessage);
    }

    // âœ… Increment Quota usage
    if (workspaceId) {
      await this.subscriptionsService.incrementMessageUsage(workspaceId);
    }

    // Try to send to external channel if it's an assistant message
    if (
      createDto.role === 'assistant' &&
      conversation.externalId &&
      conversation.channelType
    ) {
      try {
        await this.sendMessageToExternalChannel(
          conversation,
          createDto.content,
        );
      } catch (error) {
        // Log error but don't fail the request - message is already saved
        this.logger.error(
          `Failed to send message to external channel: ${error.message}`,
        );
      }
    }

    return savedMessage;
  }

  private async sendMessageToExternalChannel(
    conversation: ConversationEntity,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `ðŸ”„ Sending message to ${conversation.channelType} channel for conversation ${conversation.id}`,
      );

      // Debug: Log conversation details
      this.logger.debug(`Conversation details:`, {
        id: conversation.id,
        channelId: conversation.channelId,
        channelType: conversation.channelType,
        externalId: conversation.externalId,
        botId: conversation.botId,
        hasBot: !!conversation.bot,
        botWorkspaceId: conversation.bot?.workspaceId,
      });

      // Get channel connection to get access token
      if (!conversation.channelId) {
        this.logger.warn(
          `âš ï¸   No channelId for conversation ${conversation.id}. Channel may have been disconnected. Skipping external message send.`,
        );
        return; // Gracefully skip if channel was disconnected
      }

      // Get channel by ID
      const channel = await this.channelsService.findOne(
        conversation.channelId,
        undefined, // Don't filter by workspace
      );

      if (!channel) {
        this.logger.warn(
          `âš ï¸  Channel ${conversation.channelId} not found - conversation may be orphaned`,
        );
        return;
      }

      // Get provider for this channel type
      const provider = this.channelStrategy.getProvider(
        conversation.channelType,
      );

      if (!provider) {
        this.logger.warn(
          `No provider found for channel type: ${conversation.channelType}`,
        );
        return;
      }

      // Set credentials if provider supports it
      if ('setCredentials' in provider && channel.accessToken) {
        (provider as any).setCredentials(
          channel.accessToken,
          channel.credential?.clientSecret || '',
        );
      }

      // Send message to external channel
      const result = await provider.sendMessage({
        to: conversation.externalId || '',
        content: message,
      });

      if (result.success) {
        this.logger.log(
          `âœ… Message sent successfully to ${conversation.channelType} (messageId: ${result.messageId})`,
        );
      } else {
        this.logger.error(
          `â Œ Failed to send message to ${conversation.channelType}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending message to external channel: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleRagDiscovery(
    conversation: ConversationEntity,
    userMessage: MessageEntity,
  ) {
    try {
      this.logger.log(
        `ðŸ”  Triggering automated RAG discovery for conversation ${conversation.id}`,
      );

      const workspaceId =
        conversation.workspaceId || conversation.bot?.workspaceId;
      if (!workspaceId) return;

      // 1. Fetch recent history for context
      const historyItems = await this.messageRepository.find({
        where: { conversationId: conversation.id },
        order: { sentAt: 'DESC' },
        take: 6, // Current message + 5 previous
      });
      // Reverse to chronological and exclude current message
      const history = historyItems
        .reverse()
        .filter((m) => m.id !== userMessage.id);

      // 2. Adaptive Routing & Query Rewriting
      const { searchQuery, needsKB } = await this.rewriteDiscoveryQuery(
        workspaceId,
        history,
        userMessage.content,
      );

      if (!needsKB) {
        this.logger.log(
          `âœ¨ Message classified as GENERAL. Skipping KB search.`,
        );
        return;
      }

      this.logger.log(`ðŸ”„ Standalone Discovery Query: "${searchQuery}"`);

      // 3. Perform semantic search with rewritten query
      const results = await this.ragService.query(
        searchQuery,
        workspaceId,
        undefined,
        3,
        0.5,
      );

      if (results.length > 0) {
        // 4. Format helpful response with citations
        const citationText = results
          .map((r, i) => `[${i + 1}] ${r.content}`)
          .join('\n\n');
        const responseContent = `Based on our knowledge base:\n\n${citationText}\n\nHow else can I help?`;

        // 5. Add assistant message with sources
        await this.addMessage(conversation.id, {
          role: MessageRole.ASSISTANT,
          content: responseContent,
          sources: results.map((r) => ({
            documentId: r.documentId!,
            title: r.metadata?.title || 'Knowledge Base Source',
            content: r.content,
            score: r.score,
          })),
        });
      }
    } catch (error) {
      this.logger.error(`â Œ RAG Discovery failed: ${error.message}`);
    }
  }

  private async rewriteDiscoveryQuery(
    workspaceId: string,
    history: MessageEntity[],
    currentMessage: string,
  ): Promise<{ searchQuery: string; needsKB: boolean }> {
    try {
      const historyText = history
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `Analyze the conversation history and the new message. 
Determine if the message requires searching a Knowledge Base (factual questions, "how-to", product info) or if it is just a general greeting/casual talk.

Output format:
ACTION: [SEARCH or GENERAL]
QUERY: [Standalone search query if SEARCH, otherwise the original message]

History:
${historyText}

Message: ${currentMessage}`;

      const response = await this.aiProvidersService.chat(
        prompt,
        'gemini-2.0-flash',
      );

      const lines = response.split('\n');
      const action =
        lines
          .find((l) => l.startsWith('ACTION:'))
          ?.split(':')[1]
          ?.trim() || 'SEARCH';
      const queryValue =
        lines
          .find((l) => l.startsWith('QUERY:'))
          ?.split(':')[1]
          ?.trim() || currentMessage;

      return {
        searchQuery: queryValue.replace(/^"|"$/g, ''),
        needsKB: action === 'SEARCH',
      };
    } catch (error) {
      this.logger.warn(
        `Failed to rewrite query: ${error.message}. Defaulting to SEARCH.`,
      );
      return { searchQuery: currentMessage, needsKB: true };
    }
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string; after?: string },
  ) {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    // Load older messages (for scroll up / load more)
    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: options.before },
      });
      if (beforeMessage) {
        query.andWhere('message.sentAt < :beforeDate', {
          beforeDate: beforeMessage.sentAt,
        });
      }
    }

    // Load newer messages (for polling / real-time)
    if (options?.after) {
      const afterMessage = await this.messageRepository.findOne({
        where: { id: options.after },
      });
      if (afterMessage) {
        query.andWhere('message.sentAt > :afterDate', {
          afterDate: afterMessage.sentAt,
        });
      }
    }

    const limit = Math.min(options?.limit ?? 50, 100);

    // âœ… Order by DESC (newest first) for standard chat app behavior
    // Frontend will display in order received (oldest at top, newest at bottom)
    const messages = await query
      .orderBy('message.sentAt', 'DESC')
      .take(limit)
      .getMany();

    // âœ… Reverse to get chronological order (oldest first, newest last)
    // This makes it easier for frontend to append new messages
    const chronologicalMessages = messages.reverse();

    return {
      messages: chronologicalMessages,
      hasMore: messages.length === limit,
      count: messages.length,
    };
  }

  async getMessage(conversationId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async updateMessageFeedback(
    conversationId: string,
    messageId: string,
    dto: MessageFeedbackDto,
  ) {
    const message = await this.getMessage(conversationId, messageId);

    if (dto.feedback !== undefined) message.feedback = dto.feedback || null;
    if (dto.feedbackComment !== undefined)
      message.feedbackComment = dto.feedbackComment;

    return this.messageRepository.save(message);
  }

  async createMessageFeedback(
    messageId: string,
    dto: CreateMessageFeedbackDto,
  ) {
    const existing = await this.feedbackRepository.findOne({
      where: { messageId },
    });

    if (existing) {
      existing.rating = dto.rating;
      existing.comment = dto.comment;
      return this.feedbackRepository.save(existing);
    }

    const feedback = this.feedbackRepository.create({
      messageId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getMessageFeedback(messageId: string) {
    return this.feedbackRepository.findOne({
      where: { messageId },
    });
  }

  async getConversationStats(botId: string, period: 'day' | 'week' | 'month') {
    const startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);

    const [totalConversations, activeConversations, totalMessages] =
      await Promise.all([
        this.conversationRepository.count({
          where: {
            botId,
            createdAt: MoreThanOrEqual(startDate),
          },
        }),
        this.conversationRepository.count({
          where: {
            botId,
            status: ConversationStatus.ACTIVE,
          },
        }),
        this.messageRepository
          .createQueryBuilder('message')
          .innerJoin('message.conversation', 'conversation')
          .where('conversation.botId = :botId', { botId })
          .andWhere('message.sentAt >= :startDate', { startDate })
          .getCount(),
      ]);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      period,
      startDate,
    };
  }

  async findOrCreateByExternalId(
    botId: string,
    externalId: string,
    channelType: string,
    contactInfo?: { name?: string; avatar?: string },
    workspaceId?: string,
  ) {
    let conversation = await this.conversationRepository.findOne({
      where: { botId, externalId, channelType },
    });

    if (!conversation) {
      conversation = await this.create({
        botId,
        externalId,
        channelType,
        workspaceId,
        metadata: {
          name: contactInfo?.name,
          avatar: contactInfo?.avatar,
        },
      });
    }

    return conversation;
  }

  async findOrCreateFromWebhook(params: {
    botId: string;
    channelId: string;
    channelType: string;
    externalId: string;
    contactName?: string;
    contactAvatar?: string;
    metadata?: Record<string, any>;
    workspaceId?: string;
  }): Promise<ConversationEntity> {
    // Find by externalId + botId + channelType
    let conversation = await this.conversationRepository.findOne({
      where: {
        externalId: params.externalId,
        botId: params.botId,
        channelType: params.channelType,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!conversation) {
      // Create new conversation (this will handle contact resolution internally)
      conversation = await this.create({
        botId: params.botId,
        channelId: params.channelId,
        channelType: params.channelType,
        externalId: params.externalId,
        workspaceId: params.workspaceId,
        status: ConversationStatus.ACTIVE,
        metadata: {
          ...params.metadata,
          name: params.contactName,
          avatar: params.contactAvatar,
        },
      });

      this.logger.log(
        `Creating new conversation for ${params.contactName} (${params.externalId})`,
      );
    } else {
      // Update existing conversation
      conversation.lastMessageAt = new Date();
      conversation.status = ConversationStatus.ACTIVE;

      // Update channelId if it changed
      if (conversation.channelId !== params.channelId) {
        conversation.channelId = params.channelId;
      }

      if (params.metadata) {
        conversation.metadata = {
          ...conversation.metadata,
          ...params.metadata,
        };
      }
      conversation = await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async addMessageFromWebhook(params: {
    conversationId: string;
    content: string;
    role: MessageRole;
    metadata?: Record<string, any>;
  }): Promise<MessageEntity> {
    return this.addMessage(params.conversationId, {
      role: params.role,
      content: params.content,
      metadata: params.metadata,
      sender: params.role === MessageRole.USER ? 'customer' : 'assistant',
    });
  }
}
