import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OAuthService {
  constructor(private configService: ConfigService) {}

  getFacebookAuthUrl(clientId: string, state?: string): string {
    const redirectUri = this.getRedirectUri('facebook');

    const scopes = [
      'pages_show_list',
      'pages_messaging',
      'pages_manage_metadata',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      auth_type: 'rerequest', // FORCE Facebook to ask for new permissions
      state: state || '',
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeFacebookCode(
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    const redirectUri = this.getRedirectUri('facebook');

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const response = await axios.get(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  async getFacebookPages(accessToken: string): Promise<any[]> {
    let pages: any[] = [];
    let url: string | undefined =
      `https://graph.facebook.com/v21.0/me/accounts`;
    let params: any = {
      access_token: accessToken,
      fields: 'name,access_token,id,tasks,category', // Explicitly request token
      limit: 100,
    };

    while (url) {
      const response = await axios.get(url, { params });
      const data = response.data;
      if (data.data) {
        pages = pages.concat(data.data);
      }
      url = data.paging?.next;
      params = undefined; // Subsequent URLs already contain params
    }

    return pages;
  }

  async getFacebookPage(accessToken: string, pageId: string): Promise<any> {
    try {
      console.log(
        `[OAuth] Fetching Page ${pageId} via /me/accounts using User Token ending ...${accessToken.slice(-10)}`,
      );

      let url: string | undefined =
        `https://graph.facebook.com/v21.0/me/accounts`;
      let params: any = {
        access_token: accessToken,
        fields: 'name,access_token,id,tasks,category',
        limit: 100,
      };

      while (url) {
        const response = await axios.get(url, { params });
        const data = response.data;

        if (data.data && Array.isArray(data.data)) {
          const foundPage = data.data.find((p: any) => p.id === pageId);
          if (foundPage) {
            console.log(
              `[OAuth] Successfully found Page ${pageId} and retrieved Page Access Token.`,
            );
            return foundPage;
          }
        }

        url = data.paging?.next;
        params = undefined; // Next URL already contains the necessary parameters
      }

      console.warn(
        `[OAuth] Page ${pageId} not found in the user's accounts list. User might not have permission or role.`,
      );
      return null;
    } catch (error) {
      console.error(
        `[OAuth] getFacebookPage Failed: ${error.message}`,
        error.response?.data,
      );
      if (
        axios.isAxiosError(error) &&
        error.response &&
        (error.response.status === 400 || error.response.status === 401)
      ) {
        console.error(
          `[OAuth] Possible Token/Permission Issue. Scope 'pages_show_list' might be missing.`,
        );
      }
      throw error;
    }
  }

  async postToFacebookPage(
    pageAccessToken: string,
    pageId: string,
    message: string,
    imageUrl?: string,
    scheduledTime?: number,
  ): Promise<any> {
    const params: any = {
      access_token: pageAccessToken,
    };

    if (imageUrl) {
      params.url = imageUrl;
      params.caption = message;
    } else {
      params.message = message;
    }

    if (scheduledTime) {
      params.published = false;
      params.scheduled_publish_time = scheduledTime;
    }

    const endpoint = imageUrl
      ? `https://graph.facebook.com/v21.0/${pageId}/photos`
      : `https://graph.facebook.com/v21.0/${pageId}/feed`;

    try {
      console.log(`[OAuth] Posting to ${endpoint} with params:`, {
        ...params,
        access_token: '***',
      });
      const response = await axios.post(endpoint, null, { params });
      return response.data;
    } catch (error) {
      console.error(
        '[OAuth] Facebook Post Error Details:',
        error.response?.data || error.message,
      );
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Facebook API Error: ${error.response.data.error.message} (Code: ${error.response.data.error.code})`,
        );
      }
      throw error;
    }
  }

  getGoogleAuthUrl(clientId: string, state?: string): string {
    const redirectUri = this.getRedirectUri('google');

    const scopes = ['https://www.googleapis.com/auth/business.manage'].join(
      ' ',
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeGoogleCode(
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    const redirectUri = this.getRedirectUri('google');

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  private getRedirectUri(provider: 'facebook' | 'google'): string {
    const configValue = this.configService.get<string>(
      provider === 'facebook' ? 'facebook.redirectUri' : 'google.redirectUri',
      { infer: true },
    );

    if (configValue) return configValue;

    const frontendDomain = this.configService.get<string>(
      'app.frontendDomain',
      {
        infer: true,
      },
    );
    const base = frontendDomain
      ? frontendDomain.endsWith('/')
        ? frontendDomain.slice(0, -1)
        : frontendDomain
      : 'http://localhost:3000';

    if (provider === 'facebook') {
      return `${base}/channels/callback/facebook`;
    }

    return `${base}/oauth/callback/${provider}`;
  }
}
