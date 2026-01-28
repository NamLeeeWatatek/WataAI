import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { BotEntity } from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationEntity,
  MessageEntity,
} from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { CreationToolEntity } from '../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
// import { GenerationJobEntity } from '../generation-jobs/infrastructure/persistence/relational/entities/generation-job.entity';
import { CreationJobEntity } from '../creation-jobs/infrastructure/persistence/relational/entities/creation-jobs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BotEntity,
      ConversationEntity,
      MessageEntity,
      // FlowEntity,
      // FlowExecutionEntity,
      WorkspaceEntity,
      CreationToolEntity,
      TemplateEntity,
      // GenerationJobEntity,
      CreationJobEntity,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule { }
