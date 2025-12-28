import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Entity({ name: 'file' })
export class FileEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column({ default: 'images' })
  bucket: string;

  @Column({ name: 'original_name', type: String, nullable: true })
  originalName?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @Column({ name: 'mime_type', type: String, nullable: true })
  mimeType?: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'is_temp', type: 'boolean', default: true })
  isTemp: boolean;
}
