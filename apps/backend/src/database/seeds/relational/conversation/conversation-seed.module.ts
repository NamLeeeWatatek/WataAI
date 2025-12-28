import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationSeedService } from './conversation-seed.service';
import {
  ConversationEntity,
  MessageEntity,
} from '../../../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotEntity } from '../../../../bots/infrastructure/persistence/relational/entities/bot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity, BotEntity]),
  ],
  providers: [ConversationSeedService],
  exports: [ConversationSeedService],
})
export class ConversationSeedModule {}
