import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FacebookSyncService } from './facebook-sync.service';
import { FacebookOAuthService } from '../facebook-oauth.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageRole } from '../../conversations/conversations.enum';
import { ChannelsService } from '../channels.service';

/**
 * Facebook Conversation Sync Service
 *
 * Syncs conversations and messages from Facebook into local database
 */
@Injectable()
export class FacebookConversationSyncService {
  private readonly logger = new Logger(FacebookConversationSyncService.name);

  constructor(
    private readonly facebookSyncService: FacebookSyncService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly channelsService: ChannelsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

  /**
   * Sync conversations from Facebook for a specific channel
   */
  async syncConversationsForChannel(
    channelId: string,
    workspaceId: string,
    options?: {
      conversationLimit?: number;
      messageLimit?: number;
    },
  ): Promise<{
    synced: number;
    conversations: Array<{
      conversationId: string;
      externalId: string;
      messageCount: number;
    }>;
  }> {
    const { conversationLimit = 25, messageLimit = 50 } = options || {};

    // Get channel
    const channel = await this.channelsService.findOne(channelId, workspaceId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.type !== 'facebook') {
      throw new Error('Channel is not a Facebook channel');
    }

    if (!channel.accessToken) {
      throw new Error('Channel has no access token');
    }

    const pageId = channel.metadata?.pageId as string;
    if (!pageId) {
      throw new Error('Channel has no pageId in metadata');
    }

    const botId = channel.metadata?.botId as string;
    if (!botId) {
      throw new Error('Channel has no botId configured');
    }

    this.logger.log(
      `Syncing conversations for channel ${channel.name} (${channelId})`,
    );

    // Fetch conversations from Facebook
    const fbConversations = await this.facebookSyncService.getConversations(
      pageId,
      channel.accessToken,
      conversationLimit,
    );

    this.logger.log(
      `Found ${fbConversations.length} conversations on Facebook`,
    );

    const syncedConversations: Array<{
      conversationId: string;
      externalId: string;
      messageCount: number;
    }> = [];

    // Process each conversation
    for (const fbConv of fbConversations) {
      try {
        // Get participant (the user, not the page)
        const participant = fbConv.participants?.data.find(
          (p) => p.id !== pageId,
        );

        if (!participant) {
          this.logger.warn(
            `No participant found for conversation ${fbConv.id}`,
          );
          continue;
        }

        // Get user info from Facebook
        let contactName = participant.name || 'Facebook User';
        let contactAvatar: string | undefined;

        try {
          const userInfo = await this.facebookOAuthService.getUserInfo(
            participant.id,
            channel.accessToken,
          );
          contactName = userInfo.name || contactName;
          contactAvatar = userInfo.profile_pic;
        } catch (error) {
          this.logger.warn(
            `Failed to get user info for ${participant.id}: ${error.message}`,
          );
        }

        // Find or create conversation in database
        const conversation =
          await this.conversationsService.findOrCreateFromWebhook({
            botId,
            channelId: channel.id,
            channelType: 'facebook',
            externalId: participant.id,
            contactName,
            contactAvatar,
            metadata: {
              pageId,
              conversationId: fbConv.id,
              facebookConversationId: fbConv.id,
            },
          });

        this.logger.log(`Conversation ${conversation.id} for ${contactName}`);

        // Fetch messages for this conversation
        const fbMessages = await this.facebookSyncService.getMessages(
          fbConv.id,
          channel.accessToken,
          messageLimit,
        );

        this.logger.log(
          `Found ${fbMessages.length} messages in conversation ${fbConv.id}`,
        );

        let syncedMessageCount = 0;

        // Sync messages (oldest first)
        const sortedMessages = [...fbMessages].reverse();

        for (const fbMsg of sortedMessages) {
          // Check if message already exists
          const existingMessagesResult =
            await this.conversationsService.getMessages(conversation.id);

          const messageExists = existingMessagesResult.messages.some(
            (m) => m.metadata?.externalId === fbMsg.id,
          );

          if (messageExists) {
            continue;
          }

          // Determine role (user or assistant)
          const isFromUser = fbMsg.from.id === participant.id;
          const role = isFromUser ? MessageRole.USER : MessageRole.ASSISTANT;

          // Save message
          await this.conversationsService.addMessageFromWebhook({
            conversationId: conversation.id,
            content: fbMsg.message || '[attachment]',
            role,
            metadata: {
              externalId: fbMsg.id,
              senderId: fbMsg.from.id,
              senderName: fbMsg.from.name,
              pageId,
              channelType: 'facebook',
              timestamp: new Date(fbMsg.created_time),
            },
          });

          syncedMessageCount++;
        }

        this.logger.log(
          `Synced ${syncedMessageCount} new messages for conversation ${conversation.id}`,
        );

        syncedConversations.push({
          conversationId: conversation.id,
          externalId: participant.id,
          messageCount: syncedMessageCount,
        });
      } catch (error) {
        this.logger.error(
          `Failed to sync conversation ${fbConv.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Sync completed: ${syncedConversations.length} conversations synced`,
    );

    return {
      synced: syncedConversations.length,
      conversations: syncedConversations,
    };
  }
}
