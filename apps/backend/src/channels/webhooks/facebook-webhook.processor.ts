import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BaseMessageProcessor,
  MessageProcessingContext,
  WebhookProcessingResult,
} from './webhook-processor.base';
import { WebhookQueueService } from './webhook-queue.service';
import { ChannelsService } from '../channels.service';
import { FacebookOAuthService } from '../facebook-oauth.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/conversations.gateway';
import { MessageRole } from '../../conversations/conversations.enum';
import { MessageReceivedEvent } from '../../shared/events';

export interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string; // Page ID
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: any[];
      };
      postback?: {
        title: string;
        payload: string;
      };
      read?: {
        watermark: number;
        seq?: number;
      };
      delivery?: {
        mids?: string[];
        watermark: number;
        seq?: number;
      };
    }>;
  }>;
}

@Injectable()
export class FacebookWebhookProcessor extends BaseMessageProcessor<FacebookWebhookPayload> {
  protected readonly logger = new Logger(FacebookWebhookProcessor.name);
  protected readonly channelType = 'facebook';

  constructor(
    eventEmitter: EventEmitter2,
    queueService: WebhookQueueService,
    private readonly channelsService: ChannelsService,
    private readonly facebookOAuthService: FacebookOAuthService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,
  ) {
    super(eventEmitter, queueService);
  }

  protected validatePayload(payload: FacebookWebhookPayload): boolean {
    return !!(
      payload &&
      payload.object === 'page' &&
      Array.isArray(payload.entry)
    );
  }

  protected extractMessages(payload: FacebookWebhookPayload) {
    const messages: Array<{
      context: MessageProcessingContext;
      content: string;
      timestamp?: Date;
    }> = [];

    for (const entry of payload.entry || []) {
      const pageId = entry.id;

      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender?.id;
        const recipientId = messaging.recipient?.id;
        const message = messaging.message;

        this.logger.debug(`[extractMessages] Event type check:`, {
          hasMessage: !!message,
          hasText: !!message?.text,
          hasPostback: !!messaging.postback,
          hasRead: !!messaging.read,
          hasDelivery: !!messaging.delivery,
          senderId,
          recipientId,
        });

        if (messaging.read || messaging.delivery) {
          continue;
        }

        if (message?.text) {
          messages.push({
            context: {
              channelId: '',
              channelType: this.channelType,
              externalId: pageId,
              senderId,
              recipientId,
              messageId: message.mid,
              metadata: {
                pageId,
                timestamp: messaging.timestamp,
              },
            },
            content: message.text,
            timestamp: new Date(messaging.timestamp),
          });
        }

        if (messaging.postback) {
          messages.push({
            context: {
              channelId: '',
              channelType: this.channelType,
              externalId: pageId,
              senderId,
              recipientId,
              metadata: {
                pageId,
                postback: messaging.postback,
              },
            },
            content: messaging.postback.payload,
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
    const { externalId, senderId, recipientId, messageId } = context;
    const pageId = externalId;

    this.logger.log(
      `Processing Facebook message from ${senderId} to page ${pageId}`,
    );

    const channel = await this.channelsService.findByExternalId(pageId);

    if (!channel) {
      this.logger.warn(` No channel found for Facebook page ${pageId}`);
      throw new Error(`No channel found for pageId: ${pageId}`);
    }

    const botId = channel.metadata?.botId as string | undefined;

    if (!botId) {
      throw new Error(`No botId configured for channel: ${channel.id}`);
    }

    let contactName = 'Facebook User';
    let contactAvatar: string | undefined;

    if (channel.accessToken) {
      try {
        const userInfo = await this.facebookOAuthService.getUserInfo(
          senderId,
          channel.accessToken,
        );
        contactName = userInfo.name || contactName;
        contactAvatar = userInfo.profile_pic;
      } catch (error) {
        this.logger.warn(
          `Failed to get user info for ${senderId}: ${error.message}`,
        );
      }
    }

    const conversation =
      await this.conversationsService.findOrCreateFromWebhook({
        botId,
        channelId: channel.id,
        channelType: this.channelType,
        externalId: senderId,
        contactName,
        contactAvatar,
        metadata: {
          pageId,
          recipientId,
        },
      });

    const savedMessage = await this.conversationsService.addMessageFromWebhook({
      conversationId: conversation.id,
      content,
      role: MessageRole.USER,
      metadata: {
        externalId: messageId,
        senderId,
        pageId,
        recipientId,
        channelType: this.channelType,
        timestamp,
      },
    });

    try {
      this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
    } catch (error) {
      this.logger.warn('Failed to emit message WebSocket event:', error);
    }

    try {
      this.conversationsGateway.broadcastConversationUpdate({
        ...conversation,
        lastMessage: content,
        lastMessageAt: new Date(),
        contactName,
        contactAvatar,
      });
    } catch (error) {
      this.logger.warn('Failed to broadcast conversation update:', error);
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
            pageId,
            recipientId,
            messageId,
            channelId: channel.id,
            botId,
          },
        ),
      );
    }
  }

  protected handleProcessingError(
    error: Error,
    payload: FacebookWebhookPayload,
    metadata?: Record<string, any>,
  ): void {
    super.handleProcessingError(error, payload, metadata);
    const pageIds = payload.entry?.map((e) => e.id).join(', ');
    this.logger.error(
      `Failed to process Facebook webhook for pages: ${pageIds}`,
    );
  }
}
