import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EncryptionTransformer } from '../../../../../utils/transformers/encryption.transformer';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';
import { AiModelEntity } from './ai-model.entity';

@Entity({ name: 'ai_providers' })
export class AiProviderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: String, unique: true })
  key: string;

  @Column({ name: 'label', type: String })
  label: string;

  @Column({ name: 'icon', type: String, nullable: true })
  icon?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'required_fields', type: 'jsonb', default: [] })
  requiredFields: string[];

  @Column({ name: 'optional_fields', type: 'jsonb', default: [] })
  optionalFields: string[];

  @Column({ name: 'default_values', type: 'jsonb', default: {} })
  defaultValues: Record<string, unknown>;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @OneToMany(() => AiProviderConfigEntity, (config) => config.provider)
  configs?: AiProviderConfigEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'ai_provider_configs' })
export class AiProviderConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId: string;

  @Column({ name: 'display_name', type: String, nullable: true })
  displayName: string;

  @Column({ name: 'config', type: 'jsonb' })
  config: Record<string, unknown>;

  @Column({ name: 'model_list', type: 'jsonb', default: [] })
  modelList: string[];

  @Column({
    name: 'owner_type',
    type: String,
    enum: AiProviderOwnerType,
  })
  @Index()
  ownerType: AiProviderOwnerType;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  @Index()
  ownerId?: string;

  @Column({ name: 'is_default', type: Boolean, default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @ManyToOne(() => AiProviderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider?: AiProviderEntity;

  @OneToMany(() => AiModelEntity, (model) => model.config)
  models?: AiModelEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'ai_usage_log' })
export class AiUsageLogEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // workspaceId and relation are now inherited from WorkspaceOwnedEntity

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: String })
  provider: string;

  @Column({ type: String })
  model: string;

  @Column({ name: 'input_tokens', type: 'int' })
  inputTokens: number;

  @Column({ name: 'output_tokens', type: 'int' })
  outputTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  cost: number;

  @Column({
    name: 'requested_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index()
  requestedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;
}

@Entity({ name: 'system_ai_settings' })
export class SystemAiSettingsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'default_provider_id', type: String, nullable: true })
  defaultProviderId?: string;

  @Column({ name: 'default_model', type: String, nullable: true })
  defaultModel?: string;

  @Column({
    name: 'min_temperature',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 0.0,
  })
  minTemperature: number;

  @Column({
    name: 'max_temperature',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 2.0,
  })
  maxTemperature: number;

  @Column({ name: 'content_moderation', type: Boolean, default: true })
  contentModeration: boolean;

  @Column({ name: 'safe_fallbacks', type: Boolean, default: true })
  safeFallbacks: boolean;

  @Column({ name: 'context_aware', type: Boolean, default: true })
  contextAware: boolean;

  @Column({
    name: 'max_requests_per_hour',
    type: 'int',
    default: 1000,
  })
  maxRequestsPerHour: number;

  @Column({
    name: 'max_requests_per_user',
    type: 'int',
    default: 100,
  })
  maxRequestsPerUser: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
