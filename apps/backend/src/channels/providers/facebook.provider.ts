import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  ChannelProvider,
  ChannelMessage,
  ChannelMessageResponse,
  IncomingMessage,
} from '../interfaces/channel-provider.interface';

@Injectable()
export class FacebookProvider implements ChannelProvider {
  readonly channelType = 'facebook';
  private pageAccessToken: string;
  private appSecret: string;
  private readonly apiVersion = 'v24.0';

  constructor(private configService: ConfigService) {
    this.pageAccessToken = this.configService.get<string>(
      'FACEBOOK_PAGE_ACCESS_TOKEN',
      '',
    );
    this.appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET', '');
  }

  setCredentials(pageAccessToken: string, appSecret: string): void {
    this.pageAccessToken = pageAccessToken;
    this.appSecret = appSecret;
  }

  async sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse> {
    try {
      if (!this.pageAccessToken) {
        return {
          success: false,
          error: 'Facebook Page Access Token not configured',
        };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;
      const payload = {
        recipient: { id: message.to },
        message: { text: message.content },
      };

      const response = await axios.post(url, payload, {
        params: { access_token: this.pageAccessToken },
      });

      return {
        success: true,
        messageId: response.data.message_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    if (!this.appSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  parseIncomingMessage(payload: any): IncomingMessage {
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];

    return {
      from: messaging?.sender?.id || '',
      content: messaging?.message?.text || '',
      timestamp: new Date(messaging?.timestamp || Date.now()),
      channelType: this.channelType,
      metadata: {
        pageId: entry?.id,
        messageId: messaging?.message?.mid,
      },
    };
  }
}
