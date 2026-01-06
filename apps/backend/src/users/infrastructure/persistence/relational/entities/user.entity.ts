import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';

@Entity({ name: 'user' })
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: String, nullable: true })
  name: string | null;

  @Column({ name: 'avatar_url', type: String, nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'password_hash', type: String, nullable: true })
  password?: string;

  @Column({ type: String, default: 'email' })
  provider: string;

  @Column({ name: 'provider_id', type: String, nullable: true })
  @Index()
  providerId?: string | null;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @ManyToOne(() => RoleEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ name: 'first_name', type: String, nullable: true })
  @Index()
  firstName?: string | null;

  @Column({ name: 'last_name', type: String, nullable: true })
  @Index()
  lastName?: string | null;

  @Column({ name: 'social_id', type: String, nullable: true })
  @Index()
  socialId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  notificationPreferences?: Record<string, any> | null;

  @Column({ name: 'external_id', type: String, unique: true, nullable: true })
  externalId?: string | null;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin?: Date | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
