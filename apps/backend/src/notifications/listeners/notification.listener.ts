import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

export interface CreationJobCompletedEvent {
  id: string;
  userId: string;
  workspaceId: string;
  inputData: {
    prompt?: string;
    [key: string]: any;
  };
}

export interface CreationJobFailedEvent {
  id: string;
  userId: string;
  workspaceId: string;
  error?: string;
}

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('creation-job.completed')
  async handleCreationJobCompleted(payload: CreationJobCompletedEvent) {
    this.logger.log(
      `Handling creation-job.completed event for job ${payload.id}`,
    );
    const prompt = payload.inputData?.prompt || 'Generation';
    const displayPrompt =
      prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;

    try {
      await this.notificationsService.create({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        title: 'Job Completed',
        message: `Your job "${displayPrompt}" has been completed successfully.`,
        type: 'success',
        metadata: {
          resourceType: 'creation_job',
          resourceId: payload.id,
          status: 'COMPLETED',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling creation-job.completed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @OnEvent('creation-job.failed')
  async handleCreationJobFailed(payload: CreationJobFailedEvent) {
    this.logger.log(`Handling creation-job.failed event for job ${payload.id}`);
    try {
      await this.notificationsService.create({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        title: 'Job Failed',
        message: `Your job failed to process.`,
        type: 'error',
        metadata: {
          resourceType: 'creation_job',
          resourceId: payload.id,
          status: 'FAILED',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling creation-job.failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
