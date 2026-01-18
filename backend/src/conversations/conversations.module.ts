import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConversationEntity,
  MessageEntity,
  MessageFeedbackEntity,
} from './infrastructure/persistence/relational/entities/conversation.entity';
import { AiConversationEntity } from './infrastructure/persistence/relational/entities/ai-conversation.entity';
import { ContactEntity } from './infrastructure/persistence/relational/entities/contact.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AiConversationsService } from './ai-conversations.service';
import { AiConversationsController } from './ai-conversations.controller';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationEventListener } from './listeners/conversation-event.listener';
import { ChannelsModule } from '../channels/channels.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      MessageFeedbackEntity,
      AiConversationEntity,
      ContactEntity,
    ]),
    forwardRef(() => ChannelsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => KnowledgeBaseModule),
    AiProvidersModule,
    forwardRef(() => WorkspacesModule),
    forwardRef(() => BotsModule),
    PermissionsModule,
  ],
  controllers: [ConversationsController, AiConversationsController],
  providers: [
    ConversationsService,
    AiConversationsService,
    ConversationsGateway,
    ConversationEventListener,
  ],
  exports: [
    ConversationsService,
    AiConversationsService,
    ConversationsGateway,
    ConversationEventListener,
  ],
})
export class ConversationsModule { }
