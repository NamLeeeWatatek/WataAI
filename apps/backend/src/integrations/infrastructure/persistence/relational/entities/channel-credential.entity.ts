import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { EncryptionTransformer } from '../../../../../utils/transformers/encryption.transformer';

@Entity({ name: 'channel_credential' })
export class ChannelCredentialEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  provider: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({
    type: String,
    nullable: true,
    transformer: new EncryptionTransformer(),
  })
  clientId?: string | null;

  @Column({
    type: String,
    nullable: true,
    transformer: new EncryptionTransformer(),
  })
  clientSecret?: string | null;

  @Column({ type: String, nullable: true })
  scopes?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any>;
}
