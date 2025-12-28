import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'notifications',
})
@UseGuards(AuthGuard('jwt'))
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn('Client connected without userId');
      client.disconnect(true);
      return;
    }

    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    const userSockets = this.connectedClients.get(userId);
    if (userSockets) {
      userSockets.add(client.id);
    }

    this.logger.log(`Client connected: ${client.id} for user ${userId}`);
    this.logger.debug(`Current connections: ${this.getConnectionStats()}`);

    // Send initial unread count
    this.sendUnreadCount(userId);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    if (this.connectedClients.has(userId)) {
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(userId);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id} from user ${userId}`);
    this.logger.debug(`Current connections: ${this.getConnectionStats()}`);
  }

  private getConnectionStats(): string {
    return `[${Array.from(this.connectedClients.entries())
      .map(([userId, sockets]) => `${userId}:${sockets.size}`)
      .join(', ')}]`;
  }

  private async sendUnreadCount(userId: string) {
    try {
      const count = await this.notificationsService.getUnreadCount(userId);
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        this.server.to([...userSockets]).emit('unread_count', { count });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send unread count to user ${userId}: ${error.message}`,
      );
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.handshake.query.userId as string;
    try {
      const notification = await this.notificationsService.markAsRead(
        data.notificationId,
        userId,
      );
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        this.server
          .to([...userSockets])
          .emit('notification_updated', notification);
      }
      await this.sendUnreadCount(userId);
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
      );
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId?: string },
  ) {
    const userId = client.handshake.query.userId as string;
    try {
      await this.notificationsService.markAllAsRead(userId, data.workspaceId);
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        this.server.to([...userSockets]).emit('notifications_updated');
      }
      await this.sendUnreadCount(userId);
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('subscribe_to_workspace')
  handleSubscribeToWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const userId = client.handshake.query.userId as string;
    client.join(`workspace:${data.workspaceId}`);
    this.logger.log(
      `User ${userId} subscribed to workspace ${data.workspaceId}`,
    );
  }

  @SubscribeMessage('unsubscribe_from_workspace')
  handleUnsubscribeFromWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const userId = client.handshake.query.userId as string;
    client.leave(`workspace:${data.workspaceId}`);
    this.logger.log(
      `User ${userId} unsubscribed from workspace ${data.workspaceId}`,
    );
  }

  // Public methods for emitting notifications from service
  emitNewNotification(notification: any) {
    const userSockets = this.connectedClients.get(notification.userId);
    if (userSockets && userSockets.size > 0) {
      this.server.to([...userSockets]).emit('new_notification', notification);
    }

    // Also emit to workspace if applicable
    if (notification.workspaceId) {
      this.server
        .to(`workspace:${notification.workspaceId}`)
        .emit('workspace_notification', notification);
    }
  }

  broadcastUnreadCountUpdate(userId: string) {
    this.sendUnreadCount(userId);
  }
}
