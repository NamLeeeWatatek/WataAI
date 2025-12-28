import { Injectable } from '@nestjs/common';
import {
  ChannelProvider,
  ChannelMessage,
  ChannelMessageResponse,
  IncomingMessage,
} from './interfaces/channel-provider.interface';
import { ChannelsService } from './channels.service';

@Injectable()
export class ChannelStrategy {
  private providers = new Map<string, ChannelProvider>();

  constructor(private channelsService: ChannelsService) {}

  register(channelType: string, provider: ChannelProvider): void {
    this.providers.set(channelType, provider);
  }

  getProvider(channelType: string): ChannelProvider {
    const provider = this.providers.get(channelType);
    if (!provider) {
      throw new Error(`Channel provider not found: ${channelType}`);
    }
    return provider;
  }

  async sendMessage(
    channelType: string,
    message: ChannelMessage,
    workspaceId?: string,
  ): Promise<ChannelMessageResponse> {
    const connection = await this.channelsService.findByType(
      channelType,
      workspaceId,
    );

    if (!connection) {
      return {
        success: false,
        error: `No active connection found for channel type: ${channelType}`,
      };
    }

    if (!connection.credential) {
      return {
        success: false,
        error: `No credentials configured for channel type: ${channelType}`,
      };
    }

    const provider = this.getProvider(channelType);

    if (channelType === 'facebook' && 'setCredentials' in provider) {
      (provider as any).setCredentials(
        connection.accessToken || '',
        connection.credential.clientSecret || '',
      );
    }

    return provider.sendMessage(message);
  }

  verifyWebhook(channelType: string, payload: any, signature: string): boolean {
    const provider = this.getProvider(channelType);
    return provider.verifyWebhook(payload, signature);
  }

  parseIncomingMessage(channelType: string, payload: any): IncomingMessage {
    const provider = this.getProvider(channelType);
    return provider.parseIncomingMessage(payload);
  }

  getAvailableChannels(): string[] {
    return Array.from(this.providers.keys());
  }
}
