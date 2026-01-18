import { BaseEvent } from './base.event';

/**
 * Event emitted when a new message is received from any channel
 */
export class MessageReceivedEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly messageId: string,
    public readonly content: string,
    public readonly senderId: string,
    public readonly channelType: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'message.received';
  }
}

/**
 * Event emitted when bot should process a message
 */
export class BotMessageProcessingEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly messageContent: string,
    public readonly botId: string,
    public readonly channelType: string,
    public readonly senderId: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'bot.message.processing';
  }
}

/**
 * Event emitted when bot has generated a response
 */
export class BotResponseGeneratedEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly responseContent: string,
    public readonly botId: string,
    public readonly channelType: string,
    public readonly recipientId: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'bot.response.generated';
  }
}

/**
 * Event emitted when a message should be sent to external channel
 */
export class SendChannelMessageEvent extends BaseEvent {
  constructor(
    public readonly channelType: string,
    public readonly recipientId: string,
    public readonly content: string,
    public readonly conversationId?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'channel.message.send';
  }
}

/**
 * Event emitted when a message was successfully sent
 */
export class MessageSentEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly messageId: string,
    public readonly channelType: string,
    public readonly success: boolean,
    public readonly error?: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'message.sent';
  }
}
