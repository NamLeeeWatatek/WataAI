import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CreationToolEntity } from '../../../../../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';

export enum CreationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({
  name: 'creation_jobs',
})
export class CreationJobEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CreationJobStatus,
    default: CreationJobStatus.PENDING,
  })
  @Index()
  status: CreationJobStatus;

  @ManyToOne(() => CreationToolEntity, { eager: false })
  @JoinColumn({ name: 'creation_tool_id' })
  creationTool: CreationToolEntity;

  // Utilize the relation column directly for ID if needed, or rely on TypeORM's handling.
  // Explicitly defining the column helps with DTO mapping without loading the relationship.
  @Column({ name: 'creation_tool_id', type: 'uuid' })
  @Index()
  creationToolId: string;

  @Column({ name: 'input_data', type: 'jsonb' })
  inputData: any;

  @Column({ name: 'output_data', type: 'jsonb', nullable: true })
  outputData: any;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  createdBy?: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
