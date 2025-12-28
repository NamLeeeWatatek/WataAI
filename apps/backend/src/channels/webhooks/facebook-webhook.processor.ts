import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BaseMessageProcessor,
  MessageProcessingContext,
  WebhookProcessingResult,
} from './webhook-processor.base';
import { ChannelsService } from '../channels.service';
import { FacebookOAuthService } from '../facebook-oauth.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { ConversationsGateway } from '../../conversations/conversations.gateway';
import { MessageRole } from '../../conversations/conversations.enum';
import { MessageReceivedEvent } from '../../shared/events';

/**
 * Facebook Webhook Payload Structure
 */
interface FacebookWebhookPayload {
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
      // âœ… Add read and delivery events
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

/**
 * Facebook Webhook Processor
 *
 * Handles incoming webhooks from Facebook Messenger
 * Extends BaseMessageProcessor for scalability and consistency
 */
@Injectable()
export class FacebookWebhookProcessor extends BaseMessageProcessor<FacebookWebhookPayload> {
  protected readonly logger = new Logger(FacebookWebhookProcessor.name);
  protected readonly channelType = 'facebook';

  constructor(
    eventEmitter: EventEmitter2,
    private readonly channelsService: ChannelsService,
    private readonly facebookOAuthService: FacebookOAuthService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,
  ) {
    super(eventEmitter);
  }

  /**
   * Validate Facebook webhook payload structure
   */
  protected validatePayload(payload: FacebookWebhookPayload): boolean {
    return !!(
      payload &&
      payload.object === 'page' &&
      Array.isArray(payload.entry)
    );
  }

  /**
   * Extract messages from Facebook webhook payload
   */
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

        // ðŸ” DEBUG: Log what we received
        this.logger.debug(`[extractMessages] Event type check:`, {
          hasMessage: !!message,
          hasText: !!message?.text,
          hasPostback: !!messaging.postback,
          hasRead: !!messaging.read,
          hasDelivery: !!messaging.delivery,
          senderId,
          recipientId,
        });

        // Skip read receipts and delivery confirmations
        if (messaging.read || messaging.delivery) {
          this.logger.debug(`[extractMessages] Skipping read/delivery event`);
          continue;
        }

        // Only process text messages for now
        if (message?.text) {
          this.logger.log(
            `[extractMessages] âœ… Found text message: "${message.text}"`,
          );
          messages.push({
            context: {
              channelId: '', // Will be resolved in processSingleMessage
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

        // Handle postbacks
        if (messaging.postback) {
          this.logger.log(
            `[extractMessages] âœ… Found postback: "${messaging.postback.payload}"`,
          );
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

    this.logger.log(
      `[extractMessages] Total messages extracted: ${messages.length}`,
    );
    return messages;
  }

  /**
   * Process a single Facebook message
   */
  protected async processSingleMessage(
    context: MessageProcessingContext,
    content: string,
    timestamp?: Date,
  ): Promise<void> {
    const { externalId, senderId, recipientId, messageId, metadata } = context;
    const pageId = externalId;

    this.logger.log(
      `Processing Facebook message from ${senderId} to page ${pageId}`,
    );

    // Find channel by pageId
    const channel = await this.channelsService.findByExternalId(pageId);

    if (!channel) {
      this.logger.warn(`âŒ No channel found for Facebook page ${pageId}`);

      // List all Facebook channels for debugging
      const allChannels = await this.channelsService.findAll();
      const fbChannels = allChannels.filter((c) => c.type === 'facebook');
      this.logger.warn(
        `Currently connected Facebook channels: ${fbChannels.length}`,
      );
      fbChannels.forEach((ch) => {
        this.logger.warn(`  - ${ch.name} (pageId: ${ch.metadata?.pageId})`);
      });

      throw new Error(`No channel found for pageId: ${pageId}`);
    }

    this.logger.log(`âœ… Channel found: ${channel.name} (ID: ${channel.id})`);

    // Get botId from channel metadata
    const botId = channel.metadata?.botId as string | undefined;

    if (!botId) {
      this.logger.warn(`âŒ No botId found for channel ${channel.id}`);
      this.logger.warn(`Channel metadata: ${JSON.stringify(channel.metadata)}`);
      throw new Error(`No botId configured for channel: ${channel.id}`);
    }

    this.logger.log(`âœ… Bot ID: ${botId}`);

    // Get user info from Facebook
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

    // Find or create conversation
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

    this.logger.log(`âœ… Conversation: ${conversation.id}`);

    // Save message to database FIRST
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

    this.logger.log(`âœ… Message saved: ${savedMessage.id}`);

    // Emit message via WebSocket
    try {
      this.conversationsGateway.emitNewMessage(conversation.id, savedMessage);
    } catch (error) {
      this.logger.warn('Failed to emit message WebSocket event:', error);
    }

    // âœ… Broadcast conversation update AFTER message is saved (for conversations list)
    try {
      this.conversationsGateway.broadcastConversationUpdate({
        ...conversation,
        lastMessage: content, // âœ… Include the actual message content
        lastMessageAt: new Date(),
        contactName,
        contactAvatar,
      });
    } catch (error) {
      this.logger.warn('Failed to broadcast conversation update:', error);
    }

    // Emit message.received event for bot processing
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

    this.logger.log(`âœ… Events emitted for message ${savedMessage.id}`);
  }

  /**
   * Override to add Facebook-specific error handling
   */
  protected handleProcessingError(
    error: Error,
    payload: FacebookWebhookPayload,
    metadata?: Record<string, any>,
  ): void {
    super.handleProcessingError(error, payload, metadata);

    // Additional Facebook-specific logging
    const pageIds = payload.entry?.map((e) => e.id).join(', ');
    this.logger.error(
      `Failed to process Facebook webhook for pages: ${pageIds}`,
    );
  }
}
