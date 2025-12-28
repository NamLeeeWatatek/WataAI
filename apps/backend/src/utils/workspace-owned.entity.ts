import {
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from './relational-entity-helper';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

export abstract class WorkspaceOwnedEntity extends EntityRelationalHelper {
  @Index()
  @Column({ name: 'workspace_id', type: 'uuid', nullable: false }) // Enforce mandatory workspace isolation
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @Index()
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Index()
  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
