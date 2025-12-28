import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FacebookOAuthService } from './facebook-oauth.service';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';
import { FacebookSyncService } from './services/facebook-sync.service';
import { FacebookConversationSyncService } from './services/facebook-conversation-sync.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

@ApiTags('Facebook OAuth')
@Controller({ path: 'channels/facebook', version: '1' })
export class FacebookOAuthController {
  constructor(
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly channelsService: ChannelsService,
    private readonly channelStrategy: ChannelStrategy,
    private readonly facebookSyncService: FacebookSyncService,
    private readonly facebookConversationSyncService: FacebookConversationSyncService,
  ) {}

  @Get('oauth/url')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Facebook OAuth URL' })
  async getOAuthUrl(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    // If no workspace context, use personal context (user.id)
    const wsId = workspaceId || req.user.id;

    console.log(
      `[FacebookOAuth] Getting OAuth URL for workspace: ${workspaceId} (user: ${req.user.id})`,
    );

    const credential = await this.facebookOAuthService.getCredential(
      workspaceId || req.user.id,
      req.user.id,
    );

    if (!credential) {
      console.warn(
        `[FacebookOAuth] No credential found for workspace: ${wsId}`,
      );
      throw new HttpException(
        `Facebook App not configured for workspace ${wsId}. Please setup your Facebook App in Channels -> Configurations first.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const defaultRedirectUri = `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=facebook`;
    const uri = redirectUri || defaultRedirectUri;

    const state = `${req.user?.id}:${wsId}`;

    const oauthUrl = this.facebookOAuthService.getOAuthUrl(
      credential.clientId!,
      uri,
      state,
    );

    console.log(
      `[FacebookOAuth] Generated OAuth URL for client: ${credential.clientId}`,
    );

    return {
      url: oauthUrl,
      redirectUri: uri,
    };
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'Handle Facebook OAuth callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('workspace_id') workspaceId?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    // âœ… Handle Facebook OAuth errors
    if (error) {
      throw new HttpException(
        errorDescription || 'Facebook OAuth failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!code) {
      throw new HttpException(
        'Authorization code not provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let wsId = workspaceId;
      let userId: string | undefined;

      if (state) {
        // state is formatted as userId:workspaceId
        const parts = state.split(':');
        if (parts.length > 1) {
          userId = parts[0];
          if (!wsId) wsId = parts[1];
        } else if (!wsId) {
          wsId = state; // Fallback to state if not in our format
          userId = state;
        }
      }

      console.log(
        `[FacebookOAuth] Handling callback for workspace: ${wsId}, user: ${userId}`,
      );

      const credential = await this.facebookOAuthService.getCredential(
        wsId!,
        userId,
      );

      if (!credential) {
        throw new HttpException(
          'Facebook App not configured',
          HttpStatus.NOT_FOUND,
        );
      }

      const redirectUri = `${process.env.FRONTEND_DOMAIN}/channels/callback?provider=facebook`;

      // âœ… Exchange code for token (may fail if code already used)
      const accessToken = await this.facebookOAuthService.exchangeCodeForToken(
        code,
        redirectUri,
        credential.clientId!,
        credential.clientSecret!,
      );

      const pages = await this.facebookOAuthService.getUserPages(accessToken);

      return {
        success: true,
        state: state,
        pages: pages.map((page) => ({
          id: page.id,
          name: page.name,
          category: page.category,
          tasks: page.tasks,
        })),
        workspaceId: wsId,
        tempToken: accessToken,
      };
    } catch (error) {
      // âœ… Better error handling
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Failed to process OAuth callback';

      throw new HttpException(message, statusCode);
    }
  }

  @Post('connect')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Connect a Facebook Page' })
  async connectPage(
    @Request() req,
    @Body()
    body: {
      pageId: string;
      pageName: string;
      userAccessToken: string;
      category?: string;
      botId?: string;
    },
  ) {
    try {
      const userId = req.user.id;
      const workspaceId = req.user.workspaceId || userId;

      const pages = await this.facebookOAuthService.getUserPages(
        body.userAccessToken,
      );

      const page = pages.find((p) => p.id === body.pageId);

      if (!page) {
        throw new HttpException(
          'Page not found or no permission',
          HttpStatus.NOT_FOUND,
        );
      }

      const connection = await this.facebookOAuthService.connectPage(
        page.id,
        page.name,
        page.access_token,
        workspaceId,
        userId,
        {
          category: page.category,
          tasks: page.tasks,
          botId: body.botId,
        },
      );

      const subscribed = await this.facebookOAuthService.subscribePageWebhooks(
        page.id,
        page.access_token,
      );

      return {
        success: true,
        connection: {
          id: connection.id,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          metadata: connection.metadata,
          connectedAt: connection.connectedAt,
        },
        webhookSubscribed: subscribed,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to connect Facebook page',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('connections')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get connected Facebook pages' })
  async getConnections(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const wsId = workspaceId || req.user.id;

    const connections = await this.facebookOAuthService.getConnectedPages(wsId);

    return {
      success: true,
      connections: connections.map((conn) => ({
        id: conn.id,
        name: conn.name,
        type: conn.type,
        status: conn.status,
        metadata: conn.metadata,
        connectedAt: conn.connectedAt,
      })),
    };
  }

  @Delete('connections/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Disconnect a Facebook page' })
  async disconnectPage(
    @Request() req,
    @Param('id') connectionId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const wsId = workspaceId || req.user.id;

    await this.facebookOAuthService.disconnectPage(connectionId, wsId);

    return {
      success: true,
      message: 'Facebook page disconnected',
    };
  }

  @Post('connections/:id/test')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Test Facebook page connection' })
  async testConnection(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Body() body: { recipientId: string; message: string },
  ) {
    const wsId = workspaceId || req.user.id;

    const connection = await this.channelsService.findOne(connectionId, wsId);
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    const provider = this.channelStrategy.getProvider('facebook');

    if ('setCredentials' in provider) {
      (provider as any).setCredentials(
        connection.accessToken,
        connection.credential?.clientSecret || '',
      );
    }

    const result = await provider.sendMessage({
      to: body.recipientId,
      content: body.message,
    });

    if (!result.success) {
      throw new HttpException(
        result.error || 'Failed to send test message',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: 'Test message sent',
      messageId: result.messageId,
    };
  }

  @Post('setup')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Setup Facebook App credentials' })
  async setupApp(
    @Request() req,
    @Body()
    body: {
      appId: string;
      appSecret: string;
      verifyToken?: string;
    },
    @CurrentWorkspace() workspaceId: string,
  ) {
    const wsId = workspaceId || req.user.id;

    const credential = await this.facebookOAuthService.updateCredential(
      wsId,
      body.appId,
      body.appSecret,
      body.verifyToken ? { verifyToken: body.verifyToken } : undefined,
    );

    return {
      success: true,
      credential: {
        id: credential.id,
        provider: credential.provider,
        appId: credential.clientId,
        verifyToken: credential.metadata?.verifyToken,
        isActive: credential.isActive,
      },
    };
  }

  @Get('setup')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Facebook App credentials' })
  async getSetup(@Request() req, @CurrentWorkspace() workspaceId: string) {
    const wsId = workspaceId || req.user.id;

    const credential = await this.facebookOAuthService.getCredential(wsId);

    if (!credential) {
      return {
        success: true,
        configured: false,
        credential: null,
      };
    }

    return {
      success: true,
      configured: true,
      credential: {
        id: credential.id,
        provider: credential.provider,
        appId: credential.clientId,
        verifyToken: credential.metadata?.verifyToken,
        isActive: credential.isActive,
        createdAt: credential.createdAt,
      },
    };
  }

  @Get('connections/:id/sync')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Sync conversations and messages from Facebook' })
  async syncMessages(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Query('conversation_limit') conversationLimit?: number,
    @Query('message_limit') messageLimit?: number,
  ) {
    const wsId = workspaceId || req.user.id;

    // Get connection
    const connection = await this.channelsService.findOne(connectionId, wsId);
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    if (connection.type !== 'facebook') {
      throw new HttpException(
        'This endpoint only supports Facebook connections',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!connection.accessToken) {
      throw new HttpException(
        'No access token found for this connection',
        HttpStatus.BAD_REQUEST,
      );
    }

    const pageId = connection.metadata?.pageId as string;
    if (!pageId) {
      throw new HttpException(
        'No pageId found in connection metadata',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Sync messages using the stored page access token
    const result = await this.facebookSyncService.syncChannelMessages(
      pageId,
      connection.accessToken,
      conversationLimit || 10,
      messageLimit || 25,
    );

    return {
      success: true,
      pageInfo: result.pageInfo,
      conversationCount: result.conversations.length,
      conversations: result.conversations.map((c) => ({
        id: c.conversation.id,
        updated_time: c.conversation.updated_time,
        message_count: c.conversation.message_count,
        unread_count: c.conversation.unread_count,
        participants: c.conversation.participants?.data,
        messages: c.messages.map((m) => ({
          id: m.id,
          created_time: m.created_time,
          from: m.from,
          message: m.message,
        })),
      })),
    };
  }

  @Post('connections/:id/sync-to-db')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Sync Facebook conversations into database' })
  async syncConversationsToDatabase(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Body()
    body?: {
      conversationLimit?: number;
      messageLimit?: number;
    },
  ) {
    const wsId = workspaceId || req.user.id;

    const result =
      await this.facebookConversationSyncService.syncConversationsForChannel(
        connectionId,
        wsId,
        {
          conversationLimit: body?.conversationLimit || 25,
          messageLimit: body?.messageLimit || 50,
        },
      );

    return {
      success: true,
      synced: result.synced,
      conversations: result.conversations,
    };
  }
}
