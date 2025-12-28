import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'webhook_event' })
export class WebhookEventEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  @Index()
  channelId: string;

  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, any>;

  @Column({ type: String, default: 'pending' })
  @Index()
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn({ name: 'received_at' })
  @Index()
  receivedAt: Date;
}
