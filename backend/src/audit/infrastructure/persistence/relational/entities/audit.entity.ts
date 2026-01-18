import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'audit_log' })
export class AuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ type: String })
  @Index()
  action: string;

  @Column({ name: 'resource_type', type: String })
  @Index()
  resourceType: string;

  @Column({ name: 'resource_id', type: String })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ name: 'ip_address', type: String, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: String, nullable: true })
  userAgent?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}

@Entity({ name: 'data_access_log' })
export class DataAccessLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId: string;

  @Column({ name: 'table_name', type: String })
  @Index()
  tableName: string;

  @Column({ name: 'record_id', type: String })
  recordId: string;

  @Column({ type: String })
  action: 'read' | 'write' | 'delete';

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
