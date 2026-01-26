import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FacebookConversation, FacebookMessage } from './facebook-sync.service';

/**
 * Instagram Sync Service
 *
 * Fetches conversations and messages from Instagram Graph API
 */
@Injectable()
export class InstagramSyncService {
    private readonly logger = new Logger(InstagramSyncService.name);
    private readonly apiVersion = 'v24.0';
    private readonly baseUrl = 'https://graph.facebook.com';

    async getPageInfo(accessToken: string): Promise<{
        id: string;
        name: string;
        username?: string;
    }> {
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/me`;
            const response = await axios.get(url, {
                params: {
                    fields: 'id,name,username',
                    access_token: accessToken,
                },
            });

            return response.data;
        } catch (error: any) {
            this.logger.error(
                'Get IG info failed:',
                error.response?.data || error.message,
            );
            throw new Error(`Failed to get IG info: ${error.message}`);
        }
    }

    async getConversations(
        igUserId: string,
        accessToken: string,
        limit: number = 25,
    ): Promise<FacebookConversation[]> {
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/${igUserId}/conversations`;
            const response = await axios.get(url, {
                params: {
                    platform: 'instagram',
                    fields: 'id,updated_time,message_count,unread_count,participants',
                    limit,
                    access_token: accessToken,
                },
            });

            return response.data.data || [];
        } catch (error: any) {
            this.logger.error(
                `Get IG conversations failed for user ${igUserId}:`,
                error.response?.data || error.message,
            );
            throw new Error(`Failed to get IG conversations: ${error.message}`);
        }
    }

    async getMessages(
        conversationId: string,
        accessToken: string,
        limit: number = 25,
    ): Promise<FacebookMessage[]> {
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/${conversationId}`;
            const response = await axios.get(url, {
                params: {
                    fields: 'messages{id,created_time,from,to,message,attachments}',
                    access_token: accessToken,
                },
            });

            const messages = response.data.messages?.data || [];
            return messages.slice(0, limit);
        } catch (error: any) {
            this.logger.error(
                `Get IG messages failed for conversation ${conversationId}:`,
                error.response?.data || error.message,
            );
            throw new Error(`Failed to get IG messages: ${error.message}`);
        }
    }
}
