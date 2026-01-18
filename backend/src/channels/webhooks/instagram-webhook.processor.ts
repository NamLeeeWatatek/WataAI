import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BaseMessageProcessor,
  MessageProcessingContext,
} from './webhook-processor.base';
import { WebhookQueueService } from './webhook-queue.service';
import { ChannelsService } from '../channels.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/conversations.gateway';
import { MessageRole } from '../../conversations/conversations.enum';
import { MessageReceivedEvent } from '../../shared/events';

interface InstagramWebhookPayload {
  object: string;
  entry: Array<{
    id: string; // Account ID
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
      };
    }>;
  }>;
}

@Injectable()
export class InstagramWebhookProcessor extends BaseMessageProcessor<InstagramWebhookPayload> {
  protected readonly logger = new Logger(InstagramWebhookProcessor.name);
  protected readonly channelType = 'instagram';

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

  protected validatePayload(payload: InstagramWebhookPayload): boolean {
    return !!(
      payload &&
      payload.object === 'instagram' &&
      Array.isArray(payload.entry)
    );
  }

  protected extractMessages(payload: InstagramWebhookPayload) {
    const messages: Array<{
      context: MessageProcessingContext;
      content: string;
      timestamp?: Date;
    }> = [];

    for (const entry of payload.entry || []) {
      const igId = entry.id;

      for (const messaging of entry.messaging || []) {
        const message = messaging.message;

        if (message?.text) {
          messages.push({
            context: {
              channelId: '', // Resolved later
              channelType: this.channelType,
              externalId: igId,
              senderId: messaging.sender.id,
              recipientId: messaging.recipient.id,
              messageId: message.mid,
              metadata: {
                igId,
                messageId: message.mid,
              },
            },
            content: message.text,
            timestamp: new Date(messaging.timestamp),
          });
        }
      }
    }

    return messages;
  }

  protected async processSingleMessage(
    context: MessageProcessingContext,
    content: string,
    timestamp?: Date,
  ): Promise<void> {
    const { externalId, senderId, messageId } = context;
    const igId = externalId;

    this.logger.log(`Processing Instagram message from ${senderId}`);

    const channel = await this.channelsService.findByExternalId(igId);

    if (!channel) {
      this.logger.warn(`No channel found for Instagram account ${igId}`);
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
        externalId: senderId,
        contactName: 'Instagram User',
        metadata: {
          igId,
          messageId,
        },
      });

    // Save message
    const savedMessage = await this.conversationsService.addMessageFromWebhook({
      conversationId: conversation.id,
      content,
      role: MessageRole.USER,
      metadata: {
        externalId: messageId,
        senderId,
        igId,
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
          senderId,
          this.channelType,
          {
            igId,
            messageId,
            channelId: channel.id,
            botId,
          },
        ),
      );
    }
  }
}
