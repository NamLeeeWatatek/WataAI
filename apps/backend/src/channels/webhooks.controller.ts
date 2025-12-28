import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  Query,
  Logger,
  Inject,
  forwardRef,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ChannelStrategy } from './channel.strategy';
import { ChannelsService } from './channels.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageReceivedEvent } from '../shared/events';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationsGateway } from '../conversations/conversations.gateway';
import { MessageRole } from '../conversations/conversations.enum';
import { WebhookLoggerInterceptor } from './interceptors/webhook-logger.interceptor';
import { WebhookVerifierFactory } from './webhooks/webhook-verifier.base';
import { FacebookWebhookProcessor } from './webhooks/facebook-webhook.processor';
import { Req } from '@nestjs/common';
import type { Request } from 'express';
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly facebookProcessor: FacebookWebhookProcessor;

  constructor(
    private readonly channelStrategy: ChannelStrategy,
    private readonly channelsService: ChannelsService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
    @Inject(forwardRef(() => ConversationsGateway))
    private readonly conversationsGateway: ConversationsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize Facebook processor
    this.facebookProcessor = new FacebookWebhookProcessor(
      eventEmitter,
      channelsService,
      facebookOAuthService,
      conversationsService,
      conversationsGateway,
    );
  }

  // DEPRECATED: This generic endpoint only parses but doesn't save messages
  // Use specific endpoints like @Post('facebook') instead
  // Keeping for backward compatibility with other channels
  @Post(':channel')
  async handleWebhook(
    @Param('channel') channel: string,
    @Body() payload: any,
    @Headers('x-hub-signature-256') facebookSignature?: string,
    @Headers('x-signature') genericSignature?: string,
  ) {
    // Redirect Facebook webhooks to the proper handler
    if (channel === 'facebook') {
      return this.handleFacebookWebhook(payload, facebookSignature);
    }

    try {
      const signature = facebookSignature || genericSignature || '';

      const isValid = this.channelStrategy.verifyWebhook(
        channel,
        payload,
        signature,
      );

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid webhook signature',
        };
      }

      const message = this.channelStrategy.parseIncomingMessage(
        channel,
        payload,
      );

      return {
        success: true,
        message: 'Webhook received',
        data: message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('facebook')
  @ApiOperation({ summary: 'Verify Facebook webhook' })
  async verifyFacebookWebhook(@Query() query: any, @Req() req: Request) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Validate mode
    if (mode !== 'subscribe') {
      this.logger.error('Mode khÃ´ng pháº£i subscribe');
      return 'Forbidden';
    }

    try {
      const credential = await this.facebookOAuthService[
        'credentialRepository'
      ].findOne({
        where: {
          provider: 'facebook',
          isActive: true,
        },
        order: {
          updatedAt: 'DESC',
        },
      });

      const expectedToken = credential?.metadata?.verifyToken;
      if (token !== expectedToken) {
        return 'Forbidden';
      }

      return challenge;
    } catch (error) {
      return 'Forbidden';
    }
  }
  /**
   * Handle Facebook webhook events
   *
   * New implementation:
   * - Uses WebhookVerifierFactory for signature verification
   * - Uses FacebookWebhookProcessor for async processing
   * - Returns immediately (<200ms) to prevent timeouts
   * - Comprehensive logging via interceptor
   */
  @Post('facebook')
  @ApiOperation({ summary: 'Handle Facebook webhook events' })
  async handleFacebookWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
    @Headers() headers?: any,
    @Req() req?: any,
  ) {
    this.logger.log('========== FACEBOOK WEBHOOK RECEIVED ==========');
    this.logger.debug(
      'Payload preview:',
      JSON.stringify(payload).substring(0, 200),
    );

    try {
      // âœ… FIX: Use raw body for signature verification if available
      const rawBody = req?.rawBody;
      const bodyForVerification = rawBody || payload;

      // Step 1: Verify signature vá»›i proper App Secret
      const isValid = await this.verifyFacebookSignature(
        bodyForVerification,
        signature,
      );

      if (!isValid) {
        this.logger.error('âŒ Invalid Facebook webhook signature');
        // âš ï¸ In development, log but continue processing
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            'âš ï¸ Continuing in development mode despite signature mismatch',
          );
        } else {
          return { success: false, error: 'Invalid signature' };
        }
      } else {
        this.logger.log('âœ… Signature verified');
      }

      // Step 2: Queue async processing vÃ  return ngay
      const result = await this.facebookProcessor.handle(payload, {
        signature,
        headers,
        receivedAt: new Date(),
      });

      this.logger.log('âœ… Webhook queued for processing');

      return result;
    } catch (error) {
      this.logger.error(
        `Facebook webhook error: ${error.message}`,
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify Facebook webhook signature vá»›i proper App Secret
   */
  private async verifyFacebookSignature(
    payload: any,
    signature?: string,
  ): Promise<boolean> {
    if (!signature) {
      this.logger.warn('âš ï¸ No signature provided in webhook request');
      return false;
    }

    try {
      // âœ… FIX: Try to get App Secret from database first (per-workspace)
      // Then fallback to environment variable
      let appSecret: string | undefined;

      // Try to get pageId from payload to find the right credential
      const pageId = payload?.entry?.[0]?.id;

      if (pageId) {
        this.logger.debug(`ðŸ” Looking for credentials for page ${pageId}`);

        // Find channel connection by pageId
        const channels = await this.channelsService.findAll();
        this.logger.debug(`Found ${channels.length} total channels`);

        const facebookChannels = channels.filter((c) => c.type === 'facebook');
        this.logger.debug(`Found ${facebookChannels.length} Facebook channels`);

        const channel = facebookChannels.find(
          (c) => c.metadata?.pageId === pageId,
        );

        if (channel) {
          this.logger.debug(`Found channel: ${channel.name} (${channel.id})`);
          this.logger.debug(`Has credential: ${!!channel.credential}`);
          this.logger.debug(
            `Has clientSecret: ${!!channel.credential?.clientSecret}`,
          );

          if (channel.credential?.clientSecret) {
            appSecret = channel.credential.clientSecret;
            this.logger.log(
              `âœ… Using App Secret from database for page ${pageId}`,
            );
          }
        } else {
          this.logger.warn(`âš ï¸ No channel found for page ${pageId}`);
        }
      } else {
        this.logger.warn('âš ï¸ No pageId found in webhook payload');
      }

      // Fallback to environment variable
      if (!appSecret) {
        appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
        if (appSecret) {
          this.logger.log('âœ… Using App Secret from environment variable');
        } else {
          // Try direct process.env as fallback
          appSecret = process.env.FACEBOOK_APP_SECRET;
          if (appSecret) {
            this.logger.log('âœ… Using App Secret from process.env');
          }
        }
      }

      if (!appSecret) {
        this.logger.error(
          'âŒ No App Secret found (neither in database nor environment)',
        );
        this.logger.error('ðŸ’¡ Please either:');
        this.logger.error(
          '   1. Reconnect Facebook channel to save credentials in database',
        );
        this.logger.error('   2. Set FACEBOOK_APP_SECRET in .env file');
        this.logger.warn(
          'âš ï¸ Signature verification skipped - SECURITY RISK!',
        );
        // In development, allow webhooks without verification
        // In production, this should return false
        const allowInDev = process.env.NODE_ENV !== 'production';
        if (allowInDev) {
          this.logger.warn(
            'âš ï¸ Allowing webhook in development mode without verification',
          );
        }
        return allowInDev;
      }

      // Use WebhookVerifierFactory for verification
      const verifier = WebhookVerifierFactory.getVerifier('facebook');

      // âœ… FIX: If payload is already a string (raw body), use it directly
      // Otherwise stringify it (but this may cause signature mismatch)
      const isValid = verifier.verifySignature(payload, signature, appSecret);

      if (!isValid) {
        this.logger.error('âŒ Signature verification failed');
        this.logger.debug(`Payload type: ${typeof payload}`);
        this.logger.debug(`Payload is string: ${typeof payload === 'string'}`);
        this.logger.debug(`Secret used: ${appSecret.substring(0, 10)}...`);

        // âš ï¸ TEMPORARY: In development, log but allow webhook
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            'âš ï¸ Allowing webhook in development despite signature mismatch',
          );
          return true;
        }
      }

      return isValid;
    } catch (error) {
      this.logger.error(`âŒ Signature verification error: ${error.message}`);
      return false;
    }
  }

  @Post('instagram')
  @ApiOperation({ summary: 'Handle Instagram webhook events' })
  async handleInstagramWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    try {
      this.logger.log('Received Instagram webhook');

      const isValid = this.channelStrategy.verifyWebhook(
        'instagram',
        payload,
        signature || '',
      );
      if (!isValid) {
        this.logger.error('Invalid Instagram webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      if (payload.object === 'instagram') {
        for (const entry of payload.entry || []) {
          for (const messaging of entry.messaging || []) {
            await this.processInstagramMessage(messaging, entry.id);
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Instagram webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Post('telegram')
  @ApiOperation({ summary: 'Handle Telegram webhook events' })
  async handleTelegramWebhook(@Body() payload: any) {
    try {
      this.logger.log('Received Telegram webhook');

      if (payload.message) {
        await this.processTelegramMessage(payload.message);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Telegram webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async processFacebookMessage(messaging: any, pageId: string) {
    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id;
    const message = messaging.message;

    if (!message) return;

    this.logger.log(
      `Processing Facebook message from ${senderId} to page ${pageId}`,
    );

    try {
      const channel = await this.channelsService.findByExternalId(pageId);

      if (!channel) {
        this.logger.warn(`No channel found for Facebook page ${pageId}`);
        return;
      }

      this.logger.log(`ðŸ“± Channel found: ${channel.name} (${channel.id})`);
      this.logger.log(
        `ðŸ“± Channel metadata:`,
        JSON.stringify(channel.metadata),
      );

      const botId = channel.metadata?.botId as string | undefined;

      if (!botId) {
        this.logger.error(
          `âŒ No botId in channel metadata! Channel ${channel.id} needs to be linked to a bot.`,
        );
        return;
      }

      this.logger.log(`ðŸ¤– Bot ID from channel: ${botId}`);

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
          channelType: 'facebook',
          externalId: senderId,
          contactName,
          contactAvatar,
          metadata: {
            pageId,
            recipientId,
          },
        });

      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      if (message.text) {
        const savedMessage =
          await this.conversationsService.addMessageFromWebhook({
            conversationId: conversation.id,
            content: message.text,
            role: MessageRole.USER,
            metadata: {
              externalId: message.mid,
              senderId,
              pageId,
              recipientId,
              channelType: 'facebook',
            },
          });

        try {
          this.conversationsGateway.emitNewMessage(
            conversation.id,
            savedMessage,
          );
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            message.text,
            senderId,
            'facebook',
            {
              pageId,
              recipientId,
              messageId: message.mid,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Facebook message: ${error.message}`);
    }
  }

  private async processInstagramMessage(messaging: any, igId: string) {
    const senderId = messaging.sender.id;
    const message = messaging.message;

    if (!message) return;

    this.logger.log(`Processing Instagram message from ${senderId}`);

    try {
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
          channelType: 'instagram',
          externalId: senderId,
          contactName: 'Instagram User',
          metadata: {
            igId,
            messageId: message.mid,
          },
        });

      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      if (message.text) {
        const savedMessage =
          await this.conversationsService.addMessageFromWebhook({
            conversationId: conversation.id,
            content: message.text,
            role: MessageRole.USER,
            metadata: {
              externalId: message.mid,
              senderId,
              igId,
              channelType: 'instagram',
            },
          });

        try {
          this.conversationsGateway.emitNewMessage(
            conversation.id,
            savedMessage,
          );
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            message.text,
            senderId,
            'instagram',
            {
              igId,
              messageId: message.mid,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Instagram message: ${error.message}`);
    }
  }

  private async processTelegramMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    this.logger.log(`Processing Telegram message from ${chatId}`);

    try {
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

      const contactName =
        message.from.first_name || message.from.username || 'Telegram User';

      const conversation =
        await this.conversationsService.findOrCreateFromWebhook({
          botId,
          channelId: channel.id,
          channelType: 'telegram',
          externalId: chatId.toString(),
          contactName,
          metadata: {
            chatId,
            userId: message.from.id,
            messageId: message.message_id,
          },
        });

      try {
        this.conversationsGateway.broadcastConversationUpdate(conversation);
      } catch (error) {
        this.logger.warn('Failed to emit WebSocket event:', error);
      }

      if (text) {
        const savedMessage =
          await this.conversationsService.addMessageFromWebhook({
            conversationId: conversation.id,
            content: text,
            role: MessageRole.USER,
            metadata: {
              userId: message.from.id,
              messageId: message.message_id,
              chatId,
              channelType: 'telegram',
            },
          });

        try {
          this.conversationsGateway.emitNewMessage(
            conversation.id,
            savedMessage,
          );
        } catch (error) {
          this.logger.warn('Failed to emit message WebSocket event:', error);
        }

        this.eventEmitter.emit(
          'message.received',
          new MessageReceivedEvent(
            conversation.id,
            savedMessage.id,
            text,
            chatId.toString(),
            'telegram',
            {
              userId: message.from.id,
              messageId: message.message_id,
              channelId: channel.id,
              botId,
            },
          ),
        );
      }
    } catch (error) {
      this.logger.error(`Error processing Telegram message: ${error.message}`);
    }
  }
}
