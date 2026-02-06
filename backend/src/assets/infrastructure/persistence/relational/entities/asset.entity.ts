import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { AssetType } from '../../../../domain/asset';

@Entity({
  name: 'asset',
})
export class AssetEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  @Index()
  name: string;

  @Column({
    type: 'enum',
    enum: AssetType,
    default: AssetType.OTHER,
  })
  @Index()
  type: AssetType;

  @Column({ type: String })
  url: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: true })
  @Index()
  fileId?: string;

  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  @Index()
  jobId?: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  createdBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
