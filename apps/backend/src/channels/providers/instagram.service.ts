import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { SendMessageOptions, SendMessageResult } from './messenger.service';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly apiVersion = 'v18.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
  ) {}

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    try {
      const { recipientId, message, channelId } = options;

      const connection = await this.getConnection('instagram', channelId);
      if (!connection) {
        return {
          success: false,
          error: 'Instagram account not connected',
        };
      }

      const accessToken = connection.metadata?.accessToken;
      const igUserId = connection.metadata?.igUserId;

      if (!accessToken || !igUserId) {
        return {
          success: false,
          error: 'Instagram credentials not found',
        };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Instagram API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
        };
      }

      this.logger.log(
        `Message sent to Instagram user ${recipientId}: ${data.message_id}`,
      );

      return {
        success: true,
        messageId: data.message_id,
      };
    } catch (error) {
      this.logger.error(`Error sending Instagram message: ${error.message}`);
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
      const connection = await this.getConnection('instagram', channelId);
      if (!connection) return;

      const accessToken = connection.metadata?.accessToken;
      const igUserId = connection.metadata?.igUserId;

      if (!accessToken || !igUserId) return;

      const url = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/messages`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_on',
          access_token: accessToken,
        }),
      });
    } catch (error) {
      this.logger.error(`Error sending typing indicator: ${error.message}`);
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
