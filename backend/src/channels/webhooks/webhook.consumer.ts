import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { WEBHOOKS_QUEUE } from './webhook-queue.service';
import { FacebookWebhookProcessor } from './facebook-webhook.processor';
import { InstagramWebhookProcessor } from './instagram-webhook.processor';
import { TelegramWebhookProcessor } from './telegram-webhook.processor';

@Processor(WEBHOOKS_QUEUE)
export class WebhookQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(WebhookQueueConsumer.name);

  constructor(
    private readonly facebookProcessor: FacebookWebhookProcessor,
    private readonly instagramProcessor: InstagramWebhookProcessor,
    private readonly telegramProcessor: TelegramWebhookProcessor,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { channelType, payload, metadata } = job.data;
    this.logger.debug(
      `Processing webhook job ${job.id} for channel: ${channelType}`,
    );

    try {
      let result;
      switch (channelType) {
        case 'facebook':
          result = await this.facebookProcessor.processPayload(
            payload,
            metadata,
          );
          break;
        case 'instagram':
          result = await this.instagramProcessor.processPayload(
            payload,
            metadata,
          );
          break;
        case 'telegram':
          result = await this.telegramProcessor.processPayload(
            payload,
            metadata,
          );
          break;
        default:
          this.logger.error(`Unknown channel type: ${channelType}`);
          throw new Error(`Unknown channel type: ${channelType}`);
      }

      if (result && !result.success) {
        this.logger.warn(
          `Webhook processed with errors: ${JSON.stringify(result.errors)}`,
        );
      } else {
        this.logger.debug(`Webhook processed successfully`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process webhook job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error; // Rethrow to trigger BullMQ retry logic
    }
  }
}
