import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import {
  ChannelCredentialEntity,
  ChannelConnectionEntity,
} from './infrastructure/persistence/relational/entities';
import { ChannelsModule } from '../channels/channels.module';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelCredentialEntity,
      ChannelConnectionEntity,
      WorkspaceEntity,
    ]),
    ChannelsModule,
  ],
  controllers: [IntegrationsController, OAuthController],
  providers: [IntegrationsService, OAuthService],
  exports: [IntegrationsService, OAuthService],
})
export class IntegrationsModule {}
