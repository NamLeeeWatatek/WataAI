import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotSeedService } from './bot-seed.service';
import { BotEntity } from '../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { WorkspaceEntity } from '../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BotEntity, UserEntity, WorkspaceEntity])],
  providers: [BotSeedService],
  exports: [BotSeedService],
})
export class BotSeedModule {}
