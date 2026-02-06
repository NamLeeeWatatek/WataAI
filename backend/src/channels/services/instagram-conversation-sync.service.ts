import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InstagramSyncService } from './instagram-sync.service';
import { FacebookOAuthService } from '../facebook-oauth.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessageRole } from '../../conversations/conversations.enum';
import { ChannelsService } from '../channels.service';

@Injectable()
export class InstagramConversationSyncService {
  private readonly logger = new Logger(InstagramConversationSyncService.name);

  constructor(
    private readonly instagramSyncService: InstagramSyncService,
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly channelsService: ChannelsService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

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

    const channel = await this.channelsService.findOne(channelId, workspaceId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.type !== 'instagram') {
      throw new Error('Channel is not an Instagram channel');
    }

    if (!channel.accessToken) {
      throw new Error('Channel has no access token');
    }

    // For Instagram, we need igUserId. Assuming it's stored in metadata like pageId
    const igUserId = channel.metadata?.igUserId as string;
    if (!igUserId) {
      throw new Error('Channel has no igUserId in metadata');
    }

    const botId = channel.metadata?.botId as string;

    this.logger.log(
      `Syncing conversations for IG channel ${channel.name} (${channelId})`,
    );

    // Fetch conversations from Instagram
    const fbConversations = await this.instagramSyncService.getConversations(
      igUserId,
      channel.accessToken,
      conversationLimit,
    );

    this.logger.log(
      `Found ${fbConversations.length} conversations on Instagram`,
    );

    const syncedConversations: Array<{
      conversationId: string;
      externalId: string;
      messageCount: number;
    }> = [];

    for (const fbConv of fbConversations) {
      try {
        // Participants: usually [user, business_account]
        // We find the one that is NOT the igUserId
        // However, participants data might not contain igUserId directly if it's not in the list or different ID format
        // Usually, for IG, participants.data contains the user.
        // Let's assume the one that is NOT us. But we need to know "us".
        // igUserId is the business account ID.

        const participant = fbConv.participants?.data.find(
          (p) => p.id !== igUserId,
        );

        // If filtering by ID fails (sometimes IDs differ in context), take the first one?
        // Safe bet: usually there's only one other participant in DM.
        // But let's stick to logic.

        const targetParticipant = participant || fbConv.participants?.data[0];

        if (!targetParticipant) {
          continue;
        }

        const contactName = targetParticipant.name || 'Instagram User';
        let contactAvatar: string | undefined;

        // Optionally fetch user info if needed, but IG Basic Display/Graph API restrictions might apply
        // We skip extra fetch for now to avoid permission issues unless we are sure

        const conversation =
          await this.conversationsService.findOrCreateFromWebhook({
            botId,
            channelId: channel.id,
            channelType: 'instagram',
            externalId: targetParticipant.id,
            contactName,
            contactAvatar,
            metadata: {
              igUserId,
              conversationId: fbConv.id,
              instagramConversationId: fbConv.id,
            },
          });

        const fbMessages = await this.instagramSyncService.getMessages(
          fbConv.id,
          channel.accessToken,
          messageLimit,
        );

        let syncedMessageCount = 0;
        const sortedMessages = [...fbMessages].reverse();

        for (const fbMsg of sortedMessages) {
          const existingMessagesResult =
            await this.conversationsService.getMessages(conversation.id);

          const messageExists = existingMessagesResult.messages.some(
            (m) => m.metadata?.externalId === fbMsg.id,
          );

          if (messageExists) {
            continue;
          }

          // Determine role
          const isFromUser = fbMsg.from.id === targetParticipant.id;
          const role = isFromUser ? MessageRole.USER : MessageRole.ASSISTANT;

          await this.conversationsService.addMessageFromWebhook({
            conversationId: conversation.id,
            content: fbMsg.message || '[attachment]',
            role,
            metadata: {
              externalId: fbMsg.id,
              senderId: fbMsg.from.id,
              senderName: fbMsg.from.name,
              igUserId,
              channelType: 'instagram',
              timestamp: new Date(fbMsg.created_time),
            },
          });

          syncedMessageCount++;
        }

        syncedConversations.push({
          conversationId: conversation.id,
          externalId: targetParticipant.id,
          messageCount: syncedMessageCount,
        });
      } catch (error) {
        this.logger.error(
          `Failed to sync IG conversation ${fbConv.id}: ${error.message}`,
        );
      }
    }

    return {
      synced: syncedConversations.length,
      conversations: syncedConversations,
    };
  }
}
