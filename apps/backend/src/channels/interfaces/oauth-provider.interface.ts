export interface OAuthProviderInterface {
  getOAuthUrl(redirectUri: string, state?: string): string;

  exchangeCodeForToken(code: string, redirectUri: string): Promise<any>;

  getConnectableAccounts(accessToken: string): Promise<any[]>;
}
