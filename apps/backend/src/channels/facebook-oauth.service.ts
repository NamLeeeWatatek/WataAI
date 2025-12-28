import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ChannelCredentialEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-credential.entity';
import { BaseOAuthService } from './services/base-oauth.service';
import axios from 'axios';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export interface FacebookUserPages {
  data: FacebookPage[];
}

@Injectable()
export class FacebookOAuthService extends BaseOAuthService {
  protected readonly logger = new Logger(FacebookOAuthService.name);
  protected readonly providerName = 'facebook';
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly apiVersion = 'v24.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChannelConnectionEntity)
    connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    credentialRepository: Repository<ChannelCredentialEntity>,
  ) {
    super(connectionRepository, credentialRepository);
  }

  getOAuthUrl(appId: string, redirectUri: string, state?: string): string {
    if (!appId) {
      throw new HttpException(
        'Facebook App ID not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = new URL('https://www.facebook.com/v24.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set(
      'scope',
      'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement',
    );
    url.searchParams.set('response_type', 'code');

    if (state) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    appId?: string,
    appSecret?: string,
  ): Promise<string> {
    this.validateCredentials(appId, appSecret);

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/oauth/access_token`,
        {
          params: {
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code: code,
          },
        },
      );

      return response.data.access_token;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message;
      const errorCode = errorData?.error?.code;
      const errorSubcode = errorData?.error?.error_subcode;

      this.logger.error('Token exchange failed:', errorData || error.message);

      // âœ… FIX: Better error message for used authorization code
      if (errorCode === 100 && errorSubcode === 36009) {
        throw new HttpException(
          'This authorization code has already been used. Please try connecting again from the beginning.',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        errorMessage || 'Failed to exchange code for token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getConnectableAccounts(accessToken: string): Promise<FacebookPage[]> {
    return this.getUserPages(accessToken);
  }

  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token,category,tasks',
          },
        },
      );

      const data: FacebookUserPages = response.data;
      return data.data || [];
    } catch (error: any) {
      this.logger.error(
        'Get pages failed:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.error?.message || 'Failed to get Facebook pages',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserInfo(
    userId: string,
    pageAccessToken: string,
  ): Promise<{
    name?: string;
    profile_pic?: string;
    first_name?: string;
    last_name?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${userId}`,
        {
          params: {
            access_token: pageAccessToken,
            fields: 'name,first_name,last_name,profile_pic',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.warn(
        `Get user info failed for ${userId}:`,
        error.response?.data || error.message,
      );
      return {};
    }
  }

  async connectPage(
    pageId: string,
    pageName: string,
    pageAccessToken: string,
    workspaceId: string,
    userId: string,
    metadata?: any,
  ): Promise<ChannelConnectionEntity> {
    return this.connectAccount(
      pageId,
      pageName,
      pageAccessToken,
      workspaceId,
      userId,
      {
        pageId,
        pageName,
        ...metadata,
      },
    );
  }

  async disconnectPage(
    connectionId: string,
    workspaceId: string,
  ): Promise<void> {
    return this.disconnectAccount(connectionId, workspaceId);
  }

  async getConnectedPages(
    workspaceId: string,
  ): Promise<ChannelConnectionEntity[]> {
    return this.getConnectedAccounts(workspaceId);
  }

  async getCredential(
    workspaceId: string,
    fallbackId?: string,
  ): Promise<ChannelCredentialEntity | null> {
    const searchWorkspaces = [workspaceId];
    if (fallbackId && fallbackId !== workspaceId) {
      searchWorkspaces.push(fallbackId);
    }

    // Try finding by workspaceId first, then by fallbackId (e.g. userId for legacy support)
    for (const id of searchWorkspaces) {
      const cred = await this.credentialRepository.findOne({
        where: [
          { provider: 'facebook', workspaceId: id, isActive: true },
          { provider: 'messenger', workspaceId: id, isActive: true },
          { provider: 'instagram', workspaceId: id, isActive: true },
        ],
      });
      if (cred) return cred;
    }

    return null;
  }

  async getOrCreateCredential(
    workspaceId: string,
    appId?: string,
    appSecret?: string,
    verifyToken?: string,
  ): Promise<ChannelCredentialEntity> {
    let credential = await this.getCredential(workspaceId, workspaceId); // Fallback to same if not specified

    if (!credential && appId && appSecret) {
      credential = await this.updateCredential(
        workspaceId,
        appId,
        appSecret,
        verifyToken ? { verifyToken } : undefined,
      );
    }

    if (!credential) {
      throw new HttpException(
        'Facebook App not configured. Please setup your Facebook App in Integrations settings first.',
        HttpStatus.NOT_FOUND,
      );
    }

    return credential;
  }

  async updateCredential(
    workspaceId: string,
    appId: string,
    appSecret: string,
    metadata?: Record<string, any>,
  ): Promise<ChannelCredentialEntity> {
    const verifyToken = metadata?.verifyToken as string | undefined;

    if (!verifyToken) {
      throw new HttpException(
        'Verify token is required for Facebook webhook setup',
        HttpStatus.BAD_REQUEST,
      );
    }

    return super.updateCredential(workspaceId, appId, appSecret, {
      verifyToken,
      apiVersion: this.apiVersion,
      ...metadata,
    });
  }

  async subscribePageWebhooks(
    pageId: string,
    pageAccessToken: string,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: pageAccessToken,
            subscribed_fields:
              'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads',
          },
        },
      );

      const data = response.data;
      this.logger.log(`Subscribed to webhooks for page ${pageId}:`, data);
      return data.success === true;
    } catch (error: any) {
      this.logger.error(
        'Subscribe webhooks error:',
        error.response?.data || error.message,
      );
      return false;
    }
  }
}
