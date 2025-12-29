import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const WEBHOOKS_QUEUE = 'webhooks';

@Injectable()
export class WebhookQueueService {
    private readonly logger = new Logger(WebhookQueueService.name);

    constructor(
        @InjectQueue(WEBHOOKS_QUEUE)
        private readonly queue: Queue,
    ) { }

    async queueWebhook(
        channelType: string,
        payload: any,
        metadata?: Record<string, any>,
    ): Promise<void> {
        try {
            await this.queue.add(
                'process-webhook',
                {
                    channelType,
                    payload,
                    metadata,
                },
                {
                    removeOnComplete: true,
                    removeOnFail: 100, // Keep last 100 failed jobs for debugging
                    attempts: 3, // Retry 3 times
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                },
            );
            this.logger.debug(`[${channelType}] Webhook queued in redis`);
        } catch (error) {
            this.logger.error(
                `Failed to queue webhook for ${channelType}:`,
                error.message,
            );
            // Fallback or throw? If redis is down, we probably can't process anyway.
            throw error;
        }
    }
}
