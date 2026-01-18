import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FacebookConversation {
  id: string;
  updated_time: string;
  message_count?: number;
  unread_count?: number;
  participants?: {
    data: Array<{
      id: string;
      name: string;
      email?: string;
    }>;
  };
}

export interface FacebookMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    name?: string;
    email?: string;
  };
  to?: {
    data: Array<{
      id: string;
      name?: string;
    }>;
  };
  message?: string;
  attachments?: {
    data: Array<{
      id: string;
      mime_type: string;
      name?: string;
      image_data?: { url: string };
    }>;
  };
}

/**
 * Facebook Sync Service
 *
 * Fetches conversations and messages from Facebook Graph API
 * Uses page access token stored in channel connection
 */
@Injectable()
export class FacebookSyncService {
  private readonly logger = new Logger(FacebookSyncService.name);
  private readonly apiVersion = 'v24.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  /**
   * Get page info from page access token
   */
  async getPageInfo(pageAccessToken: string): Promise<{
    id: string;
    name: string;
    category?: string;
  }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/me`;
      const response = await axios.get(url, {
        params: {
          fields: 'id,name,category',
          access_token: pageAccessToken,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Get page info failed:',
        error.response?.data || error.message,
      );
      throw new Error(`Failed to get page info: ${error.message}`);
    }
  }

  /**
   * Get conversations for a Facebook page
   */
  async getConversations(
    pageId: string,
    pageAccessToken: string,
    limit: number = 25,
  ): Promise<FacebookConversation[]> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${pageId}/conversations`;
      const response = await axios.get(url, {
        params: {
          fields: 'id,updated_time,message_count,unread_count,participants',
          limit,
          access_token: pageAccessToken,
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      this.logger.error(
        `Get conversations failed for page ${pageId}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  /**
   * Get messages from a conversation
   */
  async getMessages(
    conversationId: string,
    pageAccessToken: string,
    limit: number = 25,
  ): Promise<FacebookMessage[]> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${conversationId}`;
      const response = await axios.get(url, {
        params: {
          fields: 'messages{id,created_time,from,to,message,attachments}',
          access_token: pageAccessToken,
        },
      });

      const messages = response.data.messages?.data || [];

      // Return only the requested limit
      return messages.slice(0, limit);
    } catch (error: any) {
      this.logger.error(
        `Get messages failed for conversation ${conversationId}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Sync conversations and messages for a channel
   * Returns summary of synced data
   */
  async syncChannelMessages(
    pageId: string,
    pageAccessToken: string,
    conversationLimit: number = 10,
    messageLimit: number = 25,
  ): Promise<{
    pageInfo: { id: string; name: string; category?: string };
    conversations: Array<{
      conversation: FacebookConversation;
      messages: FacebookMessage[];
    }>;
  }> {
    this.logger.log(`Starting sync for page ${pageId}`);

    // Get page info
    const pageInfo = await this.getPageInfo(pageAccessToken);
    this.logger.log(`Page: ${pageInfo.name} (${pageInfo.id})`);

    // Get conversations
    const conversations = await this.getConversations(
      pageId,
      pageAccessToken,
      conversationLimit,
    );
    this.logger.log(`Found ${conversations.length} conversations`);

    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await this.getMessages(
          conv.id,
          pageAccessToken,
          messageLimit,
        );
        this.logger.log(`Conversation ${conv.id}: ${messages.length} messages`);
        return {
          conversation: conv,
          messages,
        };
      }),
    );

    return {
      pageInfo,
      conversations: conversationsWithMessages,
    };
  }
}
