import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationEntity } from './infrastructure/persistence/relational/entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepo: Repository<NotificationEntity>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: {
    userId: string;
    workspaceId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }) {
    const notification = this.notificationRepo.create({
      ...data,
      type: data.type ?? 'info',
      isRead: false,
    });
    const savedNotification = await this.notificationRepo.save(notification);

    // Emit real-time notification to connected clients
    try {
      this.notificationsGateway.emitNewNotification(savedNotification);
      this.notificationsGateway.broadcastUnreadCountUpdate(data.userId);
    } catch (error) {
      // Log error but don't fail the notification creation
      console.error('Failed to emit real-time notification:', error.message);
    }

    return savedNotification;
  }

  async getNotifications(
    userId: string,
    options?: {
      workspaceId?: string;
      isRead?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (options?.workspaceId) {
      query.andWhere('notification.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });
    }

    if (options?.isRead !== undefined) {
      query.andWhere('notification.isRead = :isRead', {
        isRead: options.isRead,
      });
    }

    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    query
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string, workspaceId?: string) {
    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isRead = false');

    if (workspaceId) {
      query.andWhere('notification.workspaceId = :workspaceId', {
        workspaceId,
      });
    }

    return query.getCount();
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string, workspaceId?: string) {
    const query = this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .andWhere('isRead = false');

    if (workspaceId) {
      query.andWhere('workspaceId = :workspaceId', { workspaceId });
    }

    const result = await query.execute();
    return { updated: result.affected ?? 0 };
  }

  async delete(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepo.remove(notification);
  }

  async deleteAll(userId: string, workspaceId?: string) {
    const query = this.notificationRepo
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId });

    if (workspaceId) {
      query.andWhere('workspaceId = :workspaceId', { workspaceId });
    }

    const result = await query.execute();
    return { deleted: result.affected ?? 0 };
  }
}
