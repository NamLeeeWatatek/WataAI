import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { Workspace } from '../../workspaces/domain/workspace';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: number;

  @ApiProperty({
    type: () => User,
  })
  user: User;

  @ApiPropertyOptional({
    type: () => Workspace,
    description: 'User default workspace',
  })
  workspace?: Workspace;

  @ApiPropertyOptional({
    type: [Workspace],
    description: 'All user workspaces',
  })
  workspaces?: Workspace[];
}
