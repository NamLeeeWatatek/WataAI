import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from './infrastructure/persistence/relational/entities/bot.entity';
import { WidgetVersionEntity } from './infrastructure/persistence/relational/entities/widget-version.entity';
import { WidgetDeploymentEntity } from './infrastructure/persistence/relational/entities/widget-deployment.entity';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { ContactEntity } from '../conversations/infrastructure/persistence/relational/entities/contact.entity';
import { ChannelEntity } from '../channels/infrastructure/persistence/relational/entities/channel.entity';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { PublicBotController } from './controllers/public-bot.controller';
import { PublicWidgetController } from './controllers/public-widget.controller';
import { WidgetVersionController } from './controllers/widget-version.controller';
import { WidgetDeploymentController } from './controllers/widget-deployment.controller';
import { BotChannelsController } from './controllers/bot-channels.controller';
import { BotKnowledgeBasesController } from './controllers/bot-knowledge-bases.controller';
import { BotFunctionsController } from './controllers/bot-functions.controller';
import { PublicBotService } from './services/public-bot.service';
import { WidgetVersionService } from './services/widget-version.service';
import { BotExecutionService } from './bot-execution.service';
import { BotFunctionsService } from './bot-functions.service';
import { BotInteractionService } from './bot-interaction.service';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { MessagingModule } from '../channels/messaging.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { BotEventListener } from './listeners/bot-event.listener';
import { BotExecutionEventService } from './listeners/bot-execution-event.service';
import { MessageBufferService } from './services/message-buffer.service';
import { BotAppearanceService } from './services/bot-appearance.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { FilesModule } from '../files/files.module';

import { WidgetAppearanceController } from './controllers/widget-appearance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BotEntity,
      // FlowVersionEntity,
      BotKnowledgeBaseEntity,
      WidgetVersionEntity,
      WidgetDeploymentEntity,
      WorkspaceMemberEntity,
      ConversationEntity,
      MessageEntity,
      ChannelEntity,
      ContactEntity,
    ]),
    forwardRef(() => WorkspacesModule),
    forwardRef(() => AiProvidersModule),
    forwardRef(() => KnowledgeBaseModule),
    forwardRef(() => ConversationsModule),
    MessagingModule,
    PermissionsModule,
    FilesModule,
  ],
  controllers: [
    BotsController,
    PublicBotController,
    PublicWidgetController,
    WidgetVersionController,
    WidgetDeploymentController,
    WidgetAppearanceController,
    BotChannelsController,
    BotKnowledgeBasesController,
    BotFunctionsController,
  ],
  providers: [
    BotsService,
    PublicBotService,
    WidgetVersionService,
    BotExecutionService,
    BotFunctionsService,
    BotInteractionService,
    BotEventListener,
    BotExecutionEventService,
    MessageBufferService,
    BotAppearanceService,
  ],
  exports: [
    BotsService,
    PublicBotService,
    WidgetVersionService,
    BotExecutionService,
    BotFunctionsService,
    BotInteractionService,
    BotExecutionEventService,
    MessageBufferService,
    BotAppearanceService,
  ],
})
export class BotsModule { }
