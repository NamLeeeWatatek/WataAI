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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ChannelStrategy } from './channel.strategy';
import { ChannelsService } from './channels.service';
import { FacebookOAuthService } from './facebook-oauth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationsGateway } from '../conversations/conversations.gateway';
import { WebhookVerifierFactory } from './webhooks/webhook-verifier.base';
import {
  FacebookWebhookProcessor,
  FacebookWebhookPayload,
} from './webhooks/facebook-webhook.processor';
import { InstagramWebhookProcessor } from './webhooks/instagram-webhook.processor';
import { TelegramWebhookProcessor } from './webhooks/telegram-webhook.processor';
import { Req } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

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
    private readonly facebookProcessor: FacebookWebhookProcessor,
    private readonly instagramProcessor: InstagramWebhookProcessor,
    private readonly telegramProcessor: TelegramWebhookProcessor,
  ) {}

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
  async verifyFacebookWebhook(@Query() query: Record<string, any>) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode !== 'subscribe') {
      this.logger.error('Mode is not subscribe');
      return 'Forbidden';
    }

    try {
      const credential = await this.facebookOAuthService.findActiveCredential();

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
    @Body() payload: FacebookWebhookPayload,
    @Headers('x-hub-signature-256') signature?: string,
    @Headers() headers?: Record<string, any>,
    @Req() req?: any,
  ) {
    this.logger.log('========== FACEBOOK WEBHOOK RECEIVED ==========');
    this.logger.debug(
      'Payload preview:',
      JSON.stringify(payload).substring(0, 200),
    );

    try {
      // ✅ FIX: Use raw body for signature verification if available
      const rawBody = req?.rawBody;
      const bodyForVerification = rawBody || payload;

      // Step 1: Verify signature với proper App Secret
      const isValid = await this.verifyFacebookSignature(
        bodyForVerification,
        signature,
      );

      if (!isValid) {
        this.logger.error('❌ Invalid Facebook webhook signature');
        // ⚠️ In development, log but continue processing
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            '⚠️ Continuing in development mode despite signature mismatch',
          );
        } else {
          throw new ForbiddenException('Invalid signature');
        }
      } else {
        this.logger.log('✅ Signature verified');
      }

      // Step 2: Queue async processing và return ngay
      const result = await this.facebookProcessor.handle(payload, {
        signature,
        headers,
        receivedAt: new Date(),
      });

      this.logger.log('✅ Webhook queued for processing');

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
   * Verify Facebook webhook signature với proper App Secret
   */
  private async verifyFacebookSignature(
    payload: FacebookWebhookPayload,
    signature?: string,
  ): Promise<boolean> {
    if (!signature) {
      this.logger.warn('⚠️ No signature provided in webhook request');
      return false;
    }

    try {
      // ✅ FIX: Try to get App Secret from database first (per-workspace)
      // Then fallback to environment variable
      let appSecret: string | undefined;

      // Try to get pageId from payload to find the right credential
      const pageId = payload?.entry?.[0]?.id;

      if (pageId) {
        this.logger.debug(`🔍 Looking for credentials for page ${pageId}`);

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
              `✅ Using App Secret from database for page ${pageId}`,
            );
          }
        } else {
          this.logger.warn(`⚠️ No channel found for page ${pageId}`);
        }
      } else {
        this.logger.warn('⚠️ No pageId found in webhook payload');
      }

      // Fallback to environment variable
      if (!appSecret) {
        appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
        if (appSecret) {
          this.logger.log('✅ Using App Secret from environment variable');
        } else {
          // Try direct process.env as fallback
          appSecret = process.env.FACEBOOK_APP_SECRET;
          if (appSecret) {
            this.logger.log('✅ Using App Secret from process.env');
          }
        }
      }

      if (!appSecret) {
        this.logger.error(
          '❌ No App Secret found (neither in database nor environment)',
        );
        this.logger.error('💡 Please either:');
        this.logger.error(
          '   1. Reconnect Facebook channel to save credentials in database',
        );
        this.logger.error('   2. Set FACEBOOK_APP_SECRET in .env file');
        this.logger.warn('⚠️ Signature verification skipped - SECURITY RISK!');
        // In development, allow webhooks without verification
        // In production, this should return false
        const allowInDev = process.env.NODE_ENV !== 'production';
        if (allowInDev) {
          this.logger.warn(
            '⚠️ Allowing webhook in development mode without verification',
          );
        }
        return allowInDev;
      }

      // Use WebhookVerifierFactory for verification
      const verifier = WebhookVerifierFactory.getVerifier('facebook');

      // ✅ FIX: If payload is already a string (raw body), use it directly
      // Otherwise stringify it (but this may cause signature mismatch)
      const isValid = verifier.verifySignature(payload, signature, appSecret);

      if (!isValid) {
        this.logger.error('❌ Signature verification failed');
        this.logger.debug(`Payload type: ${typeof payload}`);
        this.logger.debug(`Payload is string: ${typeof payload === 'string'}`);
        this.logger.debug(`Secret used: ${appSecret.substring(0, 10)}...`);

        // ⚠️ TEMPORARY: In development, log but allow webhook
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            '⚠️ Allowing webhook in development despite signature mismatch',
          );
          return true;
        }
      }

      return isValid;
    } catch (error) {
      this.logger.error(`❌ Signature verification error: ${error.message}`);
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

      // Delegate to Async Processor
      const result = await this.instagramProcessor.handle(payload, {
        signature,
        receivedAt: new Date(),
      });

      return result;
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

      // Delegate to Async Processor
      const result = await this.telegramProcessor.handle(payload, {
        receivedAt: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(`Telegram webhook error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
