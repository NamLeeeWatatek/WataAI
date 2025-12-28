import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'contact' })
export class ContactEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string | null;

  @Column({ name: 'external_id', type: String, nullable: true })
  @Index()
  externalId?: string | null;

  @Column({ name: 'name', type: String, nullable: true })
  name?: string | null;

  @Column({ name: 'avatar', type: String, nullable: true })
  avatar?: string | null;

  @Column({ name: 'email', type: String, nullable: true })
  @Index()
  email?: string | null;

  @Column({ name: 'phone', type: String, nullable: true })
  @Index()
  phone?: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
