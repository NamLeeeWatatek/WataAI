import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { BotEntity } from '../../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { ChannelConnectionEntity } from '../../../../../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';

@Entity({ name: 'channel' })
export class ChannelEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ name: 'connection_id', type: 'uuid', nullable: true })
  @Index()
  connectionId?: string | null;

  @Column({ type: String })
  type: string;

  @Column({ type: String })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @Column({ name: 'connected_at', type: 'timestamp', nullable: true })
  connectedAt?: Date | null;

  @ManyToOne(() => BotEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @ManyToOne(() => ChannelConnectionEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'connection_id' })
  connection?: ChannelConnectionEntity | null;
}
