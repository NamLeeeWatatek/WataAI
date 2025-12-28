import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Webhook Processing Result
 */
export interface WebhookProcessingResult {
  success: boolean;
  processedCount?: number;
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * Base Webhook Processor
 *
 * Abstract class for processing webhooks asynchronously.
 * Each channel extends this to implement channel-specific processing logic.
 *
 * Benefits:
 * - Fast response to webhook sender (<200ms)
 * - Async processing prevents timeouts
 * - Error handling and retry logic
 * - Easy to extend for new channels
 */
export abstract class BaseWebhookProcessor<TPayload = any> {
  protected abstract readonly logger: Logger;
  protected abstract readonly channelType: string;

  constructor(protected readonly eventEmitter?: EventEmitter2) {}

  /**
   * Main entry point - validates and queues processing
   *
   * @param payload - Webhook payload
   * @param metadata - Additional metadata (headers, signature, etc.)
   * @returns Immediate response
   */
  async handle(
    payload: TPayload,
    metadata?: Record<string, any>,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `[${this.channelType}] Webhook received, queuing for processing...`,
    );

    // Queue async processing (don't await)
    setImmediate(() => {
      this.processAsync(payload, metadata).catch((error) => {
        this.logger.error(
          `[${this.channelType}] Async processing failed:`,
          error.stack,
        );
        this.handleProcessingError(error, payload, metadata);
      });
    });

    // Return immediately to webhook sender
    return { success: true };
  }

  /**
   * Async processing implementation
   * Override this in channel-specific processors
   */
  protected abstract processAsync(
    payload: TPayload,
    metadata?: Record<string, any>,
  ): Promise<WebhookProcessingResult>;

  /**
   * Validate payload structure
   * Override for channel-specific validation
   */
  protected abstract validatePayload(payload: TPayload): boolean;

  /**
   * Handle processing errors
   * Can be overridden for custom error handling
   */
  protected handleProcessingError(
    error: Error,
    payload: TPayload,
    metadata?: Record<string, any>,
  ): void {
    this.logger.error(`[${this.channelType}] Processing error:`, {
      error: error.message,
      stack: error.stack,
      payload: JSON.stringify(payload).substring(0, 500),
      metadata,
    });

    // Emit error event for monitoring
    if (this.eventEmitter) {
      this.eventEmitter.emit('webhook.processing.error', {
        channelType: this.channelType,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Emit success event
   */
  protected emitSuccess(result: WebhookProcessingResult): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit('webhook.processing.success', {
        channelType: this.channelType,
        result,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log processing metrics
   */
  protected logMetrics(
    startTime: number,
    result: WebhookProcessingResult,
  ): void {
    const duration = Date.now() - startTime;
    this.logger.log(
      `[${this.channelType}] Processing completed in ${duration}ms`,
      {
        duration,
        success: result.success,
        processedCount: result.processedCount,
      },
    );
  }
}

/**
 * Message Processing Context
 *
 * Common context for message processing across all channels
 */
export interface MessageProcessingContext {
  channelId: string;
  channelType: string;
  externalId: string; // Page ID, Chat ID, etc.
  senderId: string;
  recipientId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
}

/**
 * Base Message Processor
 *
 * Specialized processor for handling incoming messages
 */
export abstract class BaseMessageProcessor<
  TPayload = any,
> extends BaseWebhookProcessor<TPayload> {
  /**
   * Extract messages from payload
   * Each channel has different payload structure
   */
  protected abstract extractMessages(payload: TPayload): Array<{
    context: MessageProcessingContext;
    content: string;
    timestamp?: Date;
  }>;

  /**
   * Process a single message
   * Common logic for all channels
   */
  protected abstract processSingleMessage(
    context: MessageProcessingContext,
    content: string,
    timestamp?: Date,
  ): Promise<void>;

  /**
   * Process webhook payload
   */
  protected async processAsync(
    payload: TPayload,
    metadata?: Record<string, any>,
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate payload
      if (!this.validatePayload(payload)) {
        return {
          success: false,
          errors: ['Invalid payload structure'],
        };
      }

      // Extract messages
      const messages = this.extractMessages(payload);

      if (messages.length === 0) {
        this.logger.log(`[${this.channelType}] No messages to process`);
        return { success: true, processedCount: 0 };
      }

      this.logger.log(
        `[${this.channelType}] Processing ${messages.length} message(s)`,
      );

      // Process each message
      const errors: string[] = [];
      let processedCount = 0;

      for (const message of messages) {
        try {
          await this.processSingleMessage(
            message.context,
            message.content,
            message.timestamp,
          );
          processedCount++;
        } catch (error) {
          const errorMsg = `Failed to process message: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg, error.stack);
        }
      }

      const result: WebhookProcessingResult = {
        success: errors.length === 0,
        processedCount,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.logMetrics(startTime, result);
      this.emitSuccess(result);

      return result;
    } catch (error) {
      this.logger.error(
        `[${this.channelType}] Processing failed:`,
        error.stack,
      );
      return {
        success: false,
        errors: [error.message],
      };
    }
  }
}
