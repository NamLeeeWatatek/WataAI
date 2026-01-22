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
  Logger,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FacebookOAuthService } from './facebook-oauth.service';
import { ChannelsService } from './channels.service';
import { ChannelStrategy } from './channel.strategy';
import { FacebookSyncService } from './services/facebook-sync.service';
import { FacebookConversationSyncService } from './services/facebook-conversation-sync.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('Facebook OAuth')
@Controller('channels/facebook')
export class FacebookOAuthController {
  private readonly logger = new Logger(FacebookOAuthController.name);

  constructor(
    private readonly facebookOAuthService: FacebookOAuthService,
    private readonly channelsService: ChannelsService,
    private readonly channelStrategy: ChannelStrategy,
    private readonly facebookSyncService: FacebookSyncService,
    private readonly facebookConversationSyncService: FacebookConversationSyncService,
    private readonly configService: ConfigService,
  ) {}

  @Get('oauth/url')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Facebook OAuth URL' })
  async getOAuthUrl(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Query('redirect_uri') redirectUri?: string,
    @Query('credential_id') credentialId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

    this.logger.log(
      `[FacebookOAuth] Getting OAuth URL for workspace: ${workspaceId} (user: ${req.user.id}, credential: ${credentialId || 'default'})`,
    );

    const credential = await this.facebookOAuthService.getCredential(
      workspaceId,
      req.user.id,
      credentialId,
    );

    if (!credential) {
      this.logger.warn(
        `[FacebookOAuth] No credential found for workspace: ${workspaceId}`,
      );
      throw new NotFoundException(
        `Facebook App not configured for workspace ${workspaceId}. Please setup your Facebook App in Channels -> Configurations first.`,
      );
    }

    const defaultRedirectUri =
      this.configService.get('facebook.redirectUri', { infer: true }) ||
      `${process.env.FRONTEND_DOMAIN}/channels/callback/facebook`;
    const uri = redirectUri || defaultRedirectUri;

    const state = `${req.user?.id}:${workspaceId}${credentialId ? `:${credentialId}` : ''}`;

    const oauthUrl = this.facebookOAuthService.getOAuthUrl(
      credential.clientId!,
      uri,
      state,
    );

    this.logger.log(
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
    @Query('redirect_uri') redirectUriParam?: string,
  ) {
    // âœ… Handle Facebook OAuth errors
    if (error) {
      throw new BadRequestException(
        errorDescription || 'Facebook OAuth failed',
      );
    }

    if (!code) {
      throw new BadRequestException('Authorization code not provided');
    }

    try {
      let wsId = workspaceId;
      let userId: string | undefined;
      let credential;

      if (state) {
        // state is formatted as userId:workspaceId[:credentialId]
        const parts = state.split(':');
        if (parts.length > 1) {
          userId = parts[0];
          if (!wsId) wsId = parts[1];
          const credentialId = parts[2];

          this.logger.log(
            `[FacebookOAuth] Handling callback for workspace: ${wsId}, user: ${userId}, credential: ${credentialId || 'default'}`,
          );

          credential = await this.facebookOAuthService.getCredential(
            wsId!,
            userId,
            credentialId,
          );
        } else if (!wsId) {
          throw new BadRequestException('Invalid OAuth state format');
        }
      }

      if (!credential) {
        throw new NotFoundException('Facebook App not configured');
      }

      const defaultRedirectUri =
        this.configService.get('facebook.redirectUri', { infer: true }) ||
        `${process.env.FRONTEND_DOMAIN}/channels/callback/facebook`;
      const redirectUri = redirectUriParam || defaultRedirectUri;

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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Connect a Facebook Page' })
  async connectPage(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Body()
    body: {
      pageId: string;
      pageName: string;
      userAccessToken: string;
      pageAccessToken?: string; // Optional Page-level token
      category?: string;
      botId?: string;
    },
  ) {
    try {
      const userId = req.user.id;
      this.logger.log(
        `[FacebookOAuth] Connecting page ${body.pageId} for workspace ${workspaceId}`,
      );
      this.logger.debug(
        `[FacebookOAuth] User Token received (first 10 chars): ${body.userAccessToken?.substring(0, 10)}...`,
      );
      this.logger.debug(
        `[FacebookOAuth] Page Token received (exists): ${!!body.pageAccessToken}`,
      );

      let pageToConnect: {
        id: string;
        name: string;
        access_token: string;
        category?: string;
        tasks?: string[];
      } | null = null;

      // Try to re-verify using userAccessToken (Security best practice)
      try {
        const pages = await this.facebookOAuthService.getUserPages(
          body.userAccessToken,
        );
        const verifiedPage = pages.find((p) => p.id === body.pageId);
        if (verifiedPage) {
          pageToConnect = verifiedPage;
        }
      } catch (error) {
        this.logger.warn(
          `[FacebookOAuth] Could not re-verify page with user token: ${error.message}`,
        );
      }

      if (!pageToConnect) {
        if (body.pageAccessToken) {
          this.logger.log(
            `[FacebookOAuth] Falling back to provided pageAccessToken for page ${body.pageId}`,
          );
          pageToConnect = {
            id: body.pageId,
            name: body.pageName,
            access_token: body.pageAccessToken,
            category: body.category,
          };
        } else {
          throw new BadRequestException(
            'Could not verify page ownership and no page token provided',
          );
        }
      }

      const verifiedPageToConnect = pageToConnect; // Local const for type safety

      const connection = await this.facebookOAuthService.connectPage(
        verifiedPageToConnect.id,
        verifiedPageToConnect.name,
        verifiedPageToConnect.access_token,
        workspaceId,
        userId,
        {
          category: verifiedPageToConnect.category,
          tasks: verifiedPageToConnect.tasks,
          botId: body.botId,
          userAccessToken: body.userAccessToken,
        },
      );

      const subscribed = await this.facebookOAuthService.subscribePageWebhooks(
        verifiedPageToConnect.id,
        verifiedPageToConnect.access_token,
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
      this.logger.error(`[FacebookOAuth] Connection failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to connect Facebook page',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('connections')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Get connected Facebook pages' })
  async getConnections(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const connections =
      await this.facebookOAuthService.getConnectedPages(workspaceId);

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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Disconnect a Facebook page' })
  async disconnectPage(
    @Request() req,
    @Param('id') connectionId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    await this.facebookOAuthService.disconnectPage(connectionId, workspaceId);

    return {
      success: true,
      message: 'Facebook page disconnected',
    };
  }

  @Post('connections/:id/test')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Test Facebook page connection' })
  async testConnection(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Body() body: { recipientId: string; message: string },
  ) {
    const connection = await this.channelsService.findOne(
      connectionId,
      workspaceId,
    );
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    const provider = this.channelStrategy.getProvider('facebook');

    if (provider.setCredentials && connection.accessToken) {
      provider.setCredentials(
        connection.accessToken,
        connection.credential?.clientSecret || '',
      );
    }

    const result = await provider.sendMessage({
      to: body.recipientId,
      content: body.message,
    });

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Failed to send test message',
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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
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
    const credential = await this.facebookOAuthService.updateCredential(
      workspaceId,
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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Get Facebook App credentials' })
  async getSetup(@Request() req, @CurrentWorkspace() workspaceId: string) {
    const credential =
      await this.facebookOAuthService.getCredential(workspaceId);

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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
  @ApiOperation({ summary: 'Sync conversations and messages from Facebook' })
  async syncMessages(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Query('conversation_limit') conversationLimit?: number,
    @Query('message_limit') messageLimit?: number,
  ) {
    // Get connection
    const connection = await this.channelsService.findOne(
      connectionId,
      workspaceId,
    );
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
  @UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
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
    const result =
      await this.facebookConversationSyncService.syncConversationsForChannel(
        connectionId,
        workspaceId,
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
