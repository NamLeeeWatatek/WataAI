import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotMessageProcessingEvent } from '../../shared/events';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { MessageRole } from '../../conversations/conversations.enum';
import { MessageBufferService } from '../services/message-buffer.service';
import { KBRagService } from '../../knowledge-base/services/kb-rag.service';
import { MessengerService } from '../../channels/providers/messenger.service';
import { InstagramService } from '../../channels/providers/instagram.service';
import { TelegramService } from '../../channels/providers/telegram.service';
import { ConversationsGateway } from '../../conversations/conversations.gateway';

@Injectable()
export class BotExecutionEventService {
  private readonly logger = new Logger(BotExecutionEventService.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    private messageBufferService: MessageBufferService,
    private kbRagService: KBRagService,
    private messengerService: MessengerService,
    private instagramService: InstagramService,
    private telegramService: TelegramService,
    @Inject(forwardRef(() => ConversationsGateway))
    private conversationsGateway: ConversationsGateway,
  ) {}

  @OnEvent('bot.message.processing')
  async handleBotMessageProcessing(event: BotMessageProcessingEvent) {
    this.logger.debug(
      `Bot message processing event: ${event.conversationId} - Bot: ${event.botId}`,
    );

    try {
      // ThÃªm tin nháº¯n vÃ o buffer
      this.messageBufferService.addMessage(
        event.conversationId,
        event.messageContent,
        event.botId,
        event.channelType,
        event.senderId,
        event.metadata,
        // Callback khi buffer Ä‘Æ°á»£c flush
        async (messages, context) => {
          await this.processBufferedMessages(messages, context);
        },
      );

      const bufferSize = this.messageBufferService.getBufferSize(
        event.conversationId,
        event.botId,
      );

      this.logger.log(
        `ðŸ“¦ Message buffered (${bufferSize} messages waiting) for conversation ${event.conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling bot message processing: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Xá»­ lÃ½ táº¥t cáº£ tin nháº¯n Ä‘Ã£ Ä‘Æ°á»£c buffer
   */
  private async processBufferedMessages(
    messages: Array<{ content: string; timestamp: Date; metadata?: any }>,
    context: {
      conversationId: string;
      botId: string;
      channelType: string;
      senderId: string;
    },
  ): Promise<void> {
    try {
      this.logger.log(
        `ðŸ¤– Processing ${messages.length} buffered messages for conversation ${context.conversationId}`,
      );

      // Láº¥y thÃ´ng tin bot
      const bot = await this.botRepository.findOne({
        where: { id: context.botId, isActive: true },
      });

      if (!bot) {
        this.logger.warn(`Bot ${context.botId} not found or inactive`);
        return;
      }

      // Gá»™p táº¥t cáº£ tin nháº¯n thÃ nh má»™t cÃ¢u há»i hoÃ n chá»‰nh
      const combinedMessage = messages
        .map((msg) => msg.content)
        .join('\n')
        .trim();

      this.logger.log(
        `ðŸ“ Combined message (${messages.length} parts):\n"${combinedMessage}"`,
      );

      // Láº¥y conversation Ä‘á»ƒ cÃ³ context
      const conversation = await this.conversationRepository.findOne({
        where: { id: context.conversationId },
        relations: ['messages'],
      });

      if (!conversation) {
        this.logger.warn(`Conversation ${context.conversationId} not found`);
        return;
      }

      // Táº¡o system prompt
      const systemPrompt = bot.systemPrompt || bot.description || undefined;

      // Gá»i AI Ä‘á»ƒ tráº£ lá»i
      this.logger.log(
        `ðŸ§  Querying AI for bot ${bot.name} with combined message...`,
      );

      const result = await this.kbRagService.generateAnswerForAgent(
        combinedMessage,
        bot.id.toString(),
        undefined,
        undefined,
        systemPrompt,
      );

      const answer = result.answer;

      this.logger.log(`âœ… AI response generated (${answer.length} chars)`);

      // âœ… Save bot response to conversation history using TypeORM
      try {
        const messageEntity = this.messageRepository.create({
          conversationId: context.conversationId,
          content: answer,
          role: MessageRole.ASSISTANT,
          metadata: {
            botId: context.botId,
            channelType: context.channelType,
            sources: result.sources || [],
          },
        });

        const savedMessage = await this.messageRepository.save(messageEntity);
        this.logger.log(
          `ðŸ’¾ Bot response saved to database: ${savedMessage.id}`,
        );

        // âœ… Emit WebSocket event for realtime UI update
        try {
          this.conversationsGateway.emitNewMessage(context.conversationId, {
            id: savedMessage.id,
            conversationId: savedMessage.conversationId,
            content: savedMessage.content,
            role: savedMessage.role,
            metadata: savedMessage.metadata,
            sentAt: savedMessage.sentAt,
          });
          this.logger.log(`ðŸ“¡ WebSocket event emitted for bot response`);
        } catch (wsError) {
          this.logger.warn(
            `Failed to emit WebSocket event: ${wsError.message}`,
          );
        }
      } catch (saveError) {
        this.logger.error(`Failed to save bot response: ${saveError.message}`);
      }

      // Gá»­i response qua channel
      await this.sendResponse(context.channelType, context.senderId, answer);

      this.logger.log(
        `âœ… Bot response sent to ${context.senderId} on ${context.channelType}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing buffered messages: ${error.message}`,
        error.stack,
      );

      // Gá»­i error message vá»›i thÃ´ng tin chi tiáº¿t hÆ¡n
      try {
        let errorMessage =
          'Xin lá»—i, tÃ´i gáº·p lá»—i khi xá»­ lÃ½ tin nháº¯n cá»§a báº¡n.';

        // PhÃ¢n loáº¡i lá»—i Ä‘á»ƒ Ä‘Æ°a ra message phÃ¹ há»£p
        if (
          error.message.includes('fetch failed') ||
          error.message.includes('ECONNREFUSED')
        ) {
          errorMessage =
            'Xin lá»—i, há»‡ thá»‘ng Ä‘ang gáº·p sá»± cá»‘ káº¿t ná»‘i. Vui lÃ²ng thá»­ láº¡i sau Ã­t phÃºt. ðŸ”§';
          this.logger.error(
            'ðŸš¨ Connection error detected - likely Qdrant or network issue',
          );
        } else if (
          error.message.includes('API key') ||
          error.message.includes('authentication')
        ) {
          errorMessage =
            'Xin lá»—i, há»‡ thá»‘ng AI Ä‘ang gáº·p váº¥n Ä‘á» xÃ¡c thá»±c. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ viÃªn. ðŸ”‘';
          this.logger.error('ðŸš¨ Authentication error detected');
        } else if (error.message.includes('timeout')) {
          errorMessage =
            'Xin lá»—i, yÃªu cáº§u cá»§a báº¡n máº¥t quÃ¡ nhiá»u thá»i gian. Vui lÃ²ng thá»­ láº¡i. â±ï¸';
          this.logger.error('ðŸš¨ Timeout error detected');
        } else {
          errorMessage = `Xin lá»—i, Ä‘Ã£ xáº£y ra lá»—i: ${error.message.substring(0, 100)}. Vui lÃ²ng thá»­ láº¡i hoáº·c liÃªn há»‡ há»— trá»£. ðŸ’¬`;
        }

        await this.sendResponse(
          context.channelType,
          context.senderId,
          errorMessage,
        );

        this.logger.log(`ðŸ“¤ Error message sent to user: "${errorMessage}"`);
      } catch (sendError) {
        this.logger.error(`Failed to send error message: ${sendError.message}`);
      }
    }
  }

  /**
   * Gá»­i response qua channel tÆ°Æ¡ng á»©ng
   */
  private async sendResponse(
    channelType: string,
    recipientId: string,
    message: string,
  ): Promise<void> {
    switch (channelType.toLowerCase()) {
      case 'facebook':
      case 'messenger':
        await this.sendFacebookMessage(recipientId, message);
        break;

      case 'instagram':
        await this.sendInstagramMessage(recipientId, message);
        break;

      case 'telegram':
        await this.sendTelegramMessage(recipientId, message);
        break;

      default:
        this.logger.warn(`Unsupported channel type: ${channelType}`);
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
      throw new Error(result.error);
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
      throw new Error(result.error);
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
      throw new Error(result.error);
    }
  }
}
