import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BotResponseGeneratedEvent,
  SendChannelMessageEvent,
  MessageReceivedEvent,
} from '../../shared/events';
import {
  ConversationEntity,
  MessageEntity,
} from '../infrastructure/persistence/relational/entities/conversation.entity';
import { ConversationStatus, MessageRole } from '../conversations.enum';

@Injectable()
export class ConversationEventListener {
  private readonly logger = new Logger(ConversationEventListener.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('bot.response.generated')
  async handleBotResponseGenerated(event: BotResponseGeneratedEvent) {
    this.logger.debug(
      `Bot response generated for conversation ${event.conversationId}`,
    );

    try {
      const message = this.messageRepository.create({
        conversationId: event.conversationId,
        role: MessageRole.ASSISTANT,
        content: event.responseContent,
        metadata: event.metadata || {},
      });

      await this.messageRepository.save(message);

      await this.conversationRepository.update(event.conversationId, {
        lastMessageAt: new Date(),
      });

      const sendEvent = new SendChannelMessageEvent(
        event.channelType,
        event.recipientId,
        event.responseContent,
        event.conversationId,
        event.metadata,
      );

      this.eventEmitter.emit('channel.message.send', sendEvent);

      this.logger.log(
        `Saved bot response and queued for sending: ${message.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling bot response: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('message.sent')
  async handleMessageSent(event: any) {
    this.logger.debug(
      `Message sent event: ${event.messageId} - Success: ${event.success}`,
    );

    if (!event.success) {
      this.logger.error(`Message sending failed: ${event.error}`);
    }
  }

  @OnEvent('message.received')
  async handleMessageReceived(event: MessageReceivedEvent) {
    this.logger.debug(
      `Message received in conversation ${event.conversationId}`,
    );

    try {
      await this.conversationRepository.update(event.conversationId, {
        lastMessageAt: new Date(),
        status: ConversationStatus.ACTIVE,
      });
    } catch (error) {
      this.logger.error(
        `Error updating conversation on message received: ${error.message}`,
        error.stack,
      );
    }
  }
}
