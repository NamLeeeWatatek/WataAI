import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { MessengerService } from './providers/messenger.service';
import { InstagramService } from './providers/instagram.service';
import { TelegramService } from './providers/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelConnectionEntity])],
  providers: [MessengerService, InstagramService, TelegramService],
  exports: [MessengerService, InstagramService, TelegramService],
})
export class MessagingModule {}
