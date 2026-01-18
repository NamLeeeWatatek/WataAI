import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BotEntity } from './bot.entity';
import { WidgetVersionEntity } from './widget-version.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';

@Entity({ name: 'widget_deployment' })
export class WidgetDeploymentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ name: 'widget_version_id', type: 'uuid' })
  @Index()
  widgetVersionId: string;

  @Column({ name: 'deployed_by', type: 'uuid', nullable: true })
  deployedBy?: string | null;

  @Column({ name: 'deployed_at', type: 'timestamp', default: () => 'NOW()' })
  @Index()
  deployedAt: Date;

  @Column({ name: 'deployment_type', type: 'varchar', length: 20 })
  deploymentType: 'publish' | 'rollback' | 'canary';

  @Column({ name: 'previous_version_id', type: 'uuid', nullable: true })
  previousVersionId?: string | null;

  @Column({ name: 'rollback_reason', type: 'text', nullable: true })
  rollbackReason?: string | null;

  @Column({ name: 'traffic_percentage', type: 'int', default: 100 })
  trafficPercentage: number;

  @Column({ type: 'varchar', length: 20 })
  status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @ManyToOne(() => BotEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @ManyToOne(() => WidgetVersionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'widget_version_id' })
  widgetVersion?: WidgetVersionEntity;

  @ManyToOne(() => WidgetVersionEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'previous_version_id' })
  previousVersion?: WidgetVersionEntity;
}
