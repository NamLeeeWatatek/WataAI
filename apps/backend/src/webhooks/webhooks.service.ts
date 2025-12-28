import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WebhookEventEntity } from './infrastructure/persistence/relational/entities/webhook.entity';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookEventEntity)
    private webhookEventRepo: Repository<WebhookEventEntity>,
  ) {}

  async createEvent(channelId: string, rawPayload: Record<string, any>) {
    const event = this.webhookEventRepo.create({
      channelId,
      rawPayload,
      status: 'pending',
    });
    return this.webhookEventRepo.save(event);
  }

  async getEvent(id: string) {
    const event = await this.webhookEventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Webhook event not found');
    }
    return event;
  }

  async getEvents(options: {
    channelId?: string;
    status?: string;
    limit?: number;
    page?: number;
  }) {
    const query = this.webhookEventRepo.createQueryBuilder('event');

    if (options.channelId) {
      query.andWhere('event.channelId = :channelId', {
        channelId: options.channelId,
      });
    }

    if (options.status) {
      query.andWhere('event.status = :status', { status: options.status });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 50, 100);

    query
      .orderBy('event.receivedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingEvents(limit: number = 100) {
    return this.webhookEventRepo.find({
      where: { status: 'pending' },
      order: { receivedAt: 'ASC' },
      take: limit,
    });
  }

  async markAsProcessing(id: string) {
    await this.webhookEventRepo.update(id, { status: 'processing' });
    return this.getEvent(id);
  }

  async markAsCompleted(id: string) {
    await this.webhookEventRepo.update(id, {
      status: 'completed',
      processedAt: new Date(),
    });
    return this.getEvent(id);
  }

  async markAsFailed(id: string, errorMessage: string) {
    await this.webhookEventRepo.update(id, {
      status: 'failed',
      errorMessage,
      processedAt: new Date(),
    });
    return this.getEvent(id);
  }

  async retryFailed(id: string) {
    await this.webhookEventRepo.update(id, {
      status: 'pending',
      errorMessage: null,
      processedAt: null,
    });
    return this.getEvent(id);
  }

  async cleanupOldEvents(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.webhookEventRepo.delete({
      receivedAt: LessThan(cutoffDate),
      status: 'completed',
    });

    return { deleted: result.affected ?? 0 };
  }

  async getStats(channelId?: string) {
    const query = this.webhookEventRepo
      .createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (channelId) {
      query.where('event.channelId = :channelId', { channelId });
    }

    const result = await query.groupBy('event.status').getRawMany();

    return result.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
