import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { ChannelsService } from '../channels/channels.service';
import { IntegrationsService } from './integrations.service';

@ApiTags('OAuth')
@Controller({ path: 'oauth', version: '1' })
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly channelsService: ChannelsService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('login/:provider')
  @ApiOperation({ summary: 'Start OAuth flow' })
  async login(
    @Param('provider') provider: string,
    @Query('state') state?: string,
    @Query('configId') configId?: string,
  ) {
    let url: string;

    const credential = configId
      ? await this.integrationsService.findById(configId)
      : await this.integrationsService.findOne(provider);

    if (!credential) {
      return { error: `No configuration found for ${provider}` };
    }

    switch (provider) {
      case 'facebook':
        url = this.oauthService.getFacebookAuthUrl(credential.clientId!, state);
        break;
      case 'google':
        url = this.oauthService.getGoogleAuthUrl(credential.clientId!, state);
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
    const userId = req.user?.id;
    if (!code) {
      return {
        status: 'error',
        message: 'No authorization code received',
      };
    }

    const credential = await this.integrationsService.findOne(provider);
    if (!credential) {
      return {
        status: 'error',
        message: `No configuration found for ${provider}`,
      };
    }

    let accessToken: string;
    let refreshToken: string | undefined;
    let pages: any[] = [];

    try {
      switch (provider) {
        case 'facebook': {
          const tokenData = await this.oauthService.exchangeFacebookCode(
            credential.clientId!,
            credential.clientSecret!,
            code,
          );
          accessToken = tokenData.accessToken;

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

      if (provider === 'facebook' && pages.length > 0) {
        for (const page of pages) {
          await this.channelsService.create(
            {
              name: page.name,
              type: 'facebook',
              accessToken: page.access_token,
              metadata: {
                pageId: page.id,
                category: page.category,
              },
            },
            userId,
          );

          await this.channelsService.create(
            {
              name: `${page.name} (Messenger)`,
              type: 'messenger',
              accessToken: page.access_token,
              metadata: {
                pageId: page.id,
                category: page.category,
              },
            },
            userId,
          );

          try {
            await this.channelsService.create(
              {
                name: `${page.name} (Instagram)`,
                type: 'instagram',
                accessToken: page.access_token,
                metadata: {
                  pageId: page.id,
                  category: page.category,
                },
              },
              userId,
            );
          } catch {}
        }
      } else {
        await this.channelsService.create(
          {
            name: `${provider} Account`,
            type: provider,
            accessToken,
            refreshToken,
            metadata: {},
          },
          userId,
        );
      }

      return {
        status: 'success',
        message: `Successfully connected to ${provider}`,
        data: {
          provider,
          pages: pages.length,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message:
          error.response?.data?.error?.message ||
          error.message ||
          'Failed to connect channel',
      };
    }
  }
}
