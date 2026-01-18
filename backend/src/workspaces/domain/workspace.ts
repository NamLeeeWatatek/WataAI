import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

/**
 * Workspace domain entity - theo schema má»›i
 * Table: workspaces
 * Fields: id, name, slug, avatar_url, plan, owner_id, deleted_at, created_at, updated_at
 */
export class Workspace {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, description: 'Workspace avatar URL' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free',
  })
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';

  @ApiProperty({ type: String })
  ownerId: string;

  @ApiPropertyOptional({ type: () => User })
  owner?: User;

  @ApiPropertyOptional({ type: Date })
  deletedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * WorkspaceMember domain entity - theo schema má»›i
 * Table: workspace_members
 * Fields: workspace_id, user_id, role, joined_at
 */
export class WorkspaceMember {
  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  })
  role: 'owner' | 'admin' | 'member';

  @ApiPropertyOptional({ type: () => Workspace })
  workspace?: Workspace;

  @ApiPropertyOptional({ type: () => User })
  user?: User;

  @ApiProperty({ description: 'When user joined the workspace' })
  joinedAt: Date;
}
