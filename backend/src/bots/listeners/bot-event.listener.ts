import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessageReceivedEvent,
  BotMessageProcessingEvent,
} from '../../shared/events';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../../conversations/infrastructure/persistence/relational/entities/conversation.entity';

@Injectable()
export class BotEventListener {
  private readonly logger = new Logger(BotEventListener.name);

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('message.received')
  async handleMessageReceived(event: MessageReceivedEvent) {
    this.logger.debug(
      `Message received event: ${event.conversationId} from ${event.channelType}`,
    );

    try {
      // 1. Get conversation to check human takeover status
      const conversation = await this.conversationRepository.findOne({
        where: { id: event.conversationId },
      });

      if (!conversation) {
        this.logger.warn(`Conversation not found: ${event.conversationId}`);
        return;
      }

      // 2. Check if human has taken over (agent is actively responding)
      const humanTakeover = conversation.metadata?.humanTakeover === true;
      if (humanTakeover) {
        this.logger.log(
          `ðŸ‘¤ Human agent is handling conversation ${event.conversationId} - Bot will not respond`,
        );
        return;
      }

      // 3. Get bot assigned to this channel (from event metadata)
      const botId = event.metadata?.botId;
      if (!botId) {
        this.logger.warn(
          `No bot assigned to channel for conversation ${event.conversationId}`,
        );
        return;
      }

      const bot = await this.botRepository.findOne({
        where: { id: botId, isActive: true },
      });

      if (!bot) {
        this.logger.warn(`Bot ${botId} not found or inactive`);
        return;
      }

      this.logger.log(
        `ðŸ¤– Bot ${bot.name} (${bot.id}) will process message from conversation ${event.conversationId}`,
      );

      // 4. Emit bot.message.processing event for BotExecutionEventService
      const processingEvent = new BotMessageProcessingEvent(
        event.conversationId,
        event.content, // âœ… Fix: use content, not messageContent
        bot.id,
        event.channelType,
        event.senderId,
        event.metadata,
      );

      this.eventEmitter.emit('bot.message.processing', processingEvent);

      this.logger.debug(`âœ… Emitted bot.message.processing for bot ${bot.id}`);
    } catch (error) {
      this.logger.error(
        `Error handling message received event: ${error.message}`,
        error.stack,
      );
    }
  }
}
