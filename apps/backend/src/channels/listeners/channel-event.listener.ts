import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendChannelMessageEvent, MessageSentEvent } from '../../shared/events';
import { ChannelStrategy } from '../channel.strategy';
import { ChannelsService } from '../channels.service';

@Injectable()
export class ChannelEventListener {
  private readonly logger = new Logger(ChannelEventListener.name);

  constructor(
    private readonly channelStrategy: ChannelStrategy,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,
  ) {}

  @OnEvent('channel.message.send')
  async handleSendChannelMessage(event: SendChannelMessageEvent) {
    this.logger.debug(
      `Sending message to ${event.channelType} channel for recipient ${event.recipientId}`,
    );

    try {
      // âœ… Get channel info to set credentials
      const channelId = event.metadata?.channelId;
      if (!channelId) {
        throw new Error('No channelId in event metadata');
      }

      const channel = await this.channelsService.findOne(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      this.logger.debug(`Found channel: ${channel.name} (${channel.type})`);

      // âœ… Get provider and set credentials BEFORE sending
      const provider = this.channelStrategy.getProvider(event.channelType);
      if (!provider) {
        throw new Error(`No provider found for ${event.channelType}`);
      }

      // Set credentials if provider supports it (Facebook, Instagram, etc.)
      if ('setCredentials' in provider && channel.accessToken) {
        (provider as any).setCredentials(
          channel.accessToken,
          channel.credential?.clientSecret || '',
        );
        this.logger.debug('âœ… Credentials set for provider');
      }

      // âœ… NOW send message with configured provider
      const result = await this.channelStrategy.sendMessage(event.channelType, {
        to: event.recipientId,
        content: event.content,
      });

      const sentEvent = new MessageSentEvent(
        event.conversationId || '',
        result.messageId || '',
        event.channelType,
        result.success,
        result.error,
      );

      this.eventEmitter.emit('message.sent', sentEvent);

      if (result.success) {
        this.logger.log(
          `âœ… Message sent successfully to ${event.channelType}: ${result.messageId}`,
        );
      } else {
        this.logger.error(
          `âŒ Failed to send message to ${event.channelType}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending channel message: ${error.message}`,
        error.stack,
      );

      const sentEvent = new MessageSentEvent(
        event.conversationId || '',
        '',
        event.channelType,
        false,
        error.message,
      );

      this.eventEmitter.emit('message.sent', sentEvent);
    }
  }
}
