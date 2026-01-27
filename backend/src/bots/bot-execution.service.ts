import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { ChannelEntity } from '../channels/infrastructure/persistence/relational/entities/channel.entity';
import { MessengerService } from '../channels/providers/messenger.service';
import { InstagramService } from '../channels/providers/instagram.service';
import { TelegramService } from '../channels/providers/telegram.service';
import { KBRagService } from '../knowledge-base/services/kb-rag.service';
import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { I18nService } from 'nestjs-i18n';

export interface IncomingMessage {
  channel: string;
  senderId: string;
  message: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

export interface ChatResult {
  answer: string;
  sources: any[];
  messageId?: string;
}

@Injectable()
export class BotExecutionService {
  private readonly logger = new Logger(BotExecutionService.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private botKbRepository: Repository<BotKnowledgeBaseEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ChannelEntity)
    private channelRepository: Repository<ChannelEntity>,
    private messengerService: MessengerService,
    private instagramService: InstagramService,
    private telegramService: TelegramService,
    private kbRagService: KBRagService,
    private aiProvidersService: AiProvidersService,
    private readonly i18n: I18nService,
  ) { }

  /**
   * Core execution method: Orchestrates the Bot's "thinking" process.
   * 1. Retrieves Bot configuration
   * 2. Gathers Context (RAG)
   * 3. Calls AI Provider
   */
  async generateBotResponse(
    botId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    contextOverride?: {
      conversationId?: string;
      workspaceId?: string;
      systemPromptOverride?: string;
    },
  ): Promise<ChatResult> {
    const bot = await this.botRepository.findOne({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException(`Bot ${botId} not found`);
    }

    const workspaceId =
      bot.workspaceId || contextOverride?.workspaceId || undefined;

    // 1. Gather RAG Context
    let ragSources: any[] = [];
    let ragContextString = '';

    try {
      const linkedKBs = await this.botKbRepository.find({
        where: { botId: bot.id, isActive: true },
        order: { priority: 'ASC' },
      });

      if (linkedKBs.length > 0) {
        const kbIds = linkedKBs.map((kb) => kb.knowledgeBaseId);
        ragSources = await this.kbRagService.gatherRAGContext(
          message,
          workspaceId || 'default',
          kbIds,
        ); // Using public method

        // SMART CONTEXT: Take as many chunks as fit in ~3000 tokens (approx 12000 chars)
        // This is better than a fixed number (slice(0, 10)) because chunks vary in length.
        const SAFE_CONTEXT_CHARS = 12000;
        let currentChars = 0;
        const selectedChunks: any[] = [];

        // We already fetched top 20 candidates in previous steps (via service config) or default to all returned
        for (const chunk of ragSources) {
          const chunkLength = chunk.content.length;
          if (currentChars + chunkLength > SAFE_CONTEXT_CHARS) {
            break; // Stop if adding this chunk exceeds limit
          }
          selectedChunks.push(chunk);
          currentChars += chunkLength;
        }

        if (selectedChunks.length > 0) {
          ragContextString = selectedChunks
            .map((chunk, index) => `[Source ${index + 1}]\n${chunk.content}`)
            .join('\n\n');
        }
      }
    } catch (error) {
      this.logger.warn(`RAG context gathering failed: ${error.message}`);
    }

    // 2. Build System Prompt
    let systemPrompt =
      contextOverride?.systemPromptOverride ||
      bot.systemPrompt ||
      'You are a helpful assistant.';

    // Add Multilingual instruction
    systemPrompt +=
      "\n\nINSTRUCTION: Always respond in the same language as the user's latest message. If the context information from the knowledge base is in a different language, translate relevant points while answering.";

    // Add RAG Context
    // const lang = I18nContext.current()?.lang;
    if (ragContextString) {
      systemPrompt += `\n\nUse the following context from the knowledge base to answer questions:\n\n${ragContextString}`;
    }

    // 3. Prepare Messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: message },
    ];

    // 4. Call AI Provider
    let answer = '';
    const modelName = bot.aiModelName || 'gpt-3.5-turbo';

    try {
      if (bot.aiConfigId) {
        // Use specific provider configured for this bot
        answer = await this.aiProvidersService.chatWithHistoryUsingProvider(
          messages,
          modelName,
          bot.aiConfigId,
          'workspace',
          bot.workspaceId ||
          contextOverride?.workspaceId ||
          bot.createdBy ||
          'system',
        );
      } else {
        // Fallback to generic chat
        answer = await this.aiProvidersService.chatWithHistory(
          messages,
          modelName,
        );
      }
    } catch (error) {
      this.logger.error(
        `AI Provider call failed for Bot ${botId}: ${error.message}`,
      );
      // Final fallback to generic chat if specific provider fails
      answer = await this.aiProvidersService.chatWithHistory(
        messages,
        modelName,
      );
    }

    return {
      answer,
      sources: ragSources.slice(0, 5),
    };
  }

  // --- Legacy / Webhook Processing ---

  async processMessage(incomingMessage: IncomingMessage): Promise<void> {
    try {
      this.logger.log(
        `Processing message from ${incomingMessage.channel}: ${incomingMessage.senderId}`,
      );

      const bot = await this.findActiveBotForChannel(incomingMessage.channel);

      if (!bot) {
        this.logger.warn(
          `No active bot found for channel: ${incomingMessage.channel}`,
        );
        return;
      }

      // TODO: Fetch conversation history for this external user
      // For now, passing empty history as this service didn't handle history before
      const response = await this.generateBotResponse(
        bot.id,
        incomingMessage.message,
        [],
      );

      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        response.answer,
      );

      this.logger.log(`✅ Bot response sent to ${incomingMessage.senderId}`);
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );
      // Optional: Send error message to user
    }
  }

  private async findActiveBotForChannel(
    channel: string,
  ): Promise<BotEntity | null> {
    const channelEntity = await this.channelRepository.findOne({
      where: { type: channel, isActive: true },
      relations: ['bot'],
    });

    if (channelEntity?.bot && channelEntity.bot.isActive) {
      return channelEntity.bot;
    }

    return null;
  }

  async sendResponse(
    channel: string,
    recipientId: string,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending response to ${channel}: ${recipientId}`);

      switch (channel) {
        case 'facebook':
          await this.sendFacebookMessage(recipientId, message);
          break;
        case 'instagram':
          await this.sendInstagramMessage(recipientId, message);
          break;
        case 'telegram':
          await this.sendTelegramMessage(recipientId, message);
          break;
        default:
          this.logger.warn(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(
        `Error sending response: ${error.message}`,
        error.stack,
      );
    }
  }

  private async sendFacebookMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.messengerService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Facebook message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`❌ Failed to send Facebook message: ${result.error}`);
    }
  }

  private async sendInstagramMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.instagramService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Instagram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`❌ Failed to send Instagram message: ${result.error}`);
    }
  }

  private async sendTelegramMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const result = await this.telegramService.sendMessage({
      recipientId,
      message,
    });

    if (result.success) {
      this.logger.log(
        `✅ Telegram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`❌ Failed to send Telegram message: ${result.error}`);
    }
  }
}
