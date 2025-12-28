import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { ChannelEntity } from '../channels/infrastructure/persistence/relational/entities/channel.entity';
import { MessengerService } from '../channels/providers/messenger.service';
import { InstagramService } from '../channels/providers/instagram.service';
import { TelegramService } from '../channels/providers/telegram.service';
import { KBRagService } from '../knowledge-base/services/kb-rag.service';

export interface IncomingMessage {
  channel: string;
  senderId: string;
  message: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class BotExecutionService {
  private readonly logger = new Logger(BotExecutionService.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ChannelEntity)
    private channelRepository: Repository<ChannelEntity>,
    private messengerService: MessengerService,
    private instagramService: InstagramService,
    private telegramService: TelegramService,
    private kbRagService: KBRagService,
  ) { }

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

      await this.answerWithKnowledgeBase(bot, incomingMessage);
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );
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
        `âœ… Facebook message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Facebook message: ${result.error}`);
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
        `âœ… Instagram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Instagram message: ${result.error}`);
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
        `âœ… Telegram message sent to ${recipientId}: ${result.messageId}`,
      );
    } else {
      this.logger.error(`âŒ Failed to send Telegram message: ${result.error}`);
    }
  }

  private async answerWithKnowledgeBase(
    bot: BotEntity,
    incomingMessage: IncomingMessage,
  ): Promise<void> {
    try {
      this.logger.log(
        `Querying knowledge base for bot ${bot.name}: "${incomingMessage.message}"`,
      );

      const systemPrompt = bot.systemPrompt || bot.description || undefined;

      const result = await this.kbRagService.generateAnswerForAgent(
        incomingMessage.message,
        bot.id.toString(),
        undefined,
        undefined,
        systemPrompt,
      );

      const answer = result.answer;

      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        answer,
      );

      this.logger.log(
        `âœ… Knowledge base answer sent to ${incomingMessage.senderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error answering with knowledge base: ${error.message}`,
      );

      await this.sendResponse(
        incomingMessage.channel,
        incomingMessage.senderId,
        'Sorry, I encountered an error processing your message. Please try again.',
      );
    }
  }
}
