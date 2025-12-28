import { BaseEvent } from './base.event';

/**
 * Event emitted when a new conversation is created
 */
export class ConversationCreatedEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly botId: string,
    public readonly channelType: string,
    public readonly externalId?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'conversation.created';
  }
}

/**
 * Event emitted when a conversation status changes
 */
export class ConversationStatusChangedEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'conversation.status.changed';
  }
}

/**
 * Event emitted when a conversation is closed
 */
export class ConversationClosedEvent extends BaseEvent {
  constructor(
    public readonly conversationId: string,
    public readonly reason?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'conversation.closed';
  }
}
