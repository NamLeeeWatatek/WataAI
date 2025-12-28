import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { SendMessageOptions, SendMessageResult } from './messenger.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
  ) {}

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    try {
      const { recipientId, message, channelId } = options;

      const connection = await this.getConnection('telegram', channelId);
      if (!connection) {
        return {
          success: false,
          error: 'Telegram bot not connected',
        };
      }

      const botToken = connection.metadata?.botToken;
      if (!botToken) {
        return {
          success: false,
          error: 'Bot token not found',
        };
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: recipientId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        this.logger.error(`Telegram API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          error: data.description || 'Failed to send message',
        };
      }

      this.logger.log(
        `Message sent to Telegram chat ${recipientId}: ${data.result.message_id}`,
      );

      return {
        success: true,
        messageId: data.result.message_id.toString(),
      };
    } catch (error) {
      this.logger.error(`Error sending Telegram message: ${error.message}`);
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
      const connection = await this.getConnection('telegram', channelId);
      if (!connection) return;

      const botToken = connection.metadata?.botToken;
      if (!botToken) return;

      const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: recipientId,
          action: 'typing',
        }),
      });
    } catch (error) {
      this.logger.error(`Error sending typing indicator: ${error.message}`);
    }
  }

  async sendMessageWithButtons(
    recipientId: string,
    message: string,
    buttons: Array<{ text: string; callback_data: string }>,
    channelId?: string,
  ): Promise<SendMessageResult> {
    try {
      const connection = await this.getConnection('telegram', channelId);
      if (!connection) {
        return { success: false, error: 'Telegram bot not connected' };
      }

      const botToken = connection.metadata?.botToken;
      if (!botToken) {
        return { success: false, error: 'Bot token not found' };
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: recipientId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [buttons],
          },
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          error: data.description || 'Failed to send message',
        };
      }

      return {
        success: true,
        messageId: data.result.message_id.toString(),
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
