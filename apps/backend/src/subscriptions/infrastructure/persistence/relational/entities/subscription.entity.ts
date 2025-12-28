import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Entity({ name: 'plan' })
export class PlanEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true })
  name: string;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2 })
  priceMonthly: number;

  @Column({ name: 'price_yearly', type: 'decimal', precision: 10, scale: 2 })
  priceYearly: number;

  @Column({ name: 'max_bots', type: 'int' })
  maxBots: number;

  @Column({ name: 'max_messages', type: 'int' })
  maxMessages: number;

  @Column({ name: 'max_storage_gb', type: 'int' })
  maxStorageGb: number;

  @Column({ type: 'jsonb', nullable: true })
  features?: Record<string, any>;
}

@Entity({ name: 'subscription' })
export class SubscriptionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  @Index()
  planId: string;

  @Column({ type: String, default: 'active' })
  status: 'active' | 'canceled' | 'past_due' | 'trialing';

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ name: 'stripe_customer_id', type: String, nullable: true })
  @Index()
  stripeCustomerId?: string | null;

  @Column({ name: 'stripe_subscription_id', type: String, nullable: true })
  @Index()
  stripeSubscriptionId?: string | null;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @ManyToOne(() => PlanEntity)
  @JoinColumn({ name: 'plan_id' })
  plan?: PlanEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'usage_quota' })
@Index(['workspaceId', 'periodStart'], { unique: true })
export class UsageQuotaEntity extends EntityRelationalHelper {
  @Column({ name: 'workspace_id', type: 'uuid', primary: true })
  workspaceId: string;

  @Column({ name: 'period_start', type: 'date', primary: true })
  periodStart: Date;

  @Column({ name: 'messages_used', type: 'int', default: 0 })
  messagesUsed: number;

  @Column({
    name: 'storage_used_gb',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  storageUsedGb: number;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'invoice' })
export class InvoiceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  @Index()
  subscriptionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: String, default: 'draft' })
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  @Column({ name: 'pdf_url', type: String, nullable: true })
  pdfUrl?: string | null;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: SubscriptionEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
