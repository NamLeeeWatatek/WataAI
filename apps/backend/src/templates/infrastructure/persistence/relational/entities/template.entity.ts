import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CreationToolEntity } from '../../../../../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';

@Entity({ name: 'template' })
export class TemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'creation_tool_id', type: 'uuid', nullable: true })
  @Index()
  creationToolId?: string | null;

  @ManyToOne(() => CreationToolEntity, { eager: false })
  @JoinColumn({ name: 'creation_tool_id' })
  creationTool?: CreationToolEntity | null;

  @Column({ type: String })
  @Index()
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  prompt?: string | null;

  @Column({ name: 'media_files', type: 'jsonb', nullable: true })
  mediaFiles?: string[] | null;

  @Column({ name: 'style_config', type: 'jsonb', nullable: true })
  styleConfig?: Record<string, any> | null;

  @ManyToOne(() => CategoryEntity, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity | null;

  @Column({ name: 'prefilled_data', type: 'jsonb', nullable: true })
  prefilledData?: Record<string, any> | null;

  @Column({ name: 'thumbnail_url', type: String, nullable: true })
  thumbnailUrl?: string | null;

  @Column({ name: 'execution_overrides', type: 'jsonb', nullable: true })
  executionOverrides?: Record<string, any> | null;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  createdBy?: string | null;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'prompt_template', type: 'text', nullable: true })
  promptTemplate?: string | null;

  @Column({ name: 'execution_config', type: 'jsonb', nullable: true })
  executionConfig?: any | null;

  @Column({ name: 'form_schema', type: 'jsonb', nullable: true })
  formSchema?: any | null;

  @Column({ name: 'input_schema', type: 'jsonb', nullable: true })
  inputSchema?: any[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
