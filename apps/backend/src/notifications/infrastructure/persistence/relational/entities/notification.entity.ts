import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'notification' })
export class NotificationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ type: String })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: String, default: 'info' })
  type: 'info' | 'success' | 'warning' | 'error';

  @Column({ name: 'is_read', type: Boolean, default: false })
  @Index()
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
