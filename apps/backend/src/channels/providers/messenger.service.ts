import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';

export interface SendMessageOptions {
  recipientId: string;
  message: string;
  channelId?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);
  private readonly apiVersion = 'v24.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
  ) {}

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    try {
      const { recipientId, message, channelId } = options;

      const connection = await this.getConnection('facebook', channelId);
      if (!connection) {
        return {
          success: false,
          error: 'Facebook page not connected',
        };
      }

      const pageAccessToken =
        connection.accessToken || connection.metadata?.accessToken;
      if (!pageAccessToken) {
        return {
          success: false,
          error: 'Page access token not found',
        };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: pageAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Facebook API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
        };
      }

      this.logger.log(
        `Message sent to Facebook user ${recipientId}: ${data.message_id}`,
      );

      return {
        success: true,
        messageId: data.message_id,
      };
    } catch (error) {
      this.logger.error(`Error sending Facebook message: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendTypingIndicator(
    recipientId: string,
    channelId?: string,
  ): Promise<void> {
    try {
      const connection = await this.getConnection('facebook', channelId);
      if (!connection) return;

      const pageAccessToken =
        connection.accessToken || connection.metadata?.accessToken;
      if (!pageAccessToken) return;

      const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_on',
          access_token: pageAccessToken,
        }),
      });
    } catch (error) {
      this.logger.error(`Error sending typing indicator: ${error.message}`);
    }
  }

  async sendQuickReplies(
    recipientId: string,
    message: string,
    quickReplies: Array<{ title: string; payload: string }>,
    channelId?: string,
  ): Promise<SendMessageResult> {
    try {
      const connection = await this.getConnection('facebook', channelId);
      if (!connection) {
        return { success: false, error: 'Facebook page not connected' };
      }

      const pageAccessToken =
        connection.accessToken || connection.metadata?.accessToken;
      if (!pageAccessToken) {
        return { success: false, error: 'Page access token not found' };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            text: message,
            quick_replies: quickReplies.map((qr) => ({
              content_type: 'text',
              title: qr.title,
              payload: qr.payload,
            })),
          },
          access_token: pageAccessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
        };
      }

      return {
        success: true,
        messageId: data.message_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getConnection(
    type: string,
    channelId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { type, status: 'active' };
    if (channelId) {
      where.id = channelId;
    }

    return this.connectionRepository.findOne({ where });
  }
}
