import { BaseEvent } from './base.event';

/**
 * Event emitted when a flow execution should start
 */
export class FlowExecutionRequestedEvent extends BaseEvent {
  constructor(
    public readonly flowId: string,
    public readonly botId: string,
    public readonly conversationId: string,
    public readonly input: Record<string, any>,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'flow.execution.requested';
  }
}

/**
 * Event emitted when a flow execution completes
 */
export class FlowExecutionCompletedEvent extends BaseEvent {
  constructor(
    public readonly flowId: string,
    public readonly executionId: string,
    public readonly output: Record<string, any>,
    public readonly success: boolean,
    public readonly error?: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'flow.execution.completed';
  }
}

/**
 * Event emitted when a flow execution fails
 */
export class FlowExecutionFailedEvent extends BaseEvent {
  constructor(
    public readonly flowId: string,
    public readonly executionId: string,
    public readonly error: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super();
  }

  get eventName(): string {
    return 'flow.execution.failed';
  }
}
