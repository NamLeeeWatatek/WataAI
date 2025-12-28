import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OAuthService {
  constructor(private configService: ConfigService) {}

  getFacebookAuthUrl(clientId: string, state?: string): string {
    const redirectUri =
      this.configService.get<string>('FACEBOOK_REDIRECT_URI', {
        infer: true,
      }) || 'http://localhost:3000/oauth/callback/facebook';

    const scopes = [
      'pages_show_list',
      'pages_messaging',
      'pages_manage_metadata',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: state || '',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeFacebookCode(
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    const redirectUri =
      this.configService.get<string>('FACEBOOK_REDIRECT_URI', {
        infer: true,
      }) || 'http://localhost:3000/oauth/callback/facebook';

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const response = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`,
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  async getFacebookPages(accessToken: string): Promise<any[]> {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: { access_token: accessToken },
      },
    );

    return response.data.data || [];
  }

  getGoogleAuthUrl(clientId: string, state?: string): string {
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI', { infer: true }) ||
      'http://localhost:3000/oauth/callback/google';

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
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI', { infer: true }) ||
      'http://localhost:3000/oauth/callback/google';

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
}
