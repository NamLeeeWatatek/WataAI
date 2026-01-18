import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'workspace' })
export class WorkspaceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String, unique: true })
  slug: string;

  @Column({ name: 'avatar_url', type: String, nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner?: UserEntity;

  @OneToMany(() => WorkspaceMemberEntity, (member) => member.workspace)
  members?: WorkspaceMemberEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../../../roles/roles.enum';

@Entity({ name: 'workspace_member' })
@Index(['workspaceId', 'userId'], { unique: true })
export class WorkspaceMemberEntity extends EntityRelationalHelper {
  @Column({ name: 'workspace_id', type: 'uuid', primary: true })
  workspaceId: string;

  @Column({ name: 'user_id', type: 'uuid', primary: true })
  userId: string;

  @Column({ name: 'role_id', type: 'int', default: RoleEnum.member })
  roleId: number;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: RoleEntity;

  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: WorkspaceEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
