import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';
import { AiModelType } from '../../../../domain/ai-provider';
import type {
  AiProviderConfigEntity,
  AiProviderEntity,
} from './ai-provider.entity';
import type { Relation } from 'typeorm';

@Entity({ name: 'ai_models' })
export class AiModelEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  @Index()
  name: string; // The raw identifier (e.g. 'gpt-4o', 'mistral:7b')

  @Column({ name: 'display_name', type: String, nullable: true })
  displayName?: string;

  @Column({
    type: String,
    enum: AiModelType,
    default: AiModelType.CHAT,
  })
  type: AiModelType;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId: string;

  @Column({ name: 'owner_type', type: String, enum: AiProviderOwnerType })
  @Index()
  ownerType: AiProviderOwnerType;

  @Column({ name: 'owner_id', type: 'uuid' })
  @Index()
  ownerId: string;

  @Column({ name: 'config_id', type: 'uuid', nullable: true })
  @Index()
  configId?: string; // Link to either UserAiProviderConfig or WorkspaceAiProviderConfig

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  // Relations
  @ManyToOne('AiProviderConfigEntity', (config: any) => config.models)
  @JoinColumn({ name: 'config_id', referencedColumnName: 'id' })
  config?: Relation<AiProviderConfigEntity>;

  @ManyToOne('AiProviderEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider?: Relation<AiProviderEntity>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
