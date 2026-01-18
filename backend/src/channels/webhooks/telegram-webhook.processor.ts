import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BaseMessageProcessor,
  MessageProcessingContext,
} from './webhook-processor.base';
import { ChannelsService } from '../channels.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/conversations.gateway';
import { MessageRole } from '../../conversations/conversations.enum';
import { MessageReceivedEvent } from '../../shared/events';
import { WebhookQueueService } from './webhook-queue.service';

interface TelegramWebhookPayload {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

@Injectable()
export class TelegramWebhookProcessor extends BaseMessageProcessor<TelegramWebhookPayload> {
  protected readonly logger = new Logger(TelegramWebhookProcessor.name);
  protected readonly channelType = 'telegram';

  constructor(
    eventEmitter: EventEmitter2,
    queueService: WebhookQueueService,
    private readonly channelsService: ChannelsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,
  ) {
    super(eventEmitter, queueService);
  }

  protected validatePayload(payload: TelegramWebhookPayload): boolean {
    return !!(payload && payload.update_id);
  }

  protected extractMessages(payload: TelegramWebhookPayload) {
    const messages: Array<{
      context: MessageProcessingContext;
      content: string;
      timestamp?: Date;
    }> = [];

    const message = payload.message;
    if (message?.text) {
      const chatId = message.chat.id;
      const contactName =
        message.from.first_name || message.from.username || 'Telegram User';

      messages.push({
        context: {
          channelId: '', // Resolved later
          channelType: this.channelType,
          externalId: chatId.toString(),
          senderId: message.from.id.toString(),
          messageId: message.message_id.toString(),
          metadata: {
            chatId,
            userId: message.from.id,
            messageId: message.message_id,
            contactName,
          },
        },
        content: message.text,
        timestamp: new Date(message.date * 1000),
      });
    }

    return messages;
  }

  protected async processSingleMessage(
    context: MessageProcessingContext,
    content: string,
    timestamp?: Date,
  ): Promise<void> {
    const { externalId, senderId, metadata } = context;
    const chatId = externalId;

    this.logger.log(`Processing Telegram message from ${chatId}`);

    // Telegram usually has only one "Setup" channel in DB that handles all bots,
    // OR one channel per bot token. Assuming 'telegram' type lookup for now as per original code.
    const channel = await this.channelsService.findByType('telegram');

    if (!channel) {
      this.logger.warn('No Telegram channel found');
      return;
    }

    const botId = channel.metadata?.botId as string | undefined;

    if (!botId) {
      this.logger.warn(`No botId found for channel ${channel.id}`);
      return;
    }

    const conversation =
      await this.conversationsService.findOrCreateFromWebhook({
        botId,
        channelId: channel.id,
        channelType: this.channelType,
        externalId: chatId,
        contactName: metadata?.contactName || 'Telegram User',
        metadata: {
          chatId: metadata?.chatId,
          userId: metadata?.userId,
          messageId: metadata?.messageId,
        },
      });

    // Save message
    const savedMessage = await this.conversationsService.addMessageFromWebhook({
      conversationId: conversation.id,
      content,
      role: MessageRole.USER,
      metadata: {
        userId: metadata?.userId,
        messageId: metadata?.messageId,
        chatId: metadata?.chatId,
        channelType: this.channelType,
        timestamp,
      },
    });

    // Emit events
    try {
      this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
      this.conversationsGateway.broadcastConversationUpdate({
        ...conversation,
        lastMessage: content,
        lastMessageAt: new Date(),
      });
    } catch (error) {
      this.logger.warn('Failed to emit WebSocket event:', error);
    }

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'message.received',
        new MessageReceivedEvent(
          conversation.id,
          savedMessage.id,
          content,
          chatId,
          this.channelType,
          {
            userId: metadata?.userId,
            messageId: metadata?.messageId,
            channelId: channel.id,
            botId,
          },
        ),
      );
    }
  }
}
