import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChannelProvider,
  ChannelMessage,
  ChannelMessageResponse,
  IncomingMessage,
} from '../interfaces/channel-provider.interface';

@Injectable()
export class OmiProvider implements ChannelProvider {
  readonly channelType = 'omi';
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('OMI_API_KEY', { infer: true }) || '';
    this.webhookSecret =
      this.configService.get<string>('OMI_WEBHOOK_SECRET', { infer: true }) ||
      '';
  }

  async sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse> {
    try {
      return {
        success: true,
        messageId: `omi-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyWebhook(): boolean {
    return true;
  }

  parseIncomingMessage(payload: any): IncomingMessage {
    return {
      from: payload.from || '',
      content: payload.message || '',
      timestamp: new Date(),
      channelType: this.channelType,
      metadata: payload,
    };
  }
}
