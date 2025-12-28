import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ChannelCredentialEntity } from '../../integrations/infrastructure/persistence/relational/entities/channel-credential.entity';
import { OAuthProviderInterface } from '../interfaces/oauth-provider.interface';
import {
  ChannelConnectionStatus,
  ChannelType,
} from '../../integrations/integrations.enum';

/**
 * Base OAuth Service
 * Provides common functionality for all OAuth-based channel integrations
 */
export abstract class BaseOAuthService implements OAuthProviderInterface {
  protected abstract readonly logger: Logger;
  protected abstract readonly providerName: string;

  constructor(
    protected readonly connectionRepository: Repository<ChannelConnectionEntity>,
    protected readonly credentialRepository: Repository<ChannelCredentialEntity>,
  ) {}

  abstract getOAuthUrl(redirectUri: string, state?: string): string;
  abstract exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<any>;
  abstract getConnectableAccounts(accessToken: string): Promise<any[]>;

  async getCredential(
    workspaceId: string,
  ): Promise<ChannelCredentialEntity | null> {
    return this.credentialRepository.findOne({
      where: {
        provider: this.providerName,
        workspaceId: workspaceId,
        isActive: true,
      },
    });
  }

  async updateCredential(
    workspaceId: string,
    clientId: string,
    clientSecret: string,
    metadata?: Record<string, any>,
  ): Promise<ChannelCredentialEntity> {
    let credential = await this.credentialRepository.findOne({
      where: {
        provider: this.providerName,
        workspaceId: workspaceId,
      },
    });

    if (credential) {
      credential.clientId = clientId;
      credential.clientSecret = clientSecret;
      credential.isActive = true;
      credential.metadata = {
        ...credential.metadata,
        ...metadata,
      };
    } else {
      credential = this.credentialRepository.create({
        provider: this.providerName,
        workspaceId: workspaceId,
        name: `${this.providerName.charAt(0).toUpperCase() + this.providerName.slice(1)} App`,
        clientId: clientId,
        clientSecret: clientSecret,
        isActive: true,
        metadata: metadata || {},
      });
    }

    return this.credentialRepository.save(credential);
  }

  async getConnectedAccounts(
    workspaceId: string,
  ): Promise<ChannelConnectionEntity[]> {
    return this.connectionRepository.find({
      where: {
        type: this.providerName as ChannelType,
        workspaceId: workspaceId,
        status: ChannelConnectionStatus.ACTIVE,
      },
      order: {
        connectedAt: 'DESC',
      },
    });
  }

  async connectAccount(
    accountId: string,
    accountName: string,
    accessToken: string,
    workspaceId: string,
    userId: string,
    metadata?: any,
  ): Promise<ChannelConnectionEntity> {
    try {
      const allConnections = await this.connectionRepository.find({
        where: {
          type: this.providerName as ChannelType,
          workspaceId: workspaceId,
        },
      });

      const existingConnection = allConnections.find(
        (conn) =>
          conn.metadata?.accountId === accountId ||
          conn.metadata?.pageId === accountId,
      );

      if (existingConnection) {
        // âœ… FIX: Ensure credential is linked
        const credential = await this.getCredential(workspaceId);

        existingConnection.accessToken = accessToken;
        existingConnection.credentialId = credential?.id; // âœ… Update credential link
        existingConnection.status = ChannelConnectionStatus.ACTIVE;
        existingConnection.connectedAt = new Date();
        existingConnection.metadata = {
          ...existingConnection.metadata,
          ...metadata,
          accountId,
          accountName,
        };

        this.logger.log(
          `âœ… Updating connection with credentialId: ${credential?.id}`,
        );
        return this.connectionRepository.save(existingConnection);
      }

      // âœ… FIX: Get or create credential for this workspace
      const credential = await this.getCredential(workspaceId);

      const connection = this.connectionRepository.create({
        name: `${accountName} - ${this.providerName.charAt(0).toUpperCase() + this.providerName.slice(1)}`,
        type: this.providerName as ChannelType,
        workspaceId: workspaceId,
        credentialId: credential?.id, // âœ… Link to credential
        accessToken: accessToken,
        status: ChannelConnectionStatus.ACTIVE,
        connectedAt: new Date(),
        metadata: {
          accountId,
          accountName,
          ...metadata,
          connectedBy: userId,
        },
      });

      this.logger.log(
        `âœ… Creating connection with credentialId: ${credential?.id}`,
      );
      return this.connectionRepository.save(connection);
    } catch (error) {
      this.logger.error('Connect account error:', error);
      throw new HttpException(
        `Failed to connect ${this.providerName} account`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async disconnectAccount(
    connectionId: string,
    workspaceId: string,
  ): Promise<void> {
    try {
      // âœ… FIX: Update conversations to set channelId to null
      // This prevents orphaned references
      // Use snake_case column names as they appear in database
      const updateResult = await this.connectionRepository.manager.query(
        `UPDATE conversation SET channel_id = NULL, channel_type = 'internal' WHERE channel_id = $1`,
        [connectionId],
      );

      this.logger.log(
        `âœ… Updated ${updateResult[1] || 0} conversations to remove reference to channel ${connectionId}`,
      );

      // Then delete the channel connection
      await this.connectionRepository.delete({
        id: connectionId,
        workspaceId: workspaceId,
      });

      this.logger.log(
        `âœ… Disconnected ${this.providerName} account ${connectionId}`,
      );
    } catch (error) {
      this.logger.error(`âŒ Disconnect account error:`, error);
      throw new HttpException(
        `Failed to disconnect ${this.providerName} account: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  protected validateCredentials(
    clientId?: string,
    clientSecret?: string,
  ): void {
    if (!clientId || !clientSecret) {
      throw new HttpException(
        `${this.providerName.charAt(0).toUpperCase() + this.providerName.slice(1)} credentials not configured`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
