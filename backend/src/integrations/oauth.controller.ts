import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { ChannelsService } from '../channels/channels.service';
import { IntegrationsService } from './integrations.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

@ApiTags('OAuth')
@Controller({ path: 'oauth', version: '1' })
export class OAuthController {
  private readonly logger = new Logger('OAuthController');

  constructor(
    private readonly oauthService: OAuthService,
    private readonly channelsService: ChannelsService,
    private readonly integrationsService: IntegrationsService,
  ) { }

  @Get('login/:provider')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Start OAuth flow' })
  async login(
    @Param('provider') provider: string,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Query('state') state?: string,
    @Query('configId') configId?: string,
  ) {
    const userId = req.user?.id;

    const credential = configId
      ? await this.integrationsService.findById(configId)
      : await this.integrationsService.findOne(provider, workspaceId);

    if (!credential) {
      this.logger.error(
        `[OAuth] No configuration found for ${provider} (configId: ${configId}, workspaceId: ${workspaceId})`,
      );
      return { error: `No configuration found for ${provider}` };
    }

    // CRITICAL: Use workspaceId from the credential as the source of truth
    const targetWorkspaceId = credential.workspaceId;

    if (!targetWorkspaceId) {
      this.logger.error(
        `[OAuth] Credential ${credential.id} has no workspaceId!`,
      );
      throw new BadRequestException(
        'Configuration is invalid: missing workspace context',
      );
    }

    this.logger.log(
      `[OAuth] Using targetWorkspaceId: ${targetWorkspaceId} from credential ${credential.id}`,
    );

    const finalState = state
      ? `${state}:${targetWorkspaceId}`
      : `${userId}:${targetWorkspaceId}`;
    let url: string;

    switch (provider) {
      case 'facebook':
        url = this.oauthService.getFacebookAuthUrl(
          credential.clientId!,
          finalState,
        );
        break;
      case 'google':
        url = this.oauthService.getGoogleAuthUrl(
          credential.clientId!,
          finalState,
        );
        break;
      default:
        return { error: 'Unsupported provider' };
    }

    return { url };
  }

  @Get('callback/:provider')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Request() req,
  ) {
    let userId = req.user?.id;
    let workspaceId: string | undefined;

    if (state) {
      const parts = state.split(':');
      if (parts.length > 1) {
        if (!userId) userId = parts[0];
        workspaceId = parts[1];
      } else {
        this.logger.error(
          `[OAuth] Invalid state format: ${state}. Expected userId:workspaceId`,
        );
        return {
          status: 'error',
          message: 'Invalid authorization state. Please try again.',
        };
      }
    }

    this.logger.log(
      `[OAuth] Callback processing for ${provider}, Workspace: ${workspaceId}, User: ${userId}`,
    );

    if (!workspaceId) {
      this.logger.error(
        `[OAuth] Callback failed: Could not extract workspaceId from state: ${state}`,
      );
      return {
        status: 'error',
        message: 'Workspace context lost in OAuth flow',
      };
    }
    if (!code) {
      return {
        status: 'error',
        message: 'No authorization code received',
      };
    }

    const credential = await this.integrationsService.findOne(
      provider,
      workspaceId,
    );
    if (!credential) {
      this.logger.error(
        `[OAuth] Callback failed: No configuration found for ${provider} in workspace ${workspaceId}`,
      );
      return {
        status: 'error',
        message: `No configuration found for ${provider}`,
      };
    }

    let accessToken: string;
    let refreshToken: string | undefined;
    let pages: {
      id: string;
      name: string;
      access_token: string;
      category: string;
    }[] = [];

    try {
      switch (provider) {
        case 'facebook': {
          const tokenData = await this.oauthService.exchangeFacebookCode(
            credential.clientId!,
            credential.clientSecret!,
            code,
          );
          if (typeof tokenData === 'string') {
            accessToken = tokenData;
          } else {
            accessToken = tokenData.accessToken;
          }

          pages = await this.oauthService.getFacebookPages(accessToken);
          break;
        }
        case 'google': {
          const tokenData = await this.oauthService.exchangeGoogleCode(
            credential.clientId!,
            credential.clientSecret!,
            code,
          );
          accessToken = tokenData.accessToken;
          refreshToken = tokenData.refreshToken;
          break;
        }
        default:
          return {
            status: 'error',
            message: `Unsupported provider: ${provider}`,
          };
      }

      // For Facebook, we don't auto-connect everything.
      // Instead, we return the discovered pages to the frontend for selection.
      if (provider !== 'facebook') {
        await this.channelsService.create(
          {
            name: `${provider} Account`,
            type: provider,
            credentialId: credential.id,
            accessToken,
            refreshToken,
            metadata: {},
          },
          workspaceId,
        );
      }

      return {
        status: 'success',
        message:
          provider === 'facebook'
            ? `Successfully authenticated with ${provider}. Please select which terminals to connect.`
            : `Successfully connected to ${provider}`,
        data: {
          provider,
          pages: provider === 'facebook' ? pages : [],
          tempToken: accessToken,
        },
      };
    } catch (error) {
      const axios = (await import('axios')).default;
      let message = 'Failed to connect channel';

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message || error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      return {
        status: 'error',
        message,
      };
    }
  }
}
