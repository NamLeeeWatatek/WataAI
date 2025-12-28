import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChannelProvider,
  ChannelMessage,
  ChannelMessageResponse,
  IncomingMessage,
} from '../interfaces/channel-provider.interface';

@Injectable()
export class GoogleProvider implements ChannelProvider {
  readonly channelType = 'google';
  private readonly serviceAccountKey: string;

  constructor(private configService: ConfigService) {
    this.serviceAccountKey =
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY', {
        infer: true,
      }) || '';
  }

  async sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse> {
    try {
      return {
        success: true,
        messageId: `google-${Date.now()}`,
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
      from: payload.sender?.id || '',
      content: payload.message?.text || '',
      timestamp: new Date(),
      channelType: this.channelType,
      metadata: payload,
    };
  }
}
