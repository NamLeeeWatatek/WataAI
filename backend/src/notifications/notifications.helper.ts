import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * Helper service for easily sending notifications from other modules
 */
@Injectable()
export class NotificationsHelper {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Send a system notification to a user
   */
  async sendSystemNotification(
    userId: string,
    workspaceId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ) {
    return this.notificationsService.create({
      userId,
      workspaceId,
      title,
      message,
      type,
    });
  }

  /**
   * Send notification about a new message in a conversation
   */
  async sendNewMessageNotification(
    userId: string,
    workspaceId: string,
    conversationId: string,
    senderName: string,
    messagePreview: string,
  ) {
    return this.sendSystemNotification(
      userId,
      workspaceId,
      `New message from ${senderName}`,
      `Conversation ${conversationId}: ${messagePreview}`,
      'info',
    );
  }

  /**
   * Send notification about a workflow execution
   */
  async sendWorkflowNotification(
    userId: string,
    workspaceId: string,
    workflowName: string,
    status: 'completed' | 'failed' | 'started',
    message: string,
  ) {
    const types: Record<
      'completed' | 'failed' | 'started',
      'success' | 'error' | 'info'
    > = {
      completed: 'success',
      failed: 'error',
      started: 'info',
    };

    return this.sendSystemNotification(
      userId,
      workspaceId,
      `Workflow ${workflowName} ${status}`,
      message,
      types[status],
    );
  }

  /**
   * Send notification about a bot event
   */
  async sendBotNotification(
    userId: string,
    workspaceId: string,
    botName: string,
    eventType: 'created' | 'updated' | 'deleted' | 'error',
    message: string,
  ) {
    const types: Record<
      'created' | 'updated' | 'deleted' | 'error',
      'success' | 'error' | 'info' | 'warning'
    > = {
      created: 'success',
      updated: 'info',
      deleted: 'warning',
      error: 'error',
    };

    return this.sendSystemNotification(
      userId,
      workspaceId,
      `Bot ${botName} ${eventType}`,
      message,
      types[eventType],
    );
  }
}
