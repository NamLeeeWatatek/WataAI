import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { ChannelCredentialEntity } from './channel-credential.entity';
import { EncryptionTransformer } from '../../../../../utils/transformers/encryption.transformer';
import {
  ChannelType,
  ChannelConnectionStatus,
} from '../../../../integrations.enum';

@Entity({ name: 'channel_connection' })
export class ChannelConnectionEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String, enum: ChannelType })
  type: ChannelType;

  @Column({ name: 'credential_id', type: 'uuid', nullable: true })
  credentialId?: string | null;

  @ManyToOne(() => ChannelCredentialEntity, { nullable: true })
  @JoinColumn({ name: 'credential_id' })
  credential?: ChannelCredentialEntity;

  @Column({ name: 'access_token', type: String, nullable: true })
  accessToken?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({
    type: String,
    default: ChannelConnectionStatus.ACTIVE,
    enum: ChannelConnectionStatus,
  })
  status: ChannelConnectionStatus;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'connected_at',
  })
  connectedAt: Date;
}
