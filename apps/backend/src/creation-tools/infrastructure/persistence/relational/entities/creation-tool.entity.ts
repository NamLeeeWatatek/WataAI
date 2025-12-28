import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';

@Entity({ name: 'creation_tool' })
export class CreationToolEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  @Index()
  name: string;

  @Column({ type: String, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: String, nullable: true })
  icon?: string;

  @Column({ name: 'cover_image', type: String, nullable: true })
  coverImage?: string;

  @ManyToOne(() => CategoryEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column({ name: 'form_config', type: 'jsonb' })
  formConfig: any;

  @Column({ name: 'execution_flow', type: 'jsonb' })
  executionFlow: any;

  @Column({ name: 'is_active', type: Boolean, default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  @Index()
  workspaceId?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
